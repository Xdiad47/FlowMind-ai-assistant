// src/app/(dashboard)/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { FullScreenSpinner } from '@/components/shared/FullScreenSpinner';
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel';
import { useIntegrationStore } from '@/stores/integrationStore';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Chat',
  '/calendar': 'Calendar',
  '/inbox': 'Inbox',
  '/audit-log': 'Audit Log',
  '/settings': 'Settings',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, signOut } = useAuthViewModel();
  const integrations = useIntegrationStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show spinner during auth check
  if (isLoading) return <FullScreenSpinner />;
  // Don't render dashboard until authenticated
  if (!isAuthenticated) return null;

  const pageTitle = PAGE_TITLES[pathname] || 'FlowMind';

  return (
    <div className="flex h-screen bg-bg text-text-primary overflow-hidden">
      <Sidebar
        activeRoute={pathname}
        onNavigate={router.push}
        userName={user?.name || 'User'}
        userAvatar={user?.avatar || null}
        userPlan={user?.plan || 'free'}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        <TopBar
          title={pageTitle}
          googleCalendarConnected={integrations.googleCalendarConnected}
          gmailConnected={integrations.gmailConnected}
          microsoftConnected={integrations.microsoftCalendarConnected}
          onSignOut={signOut}
          userAvatar={user?.avatar || null}
          userName={user?.name || 'User'}
        />
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
      <MobileNav activeRoute={pathname} onNavigate={router.push} />
    </div>
  );
}
