// src/models/AgentAction.ts
export type ActionCategory = 'calendar' | 'gmail' | 'outlook' | 'system';
export type ActionStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface AgentAction {
  id: string;
  userId: string;
  category: ActionCategory;
  actionType: string;        // e.g. "create_event", "delete_emails"
  description: string;       // human-readable: "Created event: Standup at 9 AM"
  status: ActionStatus;
  reversible: boolean;
  metadata: Record<string, unknown>;
  timestamp: string;
}
