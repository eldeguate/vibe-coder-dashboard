'use client';

import { useEffect } from 'react';
import { useSessionStore } from '@/lib/stores/session-store';
import { useDaemonStore } from '@/lib/stores/daemon-store';
import Link from 'next/link';

export function SessionSidebar() {
  const sessions = useSessionStore((s) => s.sessions);
  const activeId = useSessionStore((s) => s.activeSessionId);
  const setActive = useSessionStore((s) => s.setActiveSession);
  const fetchSessions = useSessionStore((s) => s.fetchSessions);
  const createSession = useSessionStore((s) => s.createSession);
  const daemonStatus = useDaemonStore((s) => s.status);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Sessions</h2>
          <button
            onClick={() => createSession()}
            className="text-xs px-2 py-1 bg-accent text-white rounded hover:bg-accent-hover transition-colors"
          >
            + New
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="p-3 text-xs text-fg-dim">No sessions yet</p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActive(session.id)}
              className={`w-full text-left px-3 py-2.5 text-sm border-b border-border/50 hover:bg-bg-card transition-colors ${
                session.id === activeId
                  ? 'bg-bg-card border-l-2 border-l-accent'
                  : ''
              }`}
            >
              <div className="text-fg truncate text-xs font-mono">
                {session.id.slice(0, 16)}…
              </div>
              <div className="text-fg-dim text-[11px] mt-0.5">
                {session.status} ·{' '}
                {new Date(session.created_at).toLocaleTimeString()}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer: daemon status + settings */}
      <div className="p-3 border-t border-border space-y-2">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-xs text-fg-muted hover:text-fg transition-colors"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              daemonStatus === 'connected'
                ? 'bg-success'
                : daemonStatus === 'connecting'
                  ? 'bg-warning animate-pulse'
                  : daemonStatus === 'error'
                    ? 'bg-error'
                    : 'bg-fg-dim'
            }`}
          />
          Daemon: {daemonStatus}
        </Link>
      </div>
    </div>
  );
}
