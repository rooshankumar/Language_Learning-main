
import { NextResponse } from 'next/server';
import { getUserChats, getChatWithUser } from '@/lib/chat-service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const otherUserId = url.searchParams.get('otherUserId');

    if (otherUserId && userId) {
      const result = await getChatWithUser(userId, otherUserId);
      return NextResponse.json(result);
    } else if (userId) {
      const result = await getUserChats(userId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Missing user ID' }, { status: 400 });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
