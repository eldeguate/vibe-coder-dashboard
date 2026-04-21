import { proxyJson, getDefaults } from '@/lib/anthropic';

/**
 * GET  /api/sessions — List all sessions
 * POST /api/sessions — Create a new session
 *
 * POST auto-injects MANAGED_AGENT_ID, ENVIRONMENT_ID, VAULT_ID from env.
 * Browser can call POST /api/sessions with an empty body to create a session
 * using the pre-configured Master Vibe Coder agent.
 */

export async function GET() {
  return proxyJson('/sessions');
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const defaults = getDefaults();

  const payload: Record<string, unknown> = {
    agent: body.agent_id ?? defaults.agentId,
    environment_id: body.environment_id ?? defaults.environmentId,
  };

  // Attach vault for MCP auth if configured
  const vaultId = (body.vault_id as string) ?? defaults.vaultId;
  if (vaultId) {
    payload.vault_ids = [vaultId];
  }

  return proxyJson('/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
