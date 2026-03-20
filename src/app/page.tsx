'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAPI } from '@/lib/useAPI';
import LoginScreen from '@/components/layout/LoginScreen';
import SetupScreen from '@/components/layout/SetupScreen';
import ServiceSelect from '@/components/layout/ServiceSelect';
import MainLayout from '@/components/layout/MainLayout';
import Notifications from '@/components/ui/Notifications';

export default function Home() {
  const view = useAppStore((s) => s.view);
  const { checkSetup } = useAPI();

  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  return (
    <>
      <Notifications />
      {view === 'login' && <LoginScreen />}
      {view === 'setup' && <SetupScreen />}
      {view === 'service-select' && <ServiceSelect />}
      {view === 'main' && <MainLayout />}
    </>
  );
}
