// src/stores/integrationStore.ts
import { create } from 'zustand';

interface IntegrationState {
  googleCalendarConnected: boolean;
  gmailConnected: boolean;
  microsoftCalendarConnected: boolean;
  outlookConnected: boolean;
  apiKeySet: boolean;
  apiProvider: string | null;
}

interface IntegrationStore extends IntegrationState {
  setIntegration: (key: keyof IntegrationState, value: boolean | string | null) => void;
  setApiProvider: (provider: string | null) => void;
}

export const useIntegrationStore = create<IntegrationStore>((set) => ({
  googleCalendarConnected: false,
  gmailConnected: false,
  microsoftCalendarConnected: false,
  outlookConnected: false,
  apiKeySet: false,
  apiProvider: null,
  
  setIntegration: (key, value) => set((state) => ({ ...state, [key]: value })),
  
  setApiProvider: (apiProvider) => set({ apiProvider }),
}));
