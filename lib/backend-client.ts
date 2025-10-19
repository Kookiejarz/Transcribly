const DEFAULT_BACKEND_URL = "http://localhost:8000"

function getBackendBaseUrl(): string {
  const raw = process.env.TRANSCRIPTION_API_URL || DEFAULT_BACKEND_URL
  return raw.endsWith("/") ? raw.slice(0, -1) : raw
}

export function buildBackendUrl(path: string): string {
  const base = getBackendBaseUrl()
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
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
