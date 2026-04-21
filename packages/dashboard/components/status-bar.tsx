'use client';

import { useSessionStore } from '@/lib/stores/session-store';
import { useDaemonStore } from '@/lib/stores/daemon-store';

export function StatusBar() {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const eventCount = useSessionStore((s) => s.events.length);
  const daemonStatus = useDaemonStore((s) => s.status);
  const hostname = useDaemonStore((s) => s.hostname);
  const wsCount = Object.keys(useDaemonStore((s) => s.workstreams)).length;

  return (
    <div className="h-7 px-3 flex items-center gap-4 border-t border-border bg-bg-sidebar text-[11px] text-fg-dim shrink-0">
      {/* Active session */}
      <span>
        Session:{' '}
        {activeSessionId ? (
          <span className="text-fg-muted font-mono">{activeSessionId.slice(0, 12)}</span>
        ) : (
          <span>none</span>
        )}
      </span>

      {/* Streaming status */}
      {isStreaming && (
        <span className="flex items-center gap-1 text-running">
          <span className="w-1.5 h-1.5 rounded-full bg-running animate-pulse" />
          Streaming
        </span>
      )}

      {/* Events */}
      {eventCount > 0 && <span>{eventCount} events</span>}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Workstreams */}
      {wsCount > 0 && <span>{wsCount} workstream{wsCount !== 1 ? 's' : ''}</span>}

      {/* Daemon */}
      <span className="flex items-center gap-1">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            daemonStatus === 'connected'
              ? 'bg-success'
              : daemonStatus === 'error'
                ? 'bg-error'
                : 'bg-fg-dim'
          }`}
        />
        {daemonStatus === 'connected' && hostname
          ? hostname
          : `Daemon: ${daemonStatus}`}
      </span>
    </div>
  );
}
