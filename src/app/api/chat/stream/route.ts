// src/app/api/chat/stream/route.ts
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    
    // @ts-expect-error - Custom property added in session callback
    const token = session.user.accessToken;

    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? {
          'Authorization': `Bearer ${token}`,
          'x-google-access-token': token,
        } : {})
      },
      body: JSON.stringify(body)
    });

    if (!backendResponse.body) {
      throw new Error('Backend response body is empty');
    }

    return new Response(backendResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error proxying chat stream:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
