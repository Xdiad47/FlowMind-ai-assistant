// src/app/api/calendar/events/route.ts
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return new NextResponse('Unauthorized', { status: 401 });

  // @ts-expect-error
  const token = session.user.accessToken;
  const { searchParams } = new URL(req.url);

  try {
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/calendar/events?${searchParams.toString()}`, {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
    
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return new NextResponse('Unauthorized', { status: 401 });

  // @ts-expect-error
  const token = session.user.accessToken;

  try {
    const body = await req.json();
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/calendar/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}) 
      },
      body: JSON.stringify(body)
    });
    
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
