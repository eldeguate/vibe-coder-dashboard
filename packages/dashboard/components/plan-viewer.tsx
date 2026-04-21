'use client';

import { useState, useMemo } from 'react';

interface PlanSection {
  id: string;
  title: string;
  content: string;
}

function parseSections(text: string): PlanSection[] {
  if (!text.trim()) return [];

  const sections: PlanSection[] = [];
  const lines = text.split('\n');
  let title = 'Preamble';
  let id = 'pre';
  let content: string[] = [];

  for (const line of lines) {
    // Match plan section headers: ## 0. Title, ## 1. Title, etc.
    const match = line.match(/^##\s+(\d+)\.\s*(.*)/);
    if (match) {
      if (content.length > 0 || title !== 'Preamble') {
        sections.push({ id, title, content: content.join('\n').trim() });
      }
      id = `section-${match[1]}`;
      title = `${match[1]}. ${match[2]}`;
      content = [];
    } else {
      content.push(line);
    }
  }

  // Push final section
  if (content.length > 0) {
    sections.push({ id, title, content: content.join('\n').trim() });
  }

  return sections;
}

export function PlanViewer({ text }: { text: string }) {
  const sections = useMemo(() => parseSections(text), [text]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  if (sections.length === 0) {
    return (
      <div className="prose prose-invert max-w-none text-sm">
        <pre className="whitespace-pre-wrap text-fg-muted font-mono text-xs">
          {text}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <div
          key={section.id}
          className="rounded-lg border border-border bg-bg-card overflow-hidden"
        >
          <button
            onClick={() => toggle(section.id)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-bg-input transition-colors"
          >
            <span className="text-sm font-medium text-fg">
              {section.title}
            </span>
            <span className="text-fg-dim text-xs">
              {collapsed[section.id] ? '▶' : '▼'}
            </span>
          </button>
          {!collapsed[section.id] && (
            <div className="px-4 pb-3 border-t border-border/50">
              <pre className="whitespace-pre-wrap text-xs text-fg-muted font-mono leading-relaxed mt-2">
                {section.content}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
