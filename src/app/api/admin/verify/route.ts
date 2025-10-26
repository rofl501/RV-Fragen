import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      return NextResponse.json({ isAdmin: false });
    }
    
    const decoded = verifyToken(token);
    
    return NextResponse.json({ 
      isAdmin: decoded !== null,
      username: decoded?.username 
    });
  } catch (error) {
    return NextResponse.json({ isAdmin: false });
  }
}

