import { proxyJson } from '@/lib/anthropic';

/**
 * POST /api/sessions/:id/messages — Send a user message to the session
 *
 * Body: { content: string }
 *
 * Maps to: POST /v1/sessions/:id/events { type: 'user', content: '...' }
 */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  if (!body.content || typeof body.content !== 'string') {
    return Response.json(
      { error: 'Missing required field: content (string)' },
      { status: 400 },
    );
  }

  return proxyJson(`/sessions/${id}/events`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'user',
      content: body.content,
    }),
  });
}
