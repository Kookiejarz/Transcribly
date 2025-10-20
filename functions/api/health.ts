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

export const onRequestGet = async ({ request, env }: Context): Promise<Response> => {
  if (!env.BACKEND_ORIGIN) {
    return new Response(JSON.stringify({ status: "error", detail: "BACKEND_ORIGIN not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const backendUrl = new URL("/health", env.BACKEND_ORIGIN)

  try {
    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: sanitizeHeaders(request),
    })
    return response
  } catch (error) {
    console.error("health proxy error:", error)
    return new Response(JSON.stringify({ status: "error", detail: "Failed to reach backend health endpoint" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    })
  }
}
