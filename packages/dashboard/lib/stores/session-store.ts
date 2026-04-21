'use client';

import { create } from 'zustand';

interface SessionEvent {
  type: string;
  [key: string]: unknown;
}

interface Session {
  id: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface SessionStore {
  sessions: Session[];
  activeSessionId: string | null;
  events: SessionEvent[];
  planText: string;
  isStreaming: boolean;

  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  setActiveSession: (id: string | null) => void;
  addEvent: (event: SessionEvent) => void;
  appendPlanText: (text: string) => void;
  setStreaming: (streaming: boolean) => void;
  reset: () => void;

  fetchSessions: () => Promise<void>;
  createSession: () => Promise<string | null>;
  sendMessage: (content: string) => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  events: [],
  planText: '',
  isStreaming: false,

  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((s) => ({ sessions: [session, ...s.sessions] })),
  setActiveSession: (id) =>
    set({ activeSessionId: id, events: [], planText: '', isStreaming: false }),
  addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
  appendPlanText: (text) => set((s) => ({ planText: s.planText + text })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  reset: () => set({ events: [], planText: '', isStreaming: false }),

  fetchSessions: async () => {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) return;
      const data = await res.json();
      set({ sessions: Array.isArray(data) ? data : data.data ?? [] });
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    }
  },

  createSession: async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) return null;
      const session = await res.json();
      get().addSession(session);
      get().setActiveSession(session.id);
      return session.id;
    } catch (e) {
      console.error('Failed to create session:', e);
      return null;
    }
  },

  sendMessage: async (content: string) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    try {
      await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  },
}));
