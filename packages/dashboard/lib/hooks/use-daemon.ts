'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDaemonStore } from '@/lib/stores/daemon-store';
import type { DashboardToDaemonMessage } from '@vibe-coder/shared';

/**
 * Manages the WebSocket connection to the local execution daemon.
 * Auto-reconnects on disconnect (3s delay).
 *
 * The daemon is a WebSocket SERVER on the user's machine.
 * This hook creates a client connection from the browser.
 */
export function useDaemon() {
  const daemonUrl = useDaemonStore((s) => s.daemonUrl);
  const daemonToken = useDaemonStore((s) => s.daemonToken);
  const wsRef = useRef<WebSocket | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);

  const send = useCallback((msg: DashboardToDaemonMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    if (!daemonUrl || !daemonToken) return;

    const {
      setStatus,
      setDaemonInfo,
      updateWorkstreamStatus,
      appendWorkstreamEvent,
    } = useDaemonStore.getState();

    let reconnectTimer: ReturnType<typeof setTimeout>;
    const ws = new WebSocket(daemonUrl);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token: daemonToken }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        switch (msg.type) {
          case 'auth-result':
            setStatus(msg.success ? 'connected' : 'error');
            break;
          case 'daemon-info':
            setDaemonInfo(msg);
            break;
          case 'stream':
            appendWorkstreamEvent(msg.workstream_id, msg.event);
            break;
          case 'status':
            updateWorkstreamStatus(msg.workstream_id, msg.status);
            break;
          case 'done':
            updateWorkstreamStatus(msg.workstream_id, 'done');
            break;
          case 'error':
            if (msg.workstream_id) {
              updateWorkstreamStatus(msg.workstream_id, 'failed');
            }
            break;
        }
      } catch {
        /* skip unparseable messages */
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;
      reconnectTimer = setTimeout(
        () => setReconnectKey((k) => k + 1),
        3000,
      );
    };

    ws.onerror = () => setStatus('error');

    return () => {
      clearTimeout(reconnectTimer);
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daemonUrl, daemonToken, reconnectKey]);

  return { send };
}
