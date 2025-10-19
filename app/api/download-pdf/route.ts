import { buildBackendUrl, extractBackendError } from "@/lib/backend-client"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
    }

    const backendUrl = buildBackendUrl(`/download-pdf?session_id=${encodeURIComponent(sessionId)}`)
    const backendResponse = await fetch(backendUrl)

    if (!backendResponse.ok) {
      const detail = await extractBackendError(backendResponse)
      return NextResponse.json({ error: detail }, { status: backendResponse.status })
    }

    const arrayBuffer = await backendResponse.arrayBuffer()
    const headers = new Headers()
    const contentType = backendResponse.headers.get("content-type") ?? "application/pdf"
    const contentDisposition =
      backendResponse.headers.get("content-disposition") ??
      `attachment; filename="transcript-${sessionId}.pdf"`

    headers.set("Content-Type", contentType)
    headers.set("Content-Disposition", contentDisposition)

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
