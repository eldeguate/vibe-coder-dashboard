import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { SessionSidebar } from '@/components/session-sidebar';
import { WorkstreamPanel } from '@/components/workstream-panel';
import { StatusBar } from '@/components/status-bar';

export const metadata: Metadata = {
  title: 'Vibe Coder Dashboard',
  description: 'Personal command center for multi-agent vibe coding',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <Providers>
          <div className="h-screen flex flex-col bg-bg overflow-hidden">
            {/* Three-column layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left sidebar: sessions + daemon status */}
              <aside className="w-64 border-r border-border bg-bg-sidebar flex flex-col shrink-0">
                <SessionSidebar />
              </aside>

              {/* Main content */}
              <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                {children}
              </main>

              {/* Right sidebar: workstreams */}
              <aside className="w-80 border-l border-border bg-bg-sidebar flex flex-col shrink-0">
                <WorkstreamPanel />
              </aside>
            </div>

            {/* Status bar */}
            <StatusBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
