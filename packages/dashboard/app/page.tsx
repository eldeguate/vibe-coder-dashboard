export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="text-center space-y-4">
        <div className="text-5xl">⚡</div>
        <h1 className="text-3xl font-bold text-fg">
          Vibe Coder Dashboard
        </h1>
        <p className="text-fg-muted max-w-md">
          Personal command center for multi-agent vibe coding.
          Scaffold ready — awaiting UI implementation.
        </p>
        <div className="flex gap-3 justify-center text-sm text-fg-dim">
          <span className="px-2 py-1 rounded bg-bg-card border border-border">
            Managed Agents API
          </span>
          <span className="px-2 py-1 rounded bg-bg-card border border-border">
            Claude Code CLI
          </span>
          <span className="px-2 py-1 rounded bg-bg-card border border-border">
            Codex CLI
          </span>
        </div>
      </div>
    </div>
  );
}
