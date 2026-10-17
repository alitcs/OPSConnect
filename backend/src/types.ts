import type { AdminInsightsDto, ChatMessage } from '../../shared/contracts.js';

export type {
  ActivityMetrics,
  ActivityStatus,
  ChatMessage,
  ConnectPerson,
  ConnectIntentId,
  ConnectionRecord,
  Conversation,
  CoopInfo,
  DailyNudge,
  DirectMessage,
  FloorMapData,
  ProjectMilestone,
  ProjectPriority,
  ProjectStatus,
  ProjectTicket,
  ProximitySummary,
  SurfacedPerson,
  SurfacedProject,
  TeamInsight,
  User,
  UserSummary,
} from '../../shared/contracts.js';

export type AdminInsights = AdminInsightsDto;

export interface ChatResponse {
  conversationId: string;
  message: ChatMessage;
}

export interface MessageThread {
  id: string;
  participantIds: [number, number];
  lastMessageAt: string;
}

export interface CoffeeChat {
  id: string;
  userId: number;
  withUserId: number;
  at: string;
}