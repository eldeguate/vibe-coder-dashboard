/**
 * Codex CLI `exec --json` event types.
 *
 * Usage: codex exec --json --full-auto --sandbox workspace-write -p "prompt" --cd /repo
 *
 * Each stdout line is a JSONL object with a top-level `type` field.
 *
 * Event lifecycle:
 *   thread.started → turn.started → item.* (0..N) → turn.completed|turn.failed
 *
 * Item types:
 *   agent_message, reasoning, command_execution, file_change,
 *   mcp_tool_call, web_search, todo_list, error
 *
 * CAUTION: Codex CLI JSON schema has had breaking changes without version bumps.
 * Field `item_type` was renamed to `type`, `assistant_message` to `agent_message`.
 * Always handle unknown fields gracefully.
 */

// ─── Top-level Event Types ───────────────────────────────

export type CodexEventType =
  | 'thread.started'
  | 'turn.started'
  | 'turn.completed'
  | 'turn.failed'
  | 'item.started'
  | 'item.updated'
  | 'item.completed'
  | 'error';

export type CodexItemType =
  | 'agent_message'
  | 'reasoning'
  | 'command_execution'
  | 'file_change'
  | 'mcp_tool_call'
  | 'web_search'
  | 'todo_list'
  | 'error';

// ─── Event Union ─────────────────────────────────────────

export type CodexEvent =
  | CodexThreadStarted
  | CodexTurnStarted
  | CodexTurnCompleted
  | CodexTurnFailed
  | CodexItemEvent
  | CodexStreamError;

export interface CodexThreadStarted {
  type: 'thread.started';
  thread_id: string;
}

export interface CodexTurnStarted {
  type: 'turn.started';
}

export interface CodexTurnCompleted {
  type: 'turn.completed';
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cached_input_tokens?: number;
  };
}

export interface CodexTurnFailed {
  type: 'turn.failed';
  error?: string;
}

export interface CodexItemEvent {
  type: 'item.started' | 'item.updated' | 'item.completed';
  item: CodexItem;
}

export interface CodexStreamError {
  type: 'error';
  message: string;
}

// ─── Item Types ──────────────────────────────────────────

export type CodexItem =
  | CodexAgentMessageItem
  | CodexReasoningItem
  | CodexCommandExecutionItem
  | CodexFileChangeItem
  | CodexMcpToolCallItem
  | CodexWebSearchItem
  | CodexTodoListItem
  | CodexErrorItem;

export interface CodexAgentMessageItem {
  id: string;
  type: 'agent_message';
  text: string;
}

export interface CodexReasoningItem {
  id: string;
  type: 'reasoning';
  text: string;
}

export interface CodexCommandExecutionItem {
  id: string;
  type: 'command_execution';
  command: string;
  aggregated_output: string;
  exit_code?: number;
  status: 'in_progress' | 'completed' | 'failed';
}

export interface CodexFileChangeItem {
  id: string;
  type: 'file_change';
  changes: CodexFileChange[];
  status: 'applied' | 'failed';
}

export interface CodexFileChange {
  path: string;
  type: 'add' | 'modify' | 'delete';
  content?: string;
}

export interface CodexMcpToolCallItem {
  id: string;
  type: 'mcp_tool_call';
  server: string;
  tool: string;
  status: 'in_progress' | 'completed' | 'failed';
}

export interface CodexWebSearchItem {
  id: string;
  type: 'web_search';
  query: string;
}

export interface CodexTodoListItem {
  id: string;
  type: 'todo_list';
  items: CodexTodoEntry[];
}

export interface CodexTodoEntry {
  text: string;
  completed: boolean;
}

export interface CodexErrorItem {
  id: string;
  type: 'error';
  message: string;
}

// ─── Runtime Helpers ─────────────────────────────────────

/** Type guard: is this a completed agent message? */
export function isCodexAgentMessage(
  event: CodexEvent,
): event is CodexItemEvent & { item: CodexAgentMessageItem } {
  return (
    event.type === 'item.completed' &&
    'item' in event &&
    event.item.type === 'agent_message'
  );
}

/** Type guard: is this a completed file change? */
export function isCodexFileChange(
  event: CodexEvent,
): event is CodexItemEvent & { item: CodexFileChangeItem } {
  return (
    event.type === 'item.completed' &&
    'item' in event &&
    event.item.type === 'file_change'
  );
}
