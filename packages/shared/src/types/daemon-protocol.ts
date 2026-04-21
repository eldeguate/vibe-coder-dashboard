/**
 * WebSocket message protocol between browser ↔ daemon.
 *
 * MVP architecture:
 *   - Daemon runs a WebSocket server on DAEMON_PORT (default 7777)
 *   - Browser connects directly to ws://localhost:DAEMON_PORT
 *   - First message from browser MUST be { type: 'auth', token: '...' }
 *   - Daemon validates token, replies with auth-result, then daemon-info
 *
 * Message flow:
 *   Browser → Daemon: auth, execute-workstream, kill, push, list-repos
 *   Daemon → Browser: auth-result, daemon-info, stream, status, done, error, push-result
 */

export type EngineType = 'claude-code' | 'codex';

export type WorkstreamStatus = 'pending' | 'running' | 'done' | 'failed';

// ─── Browser → Daemon ────────────────────────────────────

export type DashboardToDaemonMessage =
  | AuthMessage
  | ExecuteWorkstreamMessage
  | KillWorkstreamMessage
  | PushToGitHubMessage
  | ListReposMessage;

export interface AuthMessage {
  type: 'auth';
  token: string;
}

export interface ExecuteWorkstreamMessage {
  type: 'execute-workstream';
  workstream_id: string;
  engine: EngineType;
  prompt: string;
  repo_path: string;
  model?: string; // e.g. 'claude-sonnet-4-6' or 'gpt-5-codex'
}

export interface KillWorkstreamMessage {
  type: 'kill';
  workstream_id: string;
}

export interface PushToGitHubMessage {
  type: 'push';
  workstream_id: string;
  repo_path: string;
  branch?: string;
  commit_message?: string;
}

export interface ListReposMessage {
  type: 'list-repos';
}

// ─── Daemon → Browser ────────────────────────────────────

export type DaemonToDashboardMessage =
  | AuthResultMessage
  | DaemonInfoMessage
  | WorkstreamStreamMessage
  | WorkstreamStatusMessage
  | WorkstreamDoneMessage
  | WorkstreamErrorMessage
  | PushResultMessage
  | RepoListMessage
  | DaemonErrorMessage;

export interface AuthResultMessage {
  type: 'auth-result';
  success: boolean;
  error?: string;
}

export interface DaemonInfoMessage {
  type: 'daemon-info';
  version: string;
  hostname: string;
  engines: {
    claude_code: boolean;
    codex: boolean;
  };
  repos: RepoInfo[];
}

export interface RepoInfo {
  path: string;
  name: string;
  branch: string;
  clean: boolean;
}

export interface WorkstreamStreamMessage {
  type: 'stream';
  workstream_id: string;
  engine: EngineType;
  event: unknown; // Raw CLI event — consumer casts to ClaudeCodeStreamEvent | CodexEvent
  timestamp: number;
}

export interface WorkstreamStatusMessage {
  type: 'status';
  workstream_id: string;
  status: WorkstreamStatus;
}

export interface WorkstreamDoneMessage {
  type: 'done';
  workstream_id: string;
  summary?: string;
  duration_ms?: number;
}

export interface WorkstreamErrorMessage {
  type: 'error';
  workstream_id: string;
  message: string;
  code?: string;
}

export interface PushResultMessage {
  type: 'push-result';
  workstream_id: string;
  success: boolean;
  output: string;
}

export interface RepoListMessage {
  type: 'repo-list';
  repos: RepoInfo[];
}

export interface DaemonErrorMessage {
  type: 'daemon-error';
  message: string;
}
