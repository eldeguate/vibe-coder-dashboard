# ⚡ Vibe Coder Dashboard

Personal command center for multi-agent vibe coding.

## Three Layers

1. **Cloud Orchestrator** — Anthropic Managed Agents API for plan generation and approval workflow
2. **Local Daemon** — Spawns Claude Code CLI / Codex CLI on your machine, streams output in real-time
3. **Dashboard UI** — Dark-themed Next.js app with session management, plan viewer, workstream cards

## Quick Start

```bash
# Install
pnpm install

# Start dashboard (dev)
pnpm dev

# Start daemon (separate terminal)
cp packages/daemon/.env.example packages/daemon/.env
# Edit .env with your tokens
pnpm daemon
```

## Stack

Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui v4 · Zustand · Node.js + ws · Vercel

## Architecture

See [CLAUDE.md](./CLAUDE.md) for full architecture rules and conventions.
