// src/components/layout/MobileNav.tsx
import React from 'react';
import { MessageSquare, Calendar, Inbox, ScrollText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileNavProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

const navItems = [
  { name: 'Chat', icon: MessageSquare, route: '/dashboard' },
  { name: 'Calendar', icon: Calendar, route: '/calendar' },
  { name: 'Inbox', icon: Inbox, route: '/inbox' },
  { name: 'Log', icon: ScrollText, route: '/audit-log' },
  { name: 'Settings', icon: Settings, route: '/settings' },
];

export function MobileNav({ activeRoute, onNavigate }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around items-center z-40 md:hidden pb-safe pt-2 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const isActive = activeRoute === item.route;
        const Icon = item.icon;
        return (
          <button
            key={item.name}
            onClick={() => onNavigate(item.route)}
            className="flex flex-col items-center justify-center p-2 min-w-[64px]"
          >
            <Icon
              className={cn(
                "w-6 h-6 mb-1 transition-colors",
                isActive ? "text-primary" : "text-muted"
              )}
            />
            {isActive && <div className="w-1 h-1 bg-primary rounded-full" />}
          </button>
        );
      })}
    </nav>
  );
}
