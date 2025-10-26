import { NextRequest, NextResponse } from 'next/server';
import { upvoteQuestion } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId } = body;
    
    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }
    
    // Get IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const result = upvoteQuestion(questionId, ip);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Already upvoted' ? 409 : 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      question: result.question,
      upvotes: result.question?.upvotes 
    });
  } catch (error) {
    console.error('Error upvoting question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upvote question' },
      { status: 500 }
    );
  }
}

