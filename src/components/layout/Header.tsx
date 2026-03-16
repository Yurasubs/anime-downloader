'use client';

import { useState } from 'react';
import { useWebSocket } from '@/lib/useWebSocket';
import { useAppStore } from '@/lib/store';
import {
  Search,
  ListOrdered,
  LogOut,
  FolderOpen,
  Loader2,
  User,
} from 'lucide-react';
import type { Tab } from './MainLayout';
import AuthDialog from '@/components/ui/AuthDialog';

export default function Header({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  const service = useAppStore((s) => s.service);
  const version = useAppStore((s) => s.version);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const queue = useAppStore((s) => s.queue);
  const { changeProvider, openFolder } = useWebSocket();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const serviceNames: Record<string, string> = {
    crunchy: 'Crunchyroll',
    hidive: 'HIDIVE',
    adn: 'ADN',
  };

  const serviceColors: Record<string, string> = {
    crunchy: 'text-orange-400',
    hidive: 'text-cyan-400',
    adn: 'text-blue-400',
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await changeProvider();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo + Service */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold tracking-tight">AniDL</h1>
              {service && (
                <span
                  className={`text-sm font-medium ${serviceColors[service] || 'text-primary'}`}
                >
                  {serviceNames[service] || service}
                </span>
              )}
              {version && (
                <span className="text-xs text-muted/50 hidden sm:inline">
                  v{version}
                </span>
              )}
            </div>

            {/* Center: Tabs */}
            <nav className="flex items-center gap-1 bg-background rounded-lg p-1">
              <button
                onClick={() => onTabChange('search')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'search'
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              <button
                onClick={() => onTabChange('queue')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'queue'
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                Queue
                {queue.length > 0 && (
                  <span className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {queue.length}
                  </span>
                )}
              </button>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAuth(true)}
                className={`p-2 rounded-lg transition-colors ${
                  isAuthenticated
                    ? 'text-success hover:bg-success/10'
                    : 'text-muted hover:bg-surface-hover hover:text-foreground'
                }`}
                title={isAuthenticated ? 'Authenticated' : 'Sign in to service'}
              >
                <User className="w-4 h-4" />
              </button>
              <button
                onClick={() => openFolder('content')}
                className="p-2 rounded-lg text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                title="Open output folder"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-2 rounded-lg text-muted hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-50"
                title="Switch service"
              >
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {showAuth && <AuthDialog onClose={() => setShowAuth(false)} />}
    </>
  );
}
