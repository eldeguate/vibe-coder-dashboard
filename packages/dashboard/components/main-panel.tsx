'use client';

import { useSessionStore } from '@/lib/stores/session-store';
import { PlanViewer } from './plan-viewer';
import { ChatInput } from './chat-input';
import { StreamingOutput } from './streaming-output';

export function MainPanel() {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const planText = useSessionStore((s) => s.planText);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const events = useSessionStore((s) => s.events);

  if (!activeSessionId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl">⚡</div>
          <h2 className="text-lg font-semibold text-fg">Vibe Coder Dashboard</h2>
          <p className="text-sm text-fg-muted max-w-sm">
            Create a new session from the sidebar, or select an existing one
            to start orchestrating.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Plan viewer area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {planText ? (
          <PlanViewer text={planText} />
        ) : isStreaming ? (
          <div className="flex items-center gap-2 text-fg-muted text-sm">
            <span className="w-2 h-2 rounded-full bg-running animate-pulse" />
            Agent is working…
          </div>
        ) : (
          <p className="text-sm text-fg-dim">
            Send a message to start the orchestration.
          </p>
        )}

        {/* Raw events stream (collapsed by default) */}
        {events.length > 0 && (
          <details className="group">
            <summary className="text-xs text-fg-dim cursor-pointer hover:text-fg-muted">
              Raw events ({events.length})
            </summary>
            <div className="mt-2">
              <StreamingOutput events={events} maxHeight="200px" />
            </div>
          </details>
        )}
      </div>

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="px-4 py-1 border-t border-border bg-bg-card">
          <span className="text-xs text-running flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-running animate-pulse" />
            Streaming…
          </span>
        </div>
      )}

      {/* Chat input */}
      <ChatInput />
    </div>
  );
}
