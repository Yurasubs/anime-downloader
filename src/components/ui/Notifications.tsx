'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Notifications() {
  const notifications = useAppStore((s) => s.notifications);
  const removeNotification = useAppStore((s) => s.removeNotification);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notif) => (
        <NotificationItem
          key={notif.id}
          id={notif.id}
          message={notif.message}
          type={notif.type}
          onDismiss={removeNotification}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  id,
  message,
  type,
  onDismiss,
}: {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success';
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const icons = {
    info: <Info className="w-4 h-4 text-blue-400" />,
    error: <AlertCircle className="w-4 h-4 text-red-400" />,
    success: <CheckCircle className="w-4 h-4 text-green-400" />,
  };

  const borders = {
    info: 'border-blue-500/30',
    error: 'border-red-500/30',
    success: 'border-green-500/30',
  };

  return (
    <div
      className={`flex items-start gap-3 bg-surface border ${borders[type]} rounded-lg p-3 shadow-xl backdrop-blur-sm animate-in slide-in-from-right`}
    >
      <span className="mt-0.5">{icons[type]}</span>
      <p className="text-sm text-foreground flex-1">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-muted hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
