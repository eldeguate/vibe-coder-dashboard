/**
 * Claude Code CLI `--output-format stream-json` event types.
 *
 * Usage: claude -p "prompt" --output-format stream-json --verbose --include-partial-messages --cd /repo
 *
 * Each stdout line is an NDJSON object. Three top-level types:
 *   - stream_event: real-time token/block deltas (follows Anthropic Messages SSE format)
 *   - system: lifecycle events (init, retries, tool activity)
 *   - result: final output with cost/token metadata
 */

export type ClaudeCodeStreamEvent =
  | ClaudeCodeStreamDelta
  | ClaudeCodeSystemEvent
  | ClaudeCodeResultEvent;

// ─── Stream Delta (real-time content) ────────────────────

export interface ClaudeCodeStreamDelta {
  type: 'stream_event';
  event: {
    type:
      | 'message_start'
      | 'message_delta'
      | 'message_stop'
      | 'content_block_start'
      | 'content_block_delta'
      | 'content_block_stop';
    index?: number;
    delta?: {
      type: 'text_delta' | 'thinking_delta' | 'input_json_delta';
      text?: string;
      thinking?: string;
      partial_json?: string;
    };
    content_block?: {
      type: 'text' | 'tool_use' | 'thinking';
      text?: string;
      id?: string;
      name?: string;
      input?: Record<string, unknown>;
    };
    message?: {
      id: string;
      role: 'assistant';
      model: string;
    };
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number;
    };
  };
}

// ─── System Events (lifecycle) ───────────────────────────

export interface ClaudeCodeSystemEvent {
  type: 'system';
  subtype: 'init' | 'api_retry' | 'tool_use' | 'tool_result' | 'error';
  session_id?: string;
  tool?: string;
  input?: Record<string, unknown>;
  result?: string;
  error?: string;
  retry_after?: number;
  message?: string;
}

// ─── Result (final output) ───────────────────────────────

export interface ClaudeCodeResultEvent {
  type: 'result';
  result: string;
  session_id: string;
  cost_usd?: number;
  duration_ms?: number;
  input_tokens?: number;
  output_tokens?: number;
  num_turns?: number;
}

// ─── Runtime Helpers ─────────────────────────────────────

/** Extract text content from a stream delta event. Returns null if not a text delta. */
export function extractClaudeCodeText(event: ClaudeCodeStreamEvent): string | null {
  if (event.type !== 'stream_event') return null;
  const delta = event.event?.delta;
  if (delta?.type === 'text_delta' && delta.text != null) return delta.text;
  if (delta?.type === 'thinking_delta' && delta.thinking != null) return delta.thinking;
  return null;
}

/** Check if a stream event starts a tool_use content block. */
export function isClaudeCodeToolUse(event: ClaudeCodeStreamEvent): boolean {
  if (event.type !== 'stream_event') return false;
  return event.event?.content_block?.type === 'tool_use';
}
