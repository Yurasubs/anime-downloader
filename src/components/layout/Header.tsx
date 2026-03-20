'use client';

import { useState } from 'react';
import { useAPI } from '@/lib/useAPI';
import { useAppStore } from '@/lib/store';
import {
  Search,
  ListOrdered,
  LogOut,
  Loader2,
  User,
  Settings,
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
  const { changeProvider } = useAPI();
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
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-3 items-center h-16">
            {/* Left: Logo + Service */}
            <div className="flex items-center gap-3 justify-start">
              <h1 className="text-xl font-bold tracking-tight">AniDL</h1>
              {service && (
                <span
                  className={`text-[15px] font-medium ${serviceColors[service] || 'text-primary'}`}
                >
                  {serviceNames[service] || service}
                </span>
              )}
              {version && (
                <span className="text-[13px] text-muted-foreground hidden sm:inline">
                  v{version}
                </span>
              )}
            </div>

            {/* Center: Tabs */}
            <div className="flex justify-center">
              <nav className="flex items-center gap-1 bg-surface border border-border/50 rounded-xl p-1.5 shadow-sm">
                <button
                  onClick={() => onTabChange('search')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'search'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <Search className="w-[18px] h-[18px]" />
                  Search
                </button>
                <button
                  onClick={() => onTabChange('queue')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'queue'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <ListOrdered className="w-[18px] h-[18px]" />
                  Queue
                  {queue.length > 0 && (
                    <span className="bg-orange-500 text-white text-[11px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center -ml-0.5 shadow-sm">
                      {queue.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => onTabChange('settings')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'settings'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <Settings className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAuth(true)}
                className={`p-2 rounded-lg transition-colors ${
                  isAuthenticated
                    ? 'text-success hover:bg-success/10'
                    : 'text-muted-foreground hover:bg-surface hover:text-foreground'
                }`}
                title={isAuthenticated ? 'Authenticated' : 'Sign in to service'}
              >
                <User className="w-[18px] h-[18px]" />
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-2 rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-colors disabled:opacity-50"
                title="Switch service"
              >
                {loggingOut ? (
                  <Loader2 className="w-[18px] h-[18px] animate-spin" />
                ) : (
                  <LogOut className="w-[18px] h-[18px]" />
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
