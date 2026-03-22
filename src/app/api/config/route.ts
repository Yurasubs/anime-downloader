import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const ALLOWED_CONFIGS = ["cli-defaults", "bin-path", "dir-path"]

function getConfigDir() {
    const configPath = process.env.CONFIG_DIR
    if (!configPath) {
        throw new Error(
            "CONFIG_DIR environment variable is not set. Please set it to the absolute path of your multi-downloader-nx/config directory."
        )
    }
    return configPath
}

export async function GET(request: NextRequest) {
    const name = request.nextUrl.searchParams.get("name")
    if (!name || !ALLOWED_CONFIGS.includes(name)) {
        return NextResponse.json({ error: "Invalid config name" }, { status: 400 })
    }

    const filePath = path.join(getConfigDir(), `${name}.yml`)
    try {
        const content = fs.readFileSync(filePath, "utf8")
        return NextResponse.json({ content })
    } catch {
        return NextResponse.json({ content: "" })
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { name, content } = body as { name: string; content: string }

    if (!name || !ALLOWED_CONFIGS.includes(name)) {
        return NextResponse.json({ error: "Invalid config name" }, { status: 400 })
    }

    const filePath = path.join(getConfigDir(), `${name}.yml`)
    try {
        fs.writeFileSync(filePath, content, "utf8")
        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ ok: false, error: "Failed to write" }, { status: 500 })
    }
}
