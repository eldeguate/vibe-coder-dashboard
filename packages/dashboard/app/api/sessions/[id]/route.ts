import { proxyJson } from '@/lib/anthropic';

/**
 * GET /api/sessions/:id — Get session details
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyJson(`/sessions/${id}`);
}
