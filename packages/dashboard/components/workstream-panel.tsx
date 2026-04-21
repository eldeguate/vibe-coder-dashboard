'use client';

import { useDaemonStore } from '@/lib/stores/daemon-store';
import { WorkstreamCard } from './workstream-card';

export function WorkstreamPanel() {
  const workstreams = useDaemonStore((s) => s.workstreams);
  const daemonStatus = useDaemonStore((s) => s.status);
  const repos = useDaemonStore((s) => s.repos);
  const addWorkstream = useDaemonStore((s) => s.addWorkstream);

  const entries = Object.values(workstreams);

  const handleAdd = () => {
    const id = `ws-${Date.now()}`;
    addWorkstream({
      id,
      engine: 'claude-code',
      prompt: '',
      repoPath: repos[0]?.path ?? '',
      status: 'pending',
      events: [],
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Workstreams</h2>
          <button
            onClick={handleAdd}
            disabled={daemonStatus !== 'connected'}
            className="text-xs px-2 py-1 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Workstream list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {entries.length === 0 ? (
          <p className="p-2 text-xs text-fg-dim">
            {daemonStatus === 'connected'
              ? 'No workstreams yet. Click + Add to create one.'
              : 'Connect to daemon to manage workstreams.'}
          </p>
        ) : (
          entries.map((ws) => <WorkstreamCard key={ws.id} workstream={ws} />)
        )}
      </div>
    </div>
  );
}
