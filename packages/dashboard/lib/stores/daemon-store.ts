'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EngineType, WorkstreamStatus, RepoInfo } from '@vibe-coder/shared';

export interface Workstream {
  id: string;
  engine: EngineType;
  prompt: string;
  repoPath: string;
  status: WorkstreamStatus;
  events: unknown[];
}

interface DaemonStore {
  daemonUrl: string;
  daemonToken: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  hostname: string;
  repos: RepoInfo[];
  engines: { claude_code: boolean; codex: boolean };
  workstreams: Record<string, Workstream>;

  setConfig: (url: string, token: string) => void;
  setStatus: (status: DaemonStore['status']) => void;
  setDaemonInfo: (info: {
    hostname: string;
    repos: RepoInfo[];
    engines: { claude_code: boolean; codex: boolean };
  }) => void;
  addWorkstream: (ws: Workstream) => void;
  updateWorkstreamStatus: (id: string, status: WorkstreamStatus) => void;
  appendWorkstreamEvent: (id: string, event: unknown) => void;
  removeWorkstream: (id: string) => void;
}

export const useDaemonStore = create<DaemonStore>()(
  persist(
    (set) => ({
      daemonUrl: 'ws://localhost:7777',
      daemonToken: '',
      status: 'disconnected',
      hostname: '',
      repos: [],
      engines: { claude_code: false, codex: false },
      workstreams: {},

      setConfig: (daemonUrl, daemonToken) => set({ daemonUrl, daemonToken }),
      setStatus: (status) => set({ status }),
      setDaemonInfo: ({ hostname, repos, engines }) =>
        set({ hostname, repos, engines }),

      addWorkstream: (ws) =>
        set((s) => ({ workstreams: { ...s.workstreams, [ws.id]: ws } })),

      updateWorkstreamStatus: (id, status) =>
        set((s) => {
          const ws = s.workstreams[id];
          if (!ws) return s;
          return {
            workstreams: { ...s.workstreams, [id]: { ...ws, status } },
          };
        }),

      appendWorkstreamEvent: (id, event) =>
        set((s) => {
          const ws = s.workstreams[id];
          if (!ws) return s;
          return {
            workstreams: {
              ...s.workstreams,
              [id]: { ...ws, events: [...ws.events, event] },
            },
          };
        }),

      removeWorkstream: (id) =>
        set((s) => {
          const copy = { ...s.workstreams };
          delete copy[id];
          return { workstreams: copy };
        }),
    }),
    {
      name: 'vibe-coder-daemon',
      partialize: (state) => ({
        daemonUrl: state.daemonUrl,
        daemonToken: state.daemonToken,
      }),
    },
  ),
);
