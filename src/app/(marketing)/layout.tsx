// src/app/(marketing)/layout.tsx
import React from 'react';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col">
      {children}
    </div>
  );
}
