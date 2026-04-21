'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/lib/stores/session-store';

/**
 * Connects to the SSE proxy for the active Managed Agents session.
 * Parses agent.message events into planText for the plan viewer.
 * Detects session.status idle (waiting for approval).
 */
export function useSSE() {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const esRef = useRef<EventSource | null>(null);

  const close = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    useSessionStore.getState().setStreaming(false);
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      close();
      return;
    }

    // Clean previous connection
    close();

    const { addEvent, appendPlanText, setStreaming } =
      useSessionStore.getState();

    const es = new EventSource(`/api/sessions/${activeSessionId}/stream`);
    esRef.current = es;
    setStreaming(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addEvent(data);

        // Accumulate agent text for plan viewer
        if (data.type === 'agent.message' && data.content?.text) {
          appendPlanText(data.content.text);
        }

        // Detect idle → waiting for user input (e.g., approval)
        if (data.type === 'session.status' && data.status === 'idle') {
          setStreaming(false);
        }
      } catch {
        // Ignore unparseable SSE data lines
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects; just mark non-streaming
      setStreaming(false);
    };

    return close;
  }, [activeSessionId, close]);

  return { close };
}
