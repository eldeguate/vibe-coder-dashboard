'use client';

import { useState } from 'react';
import { useDaemonStore } from '@/lib/stores/daemon-store';
import Link from 'next/link';

export default function SettingsPage() {
  const { daemonUrl, daemonToken, setConfig, status } = useDaemonStore();
  const [url, setUrl] = useState(daemonUrl);
  const [token, setToken] = useState(daemonToken);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setConfig(url, token);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-md p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-fg">Daemon Settings</h1>
          <Link href="/" className="text-xs text-fg-muted hover:text-fg">
            ← Back
          </Link>
        </div>

        <p className="text-sm text-fg-muted">
          Configure the connection to your local execution daemon.
          The daemon must be running with a matching token.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-fg-muted mb-1">WebSocket URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="ws://localhost:7777"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-fg text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-fg-muted mb-1">Daemon Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="your-secret-token"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-fg text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            {saved ? '✓ Saved!' : 'Save & Reconnect'}
          </button>

          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'connected' ? 'bg-success' :
                status === 'error' ? 'bg-error' :
                status === 'connecting' ? 'bg-warning animate-pulse' :
                'bg-fg-dim'
              }`}
            />
            <span className="text-fg-muted">Status: {status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
