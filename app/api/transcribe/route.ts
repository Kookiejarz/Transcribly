import { buildBackendUrl, extractBackendError } from "@/lib/backend-client"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const backendUrl = buildBackendUrl("/upload-audio")
    const headers: Record<string, string> = {}
    const apiKey = request.headers.get("x-api-key")
    if (apiKey) {
      headers["X-API-Key"] = apiKey
    }

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      body: formData,
      headers,
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
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to process transcription" }, { status: 500 })
  }
}
