/**
 * Types for Anthropic Managed Agents API
 * Beta header: managed-agents-2026-04-01
 *
 * Core flow:
 *   1. POST /v1/agents         → create agent definition
 *   2. POST /v1/environments    → create container environment
 *   3. POST /v1/sessions        → start a session (agent + env + optional vault)
 *   4. POST /v1/sessions/:id/events → send user message
 *   5. GET  /v1/sessions/:id/events/stream → SSE event stream
 */

// ─── Agent ───────────────────────────────────────────────

export interface ManagedAgent {
  id: string;
  name: string;
  model: string;
  system: string;
  tools: AgentTool[];
  created_at: string;
  updated_at: string;
  version: number;
}

export type AgentTool =
  | AgentBuiltinToolset
  | AgentMcpTool
  | AgentCustomTool;

export interface AgentBuiltinToolset {
  type: 'agent_toolset_20260401';
}

export interface AgentMcpTool {
  type: 'mcp';
  name: string;
  url: string;
}

export interface AgentCustomTool {
  type: 'custom';
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

// ─── Environment ─────────────────────────────────────────

export interface AgentEnvironment {
  id: string;
  name: string;
  created_at: string;
}

// ─── Session ─────────────────────────────────────────────

export type SessionStatus =
  | 'created'
  | 'running'
  | 'idle'
  | 'paused'
  | 'completed'
  | 'terminated'
  | 'failed';

export interface AgentSession {
  id: string;
  agent_id: string;
  environment_id: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

// ─── SSE Events from GET /v1/sessions/:id/events/stream ──

export type SessionSSEEvent =
  | AgentMessageEvent
  | AgentToolUseEvent
  | AgentToolResultEvent
  | SessionStatusEvent
  | SessionErrorEvent;

export interface AgentMessageEvent {
  type: 'agent.message';
  session_id: string;
  event_id: string;
  content: {
    type: 'text';
    text: string;
  };
}

export interface AgentToolUseEvent {
  type: 'agent.tool_use';
  session_id: string;
  event_id: string;
  tool: {
    name: string;
    input: Record<string, unknown>;
  };
}

export interface AgentToolResultEvent {
  type: 'agent.tool_result';
  session_id: string;
  event_id: string;
  tool: {
    name: string;
    output: string;
    is_error?: boolean;
  };
}

export interface SessionStatusEvent {
  type: 'session.status';
  session_id: string;
  status: SessionStatus;
}

export interface SessionErrorEvent {
  type: 'error';
  message: string;
  code?: string;
}

// ─── API Request/Response Types ──────────────────────────

export interface CreateAgentRequest {
  name: string;
  model: string;
  system: string;
  tools?: AgentTool[];
}

export interface CreateEnvironmentRequest {
  name: string;
}

export interface CreateSessionRequest {
  agent_id: string;
  environment_id: string;
  vault_ids?: string[];
}

export interface SendMessageRequest {
  content: string;
}
