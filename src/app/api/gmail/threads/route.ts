export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

function makeHeaders(token: string | undefined): Record<string, string> {
  if (!token) return {};
  return { 'Authorization': `Bearer ${token}`, 'x-google-access-token': token };
}

// Backend returns snake_case; frontend model expects camelCase
function transformThread(t: Record<string, unknown>) {
  const from = (t.from_contact ?? { email: '', name: null }) as { email: string; name: string | null };
  return {
    id: t.id,
    subject: t.subject ?? '(No Subject)',
    snippet: t.snippet ?? '',
    from,
    to: t.to ?? [],
    date: t.date ?? '',
    isRead: t.is_read ?? false,
    isStarred: t.is_starred ?? false,
    labels: t.labels ?? [],
    source: 'gmail',
    messageCount: t.message_count ?? 1,
  };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  // @ts-expect-error
  const token: string | undefined = session.user.accessToken;
  const { searchParams } = new URL(req.url);

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/gmail/threads?${searchParams.toString()}`,
      { headers: makeHeaders(token) }
    );
    const data = await res.json();
    const threads = Array.isArray(data.data) ? data.data.map(transformThread) : [];
    return NextResponse.json({ success: true, data: threads }, { status: res.status });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  // @ts-expect-error
  const token: string | undefined = session.user.accessToken;

  try {
    const body = await req.json();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/gmail/threads`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...makeHeaders(token) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  // @ts-expect-error
  const token: string | undefined = session.user.accessToken;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  const backendPath =
    action === 'archive' ? '/gmail/threads/archive' :
    action === 'mark-read' ? '/gmail/threads/mark-read' :
    null;

  if (!backendPath) return new NextResponse('Unknown action', { status: 400 });

  try {
    const body = await req.json();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${backendPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...makeHeaders(token) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
