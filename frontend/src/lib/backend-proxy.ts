/**
 * Proxy utility for forwarding requests to the FastAPI + LangGraph backend.
 * When BACKEND_URL is set, route handlers proxy to the Python backend.
 * Otherwise, they handle requests directly (MVP mode).
 */

export function getBackendUrl(): string | null {
  return process.env.BACKEND_URL || null
}

/**
 * Proxy a JSON POST request to the FastAPI backend.
 * Returns the Response directly (supports both JSON and SSE responses).
 */
export async function proxyToBackend(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<Response | null> {
  const backendUrl = getBackendUrl()
  if (!backendUrl) return null

  const url = `${backendUrl}${path}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })

  return response
}
