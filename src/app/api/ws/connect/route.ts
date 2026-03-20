/**
 * POST /api/ws/connect
 *
 * Connects the private WS bridge (with optional password) and returns
 * initial state: type, version, queue, isDownloading, queueRunning.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  publicBridge,
  privateBridge,
  getPublicURL,
  getPrivateURL,
} from '@/lib/ws-bridge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = (body as { password?: string }).password;

    // Ensure public bridge is connected
    if (!publicBridge.connected) {
      await publicBridge.connect(getPublicURL());
    }

    // Connect private bridge
    await privateBridge.connect(getPrivateURL(password));

    // Fetch initial state
    const type = await privateBridge.send<string | undefined>('type', undefined);
    const version = await privateBridge.send<string>('version', undefined);
    const queue = await privateBridge.send<unknown[]>('getQueue', undefined);
    const isDownloading = await privateBridge.send<boolean>('isDownloading', undefined);
    const queueRunning = await privateBridge.send<boolean>('getDownloadQueue', undefined);

    // Seed polling cache
    privateBridge.poll.queue = queue;
    privateBridge.poll.isDownloading = isDownloading;
    privateBridge.poll.queueRunning = queueRunning;

    return NextResponse.json({
      type,
      version,
      queue,
      isDownloading,
      queueRunning,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
