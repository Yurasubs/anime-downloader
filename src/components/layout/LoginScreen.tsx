'use client';

import { useState, FormEvent } from 'react';
import { useWebSocket } from '@/lib/useWebSocket';
import { useAppStore } from '@/lib/store';
import { Lock, Loader2 } from 'lucide-react';

export default function LoginScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { connectPrivate } = useWebSocket();
  const addNotification = useAppStore((s) => s.addNotification);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      addNotification('Please enter a password', 'error');
      return;
    }
    setLoading(true);
    try {
      await connectPrivate(password);
    } catch {
      addNotification('Invalid password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AniDL</h1>
          <p className="text-muted mt-2">Multi Downloader NX</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-xl p-6 space-y-4"
        >
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted mb-2">
              Server Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
