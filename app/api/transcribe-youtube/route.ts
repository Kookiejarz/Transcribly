import { buildBackendUrl, extractBackendError } from "@/lib/backend-client"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body ?? {}

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    const backendUrl = buildBackendUrl("/youtube-transcribe")
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const apiKey = request.headers.get("x-api-key")
    if (apiKey) {
      headers["X-API-Key"] = apiKey
    }

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!backendResponse.ok) {
      const detail = await extractBackendError(backendResponse)
      return NextResponse.json({ error: detail }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    const sessionId = data.session_id ?? data.sessionId ?? ""
    if (!sessionId) {
      return NextResponse.json(
        { error: "Transcription backend returned an invalid session identifier" },
        { status: 502 },
      )
    }

    return NextResponse.json({
      sessionId,
      transcript: data.transcript ?? "",
      summary: data.summary ?? "",
    })
  } catch (error) {
    console.error("YouTube transcription error:", error)
    return NextResponse.json({ error: "Failed to process YouTube transcription" }, { status: 500 })
  }
}
