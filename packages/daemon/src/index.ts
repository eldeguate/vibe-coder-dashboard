/**
 * Vibe Coder Dashboard — Local Execution Daemon
 *
 * Lightweight WebSocket server that:
 *   1. Authenticates browser connections via pre-shared DAEMON_TOKEN
 *   2. Receives workstream briefs from the dashboard
 *   3. Spawns Claude Code CLI or Codex CLI in allowlisted repo directories
 *   4. Streams NDJSON/JSONL output back to the browser in real-time
 *   5. Supports kill (SIGTERM) per workstream and git push
 *
 * Security:
 *   - Token auth on every WebSocket connection
 *   - Repo path validated against DAEMON_REPOS allowlist
 *   - Only spawns `claude` and `codex` binaries (never raw shell)
 *   - Git operations use spawnSync with array args (no shell injection)
 *   - Runs as unprivileged user
 *
 * Run:  pnpm daemon        (tsx, dev mode)
 * Dev:  pnpm daemon:dev    (tsx watch)
 */

import { WebSocketServer, WebSocket } from 'ws';
import { spawn, spawnSync, type ChildProcess } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// ─── Config ─────────────────────────────────────────────

const PORT = parseInt(process.env.DAEMON_PORT || '7777', 10);
const TOKEN = process.env.DAEMON_TOKEN;
const REPOS = (process.env.DAEMON_REPOS || '')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);

if (!TOKEN) {
  console.error('❌ DAEMON_TOKEN is required. Set it in .env');
  process.exit(1);
}

// ─── State ──────────────────────────────────────────────

const children = new Map<string, ChildProcess>();

// ─── Helpers ────────────────────────────────────────────

const json = (ws: WebSocket, msg: unknown) =>
  ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(msg));

/** Check if a binary exists. Uses spawnSync to avoid shell injection. */
const has = (bin: string) =>
  spawnSync('which', [bin], { stdio: 'ignore' }).status === 0;

const repoInfo = (p: string) => {
  try {
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: p, encoding: 'utf-8' }).stdout.trim();
    const dirty = spawnSync('git', ['status', '--porcelain'], { cwd: p, encoding: 'utf-8' }).stdout.trim();
    return { path: p, name: path.basename(p), branch: branch || 'unknown', clean: dirty === '' };
  } catch {
    return { path: p, name: path.basename(p), branch: 'unknown', clean: false };
  }
};

const isAllowed = (repoPath: string) => {
  const resolved = path.resolve(repoPath);
  return REPOS.some((r) => resolved.startsWith(path.resolve(r)));
};

// ─── WebSocket Server ───────────────────────────────────

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  let authed = false;

  ws.on('message', (raw) => {
    let msg: Record<string, unknown>;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    // Gate: must auth first
    if (!authed) {
      if (msg.type === 'auth' && msg.token === TOKEN) {
        authed = true;
        json(ws, { type: 'auth-result', success: true });
        json(ws, {
          type: 'daemon-info',
          version: '0.1.0',
          hostname: os.hostname(),
          repos: REPOS.map(repoInfo),
          engines: { claude_code: has('claude'), codex: has('codex') },
        });
      } else {
        json(ws, { type: 'auth-result', success: false, error: 'Invalid token' });
        ws.close();
      }
      return;
    }

    // Dispatch
    switch (msg.type) {
      case 'execute-workstream': return execute(ws, msg);
      case 'kill':              return kill(ws, msg.workstream_id as string);
      case 'push':              return gitPush(ws, msg);
      case 'list-repos':        return json(ws, { type: 'repo-list', repos: REPOS.map(repoInfo) });
    }
  });
});

// ─── Execute Workstream ─────────────────────────────────

function execute(ws: WebSocket, msg: Record<string, unknown>) {
  const id = msg.workstream_id as string;
  const engine = msg.engine as string;
  const prompt = msg.prompt as string;
  const repoPath = path.resolve(msg.repo_path as string);

  // Security: validate repo path
  if (!isAllowed(repoPath)) {
    return json(ws, { type: 'error', workstream_id: id, message: `Repo not in allowlist: ${repoPath}` });
  }
  if (!fs.existsSync(repoPath)) {
    return json(ws, { type: 'error', workstream_id: id, message: `Path not found: ${repoPath}` });
  }

  // Security: only claude and codex binaries (never arbitrary commands)
  let cmd: string;
  let args: string[];
  if (engine === 'claude-code') {
    cmd = 'claude';
    args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--include-partial-messages'];
  } else if (engine === 'codex') {
    cmd = 'codex';
    args = ['exec', '--json', '--full-auto', '--sandbox', 'workspace-write', prompt];
  } else {
    return json(ws, { type: 'error', workstream_id: id, message: `Unknown engine: ${engine}` });
  }

  json(ws, { type: 'status', workstream_id: id, status: 'running' });

  const child = spawn(cmd, args, {
    cwd: repoPath,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.set(id, child);

  // Stream stdout line-by-line (NDJSON / JSONL)
  let buf = '';
  child.stdout!.on('data', (chunk: Buffer) => {
    buf += chunk.toString();
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        json(ws, { type: 'stream', workstream_id: id, engine, event, timestamp: Date.now() });
      } catch {
        json(ws, { type: 'stream', workstream_id: id, engine, event: { type: 'raw', text: line }, timestamp: Date.now() });
      }
    }
  });

  child.stderr!.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim();
    if (text) json(ws, { type: 'stream', workstream_id: id, engine, event: { type: 'stderr', text }, timestamp: Date.now() });
  });

  child.on('close', (code) => {
    children.delete(id);
    if (buf.trim()) {
      try { json(ws, { type: 'stream', workstream_id: id, engine, event: JSON.parse(buf), timestamp: Date.now() }); } catch {}
    }
    code === 0
      ? json(ws, { type: 'done', workstream_id: id })
      : json(ws, { type: 'error', workstream_id: id, message: `Exit code ${code}` });
  });

  child.on('error', (err) => {
    children.delete(id);
    json(ws, { type: 'error', workstream_id: id, message: `Spawn failed: ${err.message}` });
  });
}

// ─── Kill ────────────────────────────────────────────────

function kill(ws: WebSocket, id: string) {
  const child = children.get(id);
  if (child) {
    child.kill('SIGTERM');
    children.delete(id);
    json(ws, { type: 'status', workstream_id: id, status: 'pending' });
  }
}

// ─── Git Push (all args via array — no shell injection possible) ───

function gitPush(ws: WebSocket, msg: Record<string, unknown>) {
  const id = msg.workstream_id as string;
  const repoPath = path.resolve(msg.repo_path as string);

  if (!isAllowed(repoPath)) {
    return json(ws, { type: 'push-result', workstream_id: id, success: false, output: 'Repo not in allowlist' });
  }

  try {
    // All git operations use spawnSync with array args — never shell strings
    spawnSync('git', ['add', '-A'], { cwd: repoPath });

    const commitMsg = String(msg.commit_message || `workstream ${id}`);
    const commitResult = spawnSync('git', ['commit', '-m', commitMsg], {
      cwd: repoPath,
      encoding: 'utf-8',
    });
    // commit may fail if nothing to commit — that's OK

    const branch = String(msg.branch || 'HEAD');
    const pushResult = spawnSync('git', ['push', 'origin', branch], {
      cwd: repoPath,
      encoding: 'utf-8',
    });

    if (pushResult.status === 0) {
      json(ws, { type: 'push-result', workstream_id: id, success: true, output: pushResult.stdout || pushResult.stderr || 'Pushed' });
    } else {
      json(ws, { type: 'push-result', workstream_id: id, success: false, output: pushResult.stderr || 'Push failed' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    json(ws, { type: 'push-result', workstream_id: id, success: false, output: message });
  }
}

// ─── Startup ─────────────────────────────────────────────

console.log(`⚡ Vibe Coder Daemon v0.1.0`);
console.log(`   Port:    ${PORT}`);
console.log(`   Repos:   ${REPOS.length > 0 ? REPOS.join(', ') : '(none — set DAEMON_REPOS)'}`);
console.log(`   Claude:  ${has('claude') ? '✅' : '❌ not found'}`);
console.log(`   Codex:   ${has('codex') ? '✅' : '❌ not found'}`);
console.log(`   Ready for connections.\n`);
