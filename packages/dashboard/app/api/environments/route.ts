import { proxyJson } from '@/lib/anthropic';

/**
 * POST /api/environments — Create a new environment
 */

export async function POST(request: Request) {
  const body = await request.json();
  return proxyJson('/environments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
