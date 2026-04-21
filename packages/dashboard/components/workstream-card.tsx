'use client';

import { useState } from 'react';
import { useDaemonStore, type Workstream } from '@/lib/stores/daemon-store';
import { useDaemon } from '@/lib/hooks/use-daemon';
import { StreamingOutput } from './streaming-output';
import type { EngineType } from '@vibe-coder/shared';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-fg-dim',
  running: 'bg-running animate-pulse',
  done: 'bg-success',
  failed: 'bg-error',
};

export function WorkstreamCard({ workstream }: { workstream: Workstream }) {
  const { send } = useDaemon();
  const repos = useDaemonStore((s) => s.repos);
  const updateStatus = useDaemonStore((s) => s.updateWorkstreamStatus);
  const removeWorkstream = useDaemonStore((s) => s.removeWorkstream);

  const [engine, setEngine] = useState<EngineType>(workstream.engine);
  const [prompt, setPrompt] = useState(workstream.prompt);
  const [repoPath, setRepoPath] = useState(workstream.repoPath);
  const [showEvents, setShowEvents] = useState(false);

  const handleExecute = () => {
    if (!prompt.trim() || !repoPath) return;
    updateStatus(workstream.id, 'running');
    send({
      type: 'execute-workstream',
      workstream_id: workstream.id,
      engine,
      prompt: prompt.trim(),
      repo_path: repoPath,
    });
  };

  const handleKill = () => {
    send({ type: 'kill', workstream_id: workstream.id });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).catch(console.error);
  };

  return (
    <div className="rounded-lg border border-border bg-bg-card p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[workstream.status]}`} />
          <span className="text-xs font-mono text-fg-muted">{workstream.id.slice(0, 10)}</span>
        </div>
        <button
          onClick={() => removeWorkstream(workstream.id)}
          className="text-fg-dim hover:text-error text-xs"
        >
          ×
        </button>
      </div>

      {/* Engine + repo selectors */}
      <div className="flex gap-2">
        <select
          value={engine}
          onChange={(e) => setEngine(e.target.value as EngineType)}
          disabled={workstream.status === 'running'}
          className="flex-1 px-2 py-1 bg-bg-input border border-border rounded text-xs text-fg"
        >
          <option value="claude-code">Claude Code</option>
          <option value="codex">Codex</option>
        </select>
        <select
          value={repoPath}
          onChange={(e) => setRepoPath(e.target.value)}
          disabled={workstream.status === 'running'}
          className="flex-1 px-2 py-1 bg-bg-input border border-border rounded text-xs text-fg"
        >
          {repos.length === 0 && <option value="">No repos</option>}
          {repos.map((r) => (
            <option key={r.path} value={r.path}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Workstream prompt…"
        disabled={workstream.status === 'running'}
        rows={2}
        className="w-full px-2 py-1.5 bg-bg-input border border-border rounded text-xs text-fg resize-none placeholder:text-fg-dim"
      />

      {/* Action buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {workstream.status === 'running' ? (
          <button onClick={handleKill} className="px-2 py-1 bg-error/20 text-error border border-error/30 rounded text-xs">
            Kill
          </button>
        ) : (
          <button
            onClick={handleExecute}
            disabled={!prompt.trim()}
            className="px-2 py-1 bg-accent text-white rounded text-xs hover:bg-accent-hover disabled:opacity-40"
          >
            Execute locally
          </button>
        )}
        <button onClick={handleCopy} className="px-2 py-1 bg-bg-input border border-border rounded text-xs text-fg-muted hover:text-fg">
          Copy prompt
        </button>
      </div>

      {/* Streaming output (collapsible) */}
      {workstream.events.length > 0 && (
        <div>
          <button
            onClick={() => setShowEvents(!showEvents)}
            className="text-[11px] text-fg-dim hover:text-fg-muted"
          >
            {showEvents ? '▼' : '▶'} Output ({workstream.events.length} events)
          </button>
          {showEvents && (
            <div className="mt-1">
              <StreamingOutput events={workstream.events} maxHeight="150px" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
