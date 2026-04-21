/**
 * GET /api/sessions/:id/stream — SSE proxy for Managed Agents event stream
 *
 * Runs on Edge Runtime (no Vercel timeout) and pipes the upstream SSE
 * response body directly to the browser. Zero buffering.
 *
 * The browser connects to this endpoint with EventSource:
 *   const es = new EventSource('/api/sessions/abc123/stream');
 *   es.onmessage = (e) => console.log(JSON.parse(e.data));
 */

export const runtime = 'edge';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }

  // Connect to Anthropic's SSE stream
  const upstream = await fetch(
    `https://api.anthropic.com/v1/sessions/${id}/events/stream`,
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'managed-agents-2026-04-01',
        'accept': 'text/event-stream',
      },
    },
  );

  // Forward errors transparently
  if (!upstream.ok) {
    const errorBody = await upstream.text().catch(() => 'Unknown upstream error');
    return new Response(
      JSON.stringify({
        error: `Managed Agents API returned ${upstream.status}`,
        details: errorBody,
      }),
      { status: upstream.status, headers: { 'content-type': 'application/json' } },
    );
  }

  if (!upstream.body) {
    return new Response(
      JSON.stringify({ error: 'No stream body from upstream' }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  // Pipe SSE stream directly to browser — no buffering, no timeout
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      'connection': 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}
