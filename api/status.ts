import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadStatus } from '../src/shared/status.ts'

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405
    response.setHeader('Allow', 'GET, HEAD')
    response.end()
    return
  }

  try {
    const status = await loadStatus()

    response.statusCode = 200
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.end(request.method === 'HEAD' ? undefined : JSON.stringify(status))
  } catch (error) {
    console.error('Failed to load Sierichs status', error)

    response.statusCode = 502
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    response.end(
      JSON.stringify({
        error: 'status_unavailable',
        checkedAt: new Date().toISOString(),
      }),
    )
  }
}
