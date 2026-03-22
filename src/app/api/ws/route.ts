/**
 * POST /api/ws
 *
 * Generic proxy: sends any WS message and returns the response.
 * Body: { name: string, data?: unknown }
 */

import { NextRequest, NextResponse } from "next/server"
import { privateBridge } from "@/lib/ws-bridge"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, data } = body as { name: string; data?: unknown }

        if (!name) {
            return NextResponse.json({ error: 'Missing "name"' }, { status: 400 })
        }

        if (!privateBridge.connected) {
            return NextResponse.json({ error: "Not connected. Call /api/ws/connect first." }, { status: 503 })
        }

        // Fire-and-forget for 'setup' (select service) — no response expected
        if (name === "setup") {
            privateBridge.sendNoWait(name, data)
            return NextResponse.json({ ok: true })
        }

        const result = await privateBridge.send(name, data)
        return NextResponse.json({ result })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
