import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, addQuestion, checkRateLimit } from '@/lib/db';
import { sanitizeInput, validateQuestion } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

// GET all questions with filtering and sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, upvotes
    const timeFilter = searchParams.get('timeFilter') || 'all'; // all, 24h, 7d, 30d

    let questions = getQuestions();
    
    // Filter out hidden questions (only admins should see them)
    questions = questions.filter(q => !q.hidden);
    
    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeFilter) {
        case '24h':
          filterDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          filterDate.setDate(now.getDate() - 30);
          break;
      }
      
      questions = questions.filter(q => new Date(q.timestamp) >= filterDate);
    }
    
    // Apply sorting
    if (sortBy === 'upvotes') {
      questions.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      // Default: sort by recent (newest first)
      questions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    
    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;
    
    // Sanitize and validate input
    const sanitizedText = sanitizeInput(text);
    const validation = validateQuestion(sanitizedText);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Get IP address
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit (10 questions per day per IP - more restrictive)
    if (!checkRateLimit(ip, 10)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit erreicht. Maximum 10 Fragen pro Tag.' },
        { status: 429 }
      );
    }
    
    // No categories - use empty string
    const sanitizedCategory = '';

    const question = addQuestion(sanitizedText, sanitizedCategory);
    
    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

