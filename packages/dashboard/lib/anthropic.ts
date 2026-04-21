/**
 * Server-side proxy utilities for Anthropic Managed Agents API.
 *
 * All API keys stay server-side — browser calls our /api/* routes,
 * which forward to api.anthropic.com with auth headers injected.
 *
 * NEVER import this file in a client component.
 */

const API_BASE = 'https://api.anthropic.com/v1';

/** Standard headers for Managed Agents API requests. */
export function managedAgentHeaders(): Record<string, string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to your Vercel environment variables.',
    );
  }
  return {
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'managed-agents-2026-04-01',
    'content-type': 'application/json',
  };
}

/**
 * Forward a request to the Anthropic Managed Agents API.
 * Returns the raw Response so callers can handle JSON or streaming.
 */
export async function proxyToAnthropic(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...managedAgentHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}

/**
 * Proxy a JSON request and return a Next.js-compatible Response.
 * Forwards both success and error responses transparently.
 */
export async function proxyJson(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const upstream = await proxyToAnthropic(path, init);
  const body = await upstream.text();

  return new Response(body, {
    status: upstream.status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Pre-configured agent/environment/vault IDs from env vars. */
export function getDefaults() {
  return {
    agentId: process.env.MANAGED_AGENT_ID ?? '',
    environmentId: process.env.ENVIRONMENT_ID ?? '',
    vaultId: process.env.VAULT_ID ?? '',
  };
}
