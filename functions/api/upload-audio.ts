interface Env {
  BACKEND_ORIGIN: string
}

type Context = { request: Request; env: Env }

const STRIP_HEADERS = ["host", "content-length"]

function sanitizeHeaders(request: Request): Headers {
  const headers = new Headers(request.headers)
  for (const header of STRIP_HEADERS) {
    headers.delete(header)
  }
  return headers
}

export const onRequestPost = async ({ request, env }: Context): Promise<Response> => {
  if (!env.BACKEND_ORIGIN) {
    return new Response(JSON.stringify({ error: "BACKEND_ORIGIN not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const backendUrl = new URL("/upload-audio", env.BACKEND_ORIGIN)

  try {
    const response = await fetch(backendUrl.toString(), {
      method: "POST",
      headers: sanitizeHeaders(request),
      body: request.body,
    })
    return response
  } catch (error) {
    console.error("upload-audio proxy error:", error)
    return new Response(JSON.stringify({ error: "Failed to reach transcription backend" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    })
  }
}
