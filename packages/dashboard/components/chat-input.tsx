'use client';

import { useState, useRef, useEffect } from 'react';
import { useSessionStore } from '@/lib/stores/session-store';

export function ChatInput() {
  const [input, setInput] = useState('');
  const sendMessage = useSessionStore((s) => s.sendMessage);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const planText = useSessionStore((s) => s.planText);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Detect if plan is waiting for approval
  const isWaiting =
    !isStreaming &&
    planText.length > 200 &&
    /awaiting.*approval|say.*["\u201c]go["\u201d]|ship it|looks good|approved/i.test(
      planText.slice(-500),
    );

  const handleSend = () => {
    const text = input.trim();
    if (!text || !activeSessionId) return;
    sendMessage(text);
    setInput('');
  };

  const handleApprove = () => {
    sendMessage('Approved. Ship it.');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-focus on session change
  useEffect(() => {
    if (activeSessionId) inputRef.current?.focus();
  }, [activeSessionId]);

  return (
    <div className="border-t border-border p-3 bg-bg-sidebar space-y-2">
      {/* Approve button */}
      {isWaiting && (
        <button
          onClick={handleApprove}
          className="w-full py-2 bg-success/20 text-success border border-success/30 rounded-lg text-sm font-medium hover:bg-success/30 transition-colors"
        >
          ✅ Approve Plan
        </button>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeSessionId
              ? 'Send a message to the orchestrator…'
              : 'Select a session first'
          }
          disabled={!activeSessionId}
          rows={1}
          className="flex-1 px-3 py-2 bg-bg-input border border-border rounded-lg text-sm text-fg placeholder:text-fg-dim resize-none focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !activeSessionId}
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
