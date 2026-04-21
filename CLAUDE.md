# CLAUDE.md — Vibe Coder Dashboard

## Project Identity
Personal command center for multi-agent vibe coding. Connects to Anthropic Managed Agents API
(cloud orchestration) and a local execution daemon (Claude Code CLI / Codex CLI). Single-user tool.
Replaces the Claude Console as Richard's daily interface for the Master Vibe Coder orchestrator.

## Stack
- Next.js 16.x (App Router, Turbopack) — dashboard web app
- TypeScript 5.x (strict mode)
- Tailwind CSS v4 (CSS-first config with @theme, no tailwind.config.ts)
- shadcn/ui v4 (base-ui primitives, NOT Radix — no `asChild` prop)
- Zustand 5.x (client state management)
- Node.js + ws (local daemon WebSocket server)
- pnpm workspaces (monorepo: shared, dashboard, daemon)
- Vercel (dashboard deploy)
- Anthropic Managed Agents API (managed-agents-2026-04-01 beta)
- Claude Code CLI (--output-format stream-json)
- Codex CLI (--json JSONL output)

## Commands
| Command | What it does |
|---------|-------------|
| pnpm install | Install all workspace dependencies |
| pnpm typecheck | Type check all packages |
| pnpm dev | Start dashboard dev server (Turbopack) |
| pnpm build | Build shared types + dashboard |
| pnpm daemon | Start daemon (tsx, dev mode) |
| pnpm daemon:dev | Start daemon with watch mode |

## Architecture Rules
- Server Components by default. Only add "use client" for interactivity.
- No database for MVP. Sessions from Managed Agents API. Preferences in localStorage.
- API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY) are NEVER NEXT_PUBLIC_.
- Dashboard API routes proxy to Anthropic Managed Agents API — browser never calls Anthropic directly.
- SSE streaming route for Managed Agents events uses Edge Runtime (no Vercel timeout).
- Daemon authenticates WebSocket connections with pre-shared DAEMON_TOKEN.
- Daemon ONLY spawns `claude` and `codex` binaries — never arbitrary shell commands.
- Daemon ONLY allows --cd to paths in the DAEMON_REPOS allowlist.
- Shared types live in packages/shared — both dashboard and daemon import from there.
- CLI event parsing normalized through engine adapters — never raw CLI types in UI components.
- MVP: daemon is a WebSocket server (browser connects to it). Phase 2: migrate to Supabase Realtime so daemon connects outbound and no port needs to be opened.

## File Map
| Path | What lives there |
|------|------------------|
| packages/shared/src/types/ | TypeScript types shared between dashboard + daemon |
| packages/dashboard/app/api/ | API proxy routes for Managed Agents |
| packages/dashboard/components/ | React UI components (shadcn/ui v4) |
| packages/dashboard/lib/stores/ | Zustand state stores |
| packages/dashboard/lib/anthropic.ts | Server-side Anthropic SDK client |
| packages/daemon/src/index.ts | Daemon entry point (WebSocket server + CLI spawner) |

## Environment Variables
| Name | Where | Description |
|------|-------|-------------|
| ANTHROPIC_API_KEY | Vercel + Daemon | Anthropic API key for Managed Agents + Claude Code CLI |
| OPENAI_API_KEY | Daemon only | OpenAI API key for Codex CLI |
| DAEMON_TOKEN | Daemon env + browser config | Pre-shared token for WebSocket auth |
| DAEMON_PORT | Daemon | WebSocket server port (default: 7777) |
| DAEMON_REPOS | Daemon | Comma-separated allowlist of repo paths |
| MANAGED_AGENT_ID | Vercel | Pre-configured Master Vibe Coder agent ID |
| ENVIRONMENT_ID | Vercel | Pre-configured Managed Agents environment ID |
| VAULT_ID | Vercel | Vault ID for MCP auth on sessions |

## What NOT to Do
- Do NOT add NEXT_PUBLIC_ prefix to any API key
- Do NOT add a database for MVP — keep it stateless
- Do NOT import raw CLI event types in UI components — use normalized types from shared
- Do NOT use Vercel for WebSocket connections — browser connects to daemon directly
- Do NOT use prisma anything — there is no database
- Do NOT buffer entire SSE streams in memory — pipe through (Edge Runtime)
- Do NOT spawn arbitrary shell commands in daemon — only `claude` and `codex` binaries
- Do NOT allow --cd to paths outside DAEMON_REPOS allowlist
- Do NOT use `asChild` (Radix pattern) — shadcn/ui v4 uses base-ui, use `buttonVariants()` instead
