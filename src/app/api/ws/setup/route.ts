/**
 * GET /api/ws/setup
 *
 * Returns { isSetup, requirePassword } by querying the backend's public WS.
 */

import { NextResponse } from "next/server"
import { publicBridge, getPublicURL } from "@/lib/ws-bridge"

export async function GET() {
    try {
        if (!publicBridge.connected) {
            await publicBridge.connect(getPublicURL())
        }

        const isSetup = await publicBridge.send<boolean>("isSetup", undefined)
        const requirePassword = await publicBridge.send<boolean>("requirePassword", undefined)

        return NextResponse.json({ isSetup, requirePassword })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
