function resolveBackendBaseUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_TRANSCRIPTION_API_URL || process.env.TRANSCRIPTION_API_URL || ""
  if (explicit) {
    return explicit.endsWith("/") ? explicit.slice(0, -1) : explicit
  }
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:8000`
    }
  }
  return "/api"
}

export function buildBackendUrl(path: string): string {
  const base = resolveBackendBaseUrl()
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  if (base.startsWith("http")) {
    return `${base}${normalizedPath}`
  }
  const basePrefix = base.endsWith("/") ? base.slice(0, -1) : base
  return `${basePrefix}${normalizedPath}`
}

export async function extractBackendError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data === "object" && data !== null) {
      return data.detail || data.error || JSON.stringify(data)
    }
  } catch {
    // Ignore JSON parsing errors and fall back to status text
  }
  return response.statusText || `Backend request failed with status ${response.status}`
}
