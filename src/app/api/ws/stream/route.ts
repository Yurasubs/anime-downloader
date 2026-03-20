import { NextRequest } from 'next/server';
import { privateBridge } from '@/lib/ws-bridge';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send the initial state immediately
      const initialData = JSON.stringify(privateBridge.poll);
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      // Subscribe to future state changes
      const unsubscribe = privateBridge.subscribe((state) => {
        try {
          const data = JSON.stringify(state);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (e) {
          // Ignore encode errors
        }
      });

      // Keep-alive to prevent the connection from idling out
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          unsubscribe();
          clearInterval(keepAlive);
        }
      }, 15000);

      // Cleanup when the client aborts the request
      req.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(keepAlive);
      });
    },
    cancel() {
      // Stream cancelled by underlying system
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
