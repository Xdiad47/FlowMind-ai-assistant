import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000'
).replace(/\/+$/, '');
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || '';

async function handleProxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const accessToken = (session.user as any).accessToken;
  const pathString = params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';
  const apiPath = pathString.startsWith('api/') ? pathString : `api/${pathString}`;
  const url = `${BACKEND_URL}/${apiPath}${queryString}`;

  // Detect SSE endpoints
  const isSSE = apiPath.includes('chat/stream');

  const headers = new Headers(request.headers);
  if (typeof userId === 'string' && userId.length > 0) {
    headers.set('x-user-id', userId);
  }
  if (INTERNAL_API_SECRET) {
    headers.set('x-internal-secret', INTERNAL_API_SECRET);
  }
  if (accessToken) {
    headers.set('x-google-access-token', accessToken);
  }
  headers.delete('host');
  // Accept SSE from backend
  if (isSSE) {
    headers.set('Accept', 'text/event-stream');
  }

  try {
    // Use AbortController with generous timeout for SSE (120s), normal for REST (30s)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), isSSE ? 120000 : 30000);

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: 'manual',
      signal: controller.signal,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
      // @ts-expect-error - Next.js needs duplex: 'half' for streaming requests
      init.duplex = 'half';
    }

    const response = await fetch(url, init);
    clearTimeout(timeout);

    const parseJsonBody = async (): Promise<unknown> => {
      try {
        return await response.json();
      } catch {
        return null;
      }
    };

    // Build response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // For SSE responses, stream the body through properly
    if (isSSE && response.body) {
      responseHeaders.set('Content-Type', 'text/event-stream');
      responseHeaders.set('Cache-Control', 'no-cache, no-transform');
      responseHeaders.set('Connection', 'keep-alive');
      responseHeaders.set('X-Accel-Buffering', 'no');

      // Pipe the backend SSE stream to the client
      const stream = new ReadableStream({
        async start(streamController) {
          const reader = response.body!.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              streamController.enqueue(value);
            }
          } catch (err) {
            // Stream ended or errored
          } finally {
            streamController.close();
          }
        },
      });

      return new NextResponse(stream, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }

    const data = await parseJsonBody();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    }

    const fallbackMessage = response.statusText || 'Upstream request failed';
    const upstreamError =
      data && typeof data === 'object'
        ? data
        : { message: typeof data === 'string' ? data : fallbackMessage };

    return NextResponse.json(upstreamError, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        message: 'Proxy request failed',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
