// src/app/(dashboard)/dashboard/page.tsx
'use client';

import React from 'react';
import { useChatViewModel } from '@/viewmodels/useChatViewModel';
import { useIntegrationStore } from '@/stores/integrationStore';
import { ChatWindow } from '@/components/chat/ChatWindow';

export default function DashboardPage() {
  const {
    messages,
    isStreaming,
    activeToolCall,
    pendingConfirmation,
    sendMessage,
    confirmAction,
    cancelAction,
    clearChat,
    examplePrompts
  } = useChatViewModel();

  const { googleCalendarConnected, gmailConnected } = useIntegrationStore();

  return (
    <div className="h-full flex flex-col p-4 md:p-6 bg-base">
      <ChatWindow
        messages={messages}
        isStreaming={isStreaming}
        activeToolCall={activeToolCall}
        pendingConfirmation={pendingConfirmation}
        onSendMessage={sendMessage}
        examplePrompts={[...examplePrompts]}
        isIntegrationConnected={googleCalendarConnected || gmailConnected}
      />
    </div>
  );
}
