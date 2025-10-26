import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getQuestions, saveQuestions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify admin token from cookie
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { questionId, resolved } = await request.json();
    
    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID required' },
        { status: 400 }
      );
    }
    
    // Update question
    const questions = getQuestions();
    const questionIndex = questions.findIndex(q => q.id === questionId);
    
    if (questionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    questions[questionIndex].resolved = resolved;
    if (resolved) {
      questions[questionIndex].resolvedAt = new Date().toISOString();
    } else {
      delete questions[questionIndex].resolvedAt;
    }
    
    saveQuestions(questions);
    
    return NextResponse.json({ 
      success: true, 
      question: questions[questionIndex] 
    });
  } catch (error) {
    console.error('Resolve error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

