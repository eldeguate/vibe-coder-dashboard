/**
 * Vibe Coder Dashboard — Local Execution Daemon
 *
 * Lightweight WebSocket server that:
 *   1. Authenticates browser connections via pre-shared DAEMON_TOKEN
 *   2. Receives workstream execution requests
 *   3. Spawns Claude Code CLI or Codex CLI in allowlisted repo directories
 *   4. Streams NDJSON/JSONL output back to the browser in real-time
 *   5. Supports kill (SIGTERM) per workstream
 *
 * Run: pnpm --filter @vibe-coder/daemon start
 * Dev: pnpm --filter @vibe-coder/daemon dev
 *
 * Scaffold — full implementation in workstream 4.
 */

const PORT = parseInt(process.env.DAEMON_PORT || '7777', 10);
const TOKEN = process.env.DAEMON_TOKEN;
const REPOS = (process.env.DAEMON_REPOS || '').split(',').filter(Boolean);

if (!TOKEN) {
  console.error('❌ DAEMON_TOKEN is required. Set it in .env');
  process.exit(1);
}

console.log(`⚡ Vibe Coder Daemon`);
console.log(`   Port: ${PORT}`);
console.log(`   Repos: ${REPOS.length > 0 ? REPOS.join(', ') : '(none configured)'}`);
console.log(`   Status: scaffold ready — awaiting WS4 implementation`);
