// src/components/layout/Sidebar.tsx
import React from 'react';
import { Sparkles, MessageSquare, Calendar, Inbox, ScrollText, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
  userName: string;
  userAvatar: string | null;
  userPlan: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { name: 'Briefing', icon: Sparkles, route: '/briefing' },
  { name: 'Chat', icon: MessageSquare, route: '/dashboard' },
  { name: 'Calendar', icon: Calendar, route: '/calendar' },
  { name: 'Inbox', icon: Inbox, route: '/inbox' },
  { name: 'Audit Log', icon: ScrollText, route: '/audit-log' },
  { name: 'Settings', icon: Settings, route: '/settings' },
];

export function Sidebar({
  activeRoute,
  onNavigate,
  userName,
  userAvatar,
  userPlan,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-surface border-r border-border flex flex-col transition-all duration-300 z-40 hidden md:flex",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex items-center justify-center h-16 shrink-0 border-b border-border">
        {/* FlowMind Logo */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4 4H10V10H4V4Z" fill="currentColor" className="text-primary" />
          <path d="M14 4H20V10H14V4Z" fill="currentColor" className="text-primary" />
          <path d="M4 14H10V20H4V14Z" fill="currentColor" className="text-primary" />
        </svg>
        {!isCollapsed && <span className="ml-3 font-bold text-lg">FlowMind</span>}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => {
            const isActive = activeRoute === item.route;
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <button
                  onClick={() => onNavigate(item.route)}
                  className={cn(
                    "w-full flex items-center p-2 rounded-lg transition-colors group",
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted hover:bg-surface-offset border-l-2 border-transparent"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={cn("w-5 h-5 shrink-0", !isCollapsed && "mr-3")} />
                  {!isCollapsed && <span>{item.name}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border shrink-0">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "")}>
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              getInitials(userName)
            )}
          </div>
          {!isCollapsed && (
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{userName}</p>
              <span className="text-xs text-muted uppercase bg-surface-offset px-1.5 py-0.5 rounded">
                {userPlan}
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 bottom-6 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center text-muted hover:text-primary z-50 transition-transform"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );
}
