import { proxyJson } from '@/lib/anthropic';

/**
 * GET  /api/agents — List all agents
 * POST /api/agents — Create a new agent
 */

export async function GET() {
  return proxyJson('/agents');
}

export async function POST(request: Request) {
  const body = await request.json();

  // Default to the built-in agent toolset if no tools specified
  const payload = {
    name: body.name,
    model: body.model ?? 'claude-sonnet-4-6',
    system: body.system ?? '',
    tools: body.tools ?? [{ type: 'agent_toolset_20260401' }],
  };

  return proxyJson('/agents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
