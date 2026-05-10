// src/components/layout/TopBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TopBarProps {
  title: string;
  subtitle?: string;
  googleCalendarConnected: boolean;
  gmailConnected: boolean;
  microsoftConnected: boolean;
  onSignOut: () => void;
  userAvatar: string | null;
  userName: string;
}

export function TopBar({
  title,
  subtitle,
  googleCalendarConnected,
  gmailConnected,
  microsoftConnected,
  onSignOut,
  userAvatar,
  userName,
}: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/80 backdrop-blur-sm border-b border-border h-16 flex items-center justify-between px-4 md:px-8">
      <div>
        <h1 className="text-lg font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>

      <div className="flex flex-row items-center gap-3">
        {/* Integration Status Pills */}
        <div className="hidden md:flex items-center gap-2">
          <div className={cn("flex items-center text-xs px-2 py-1 rounded-full border", googleCalendarConnected ? "bg-primary/5 border-primary/20 text-text-primary" : "bg-surface border-border text-muted opacity-60")}>
            <span className={cn("w-2 h-2 rounded-full mr-1.5", googleCalendarConnected ? "bg-primary" : "bg-muted")}></span>
            Google Cal
          </div>
          <div className={cn("flex items-center text-xs px-2 py-1 rounded-full border", gmailConnected ? "bg-primary/5 border-primary/20 text-text-primary" : "bg-surface border-border text-muted opacity-60")}>
            <span className={cn("w-2 h-2 rounded-full mr-1.5", gmailConnected ? "bg-primary" : "bg-muted")}></span>
            Gmail
          </div>
          <div className={cn("flex items-center text-xs px-2 py-1 rounded-full border", microsoftConnected ? "bg-primary/5 border-primary/20 text-text-primary" : "bg-surface border-border text-muted opacity-60")}>
            <span className={cn("w-2 h-2 rounded-full mr-1.5", microsoftConnected ? "bg-primary" : "bg-muted")}></span>
            Microsoft
          </div>
        </div>

        <div className="h-6 w-px bg-border mx-2 hidden md:block"></div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold overflow-hidden focus-visible-ring"
          >
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              getInitials(userName)
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg overflow-hidden py-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onSignOut();
                }}
                className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-offset flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
