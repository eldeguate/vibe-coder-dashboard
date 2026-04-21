'use client';

import { useRef, useEffect } from 'react';

interface StreamingOutputProps {
  events: unknown[];
  maxHeight?: string;
}

/** Terminal-like auto-scrolling output for CLI stream events. */
export function StreamingOutput({ events, maxHeight = '300px' }: StreamingOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <div
      className="font-mono text-[11px] leading-relaxed bg-bg rounded border border-border overflow-y-auto"
      style={{ maxHeight }}
    >
      <div className="p-2 space-y-px">
        {events.map((event, i) => {
          const text = formatEvent(event);
          if (!text) return null;
          return (
            <div key={i} className="text-fg-dim whitespace-pre-wrap break-all">
              {text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {events.length === 0 && (
        <p className="p-2 text-fg-dim">Waiting for output…</p>
      )}
    </div>
  );
}

function formatEvent(event: unknown): string {
  if (!event || typeof event !== 'object') return String(event);
  const e = event as Record<string, unknown>;

  // Claude Code stream-json events
  if (e.type === 'stream_event') {
    const inner = e.event as Record<string, unknown> | undefined;
    const delta = inner?.delta as Record<string, unknown> | undefined;
    if (delta?.text) return String(delta.text);
    if (delta?.thinking) return `[thinking] ${delta.thinking}`;
    return '';
  }
  if (e.type === 'system') {
    const sub = e.subtype as string;
    if (sub === 'tool_use') return `🛠 ${e.tool}`;
    if (sub === 'tool_result') return `   → ${String(e.result ?? e.error ?? '').slice(0, 200)}`;
    if (sub === 'api_retry') return `⚠️  API retry in ${e.retry_after}ms`;
    return '';
  }
  if (e.type === 'result') {
    return `\n✅ Done (${e.duration_ms ?? '?'}ms, $${e.cost_usd ?? '?'})`;
  }

  // Codex exec --json events
  if (e.type === 'item.completed' || e.type === 'item.started') {
    const item = e.item as Record<string, unknown> | undefined;
    if (!item) return '';
    switch (item.type) {
      case 'agent_message': return String(item.text ?? '');
      case 'command_execution': return `$ ${item.command}\n${item.aggregated_output ?? ''}`;
      case 'reasoning': return `[reasoning] ${item.text}`;
      case 'file_change': {
        const changes = item.changes as Array<{ type: string; path: string }> | undefined;
        return changes?.map((c) => `${c.type} ${c.path}`).join('\n') ?? '';
      }
      default: return '';
    }
  }
  if (e.type === 'turn.completed') return '--- turn completed ---';
  if (e.type === 'error') return `❌ ${e.message ?? 'Unknown error'}`;

  return '';
}
