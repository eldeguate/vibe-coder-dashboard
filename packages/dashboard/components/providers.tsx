'use client';

import { useDaemon } from '@/lib/hooks/use-daemon';
import { useSSE } from '@/lib/hooks/use-sse';

/**
 * Client-side provider that initializes:
 *  - Daemon WebSocket connection (auto-reconnect)
 *  - SSE stream for active Managed Agents session
 *
 * Wrap the app with this in the root layout.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  useDaemon();
  useSSE();
  return <>{children}</>;
}
