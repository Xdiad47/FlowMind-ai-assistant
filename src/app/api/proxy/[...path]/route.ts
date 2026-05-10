import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || '';

async function handleProxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
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
  headers.set('x-user-id', userId);
  headers.set('x-internal-secret', INTERNAL_API_SECRET);
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

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;

