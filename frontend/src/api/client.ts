// Typed API client for ConnectOPS.
//
// This build runs fully client-side: instead of HTTP calls, the client delegates to an
// in-browser mock backend (see ./mockBackend). The async signatures are preserved so
// components keep using promises exactly as before. To switch back to a real server,
// reintroduce a fetch-based `request()` and point these methods at it.

import type {
  ActivityMetrics,
  AdminInsights,
  ChatMessage,
  ConnectPerson,
  ConnectionGraph,
  Conversation,
  DailyNudge,
  DirectMessage,
  DirectoryFilterOptions,
  FloorMapData,
  MessageThreadSummary,
  ProximitySummary,
  SurfacedPerson,
  User,
  UserSummary,
} from '../types';
import { ApiError, backend } from './mockBackend';
import { getSessionUserId } from './auth';

export function getStoredUserId(): number {
  return getSessionUserId() ?? 1;
}

export { ApiError };

// Run a mock-backend call asynchronously so callers keep their promise-based flow,
// and a small latency makes loading states feel real.
function run<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (err) {
        reject(err);
      }
    }, 120);
  });
}

const me = () => getStoredUserId();

export const api = {
  // --- Users / profiles ---
  getCurrentUser: () => run<User>(() => backend.getCurrentUser(me())),
  getUser: (id: number) => run<User>(() => backend.getUser(me(), id)),
  updateUser: (id: number, patch: Partial<User>) =>
    run<User>(() => backend.updateUser(me(), id, patch)),
  getManager: (id: number) => run<UserSummary | null>(() => backend.getManager(id)),
  getReports: (id: number) => run<UserSummary[]>(() => backend.getReports(id)),
  getTeammates: (id: number) => run<UserSummary[]>(() => backend.getTeammates(id)),
  getUserLocation: (id: number) =>
    run<{ floor: number | null; seat: string | null; building: string }>(() =>
      backend.getUserLocation(id),
    ),

  // --- Directory ---
  getDirectory: (params: Record<string, string> = {}) =>
    run<UserSummary[]>(() => backend.getDirectory(params)),
  getDirectoryFilters: () => run<DirectoryFilterOptions>(() => backend.getDirectoryFilters()),

  // --- Connect / bulletin board ---
  getAvailability: () =>
    run<{ availableForCoffee: boolean; availabilityNote: string | null; availabilitySetAt: string | null }>(
      () => backend.getAvailability(me()),
    ),
  setAvailability: (available: boolean, note?: string | null) =>
    run<{ availableForCoffee: boolean; availabilityNote: string | null; availabilitySetAt: string | null }>(
      () => backend.setAvailability(me(), available, note),
    ),
  getConnectFeed: () => run<ConnectPerson[]>(() => backend.getConnectFeed(me())),
  getProximity: () => run<ProximitySummary>(() => backend.getProximity(me())),
  getDailyNudge: () => run<DailyNudge>(() => backend.getDailyNudge(me())),

  // --- Private activity metric ---
  getActivityMetrics: () => run<ActivityMetrics>(() => backend.getActivityMetrics(me())),
  logCoffeeChat: (withUserId: number) =>
    run<ActivityMetrics>(() => backend.logCoffeeChat(me(), withUserId)),

  // --- Admin insights ---
  getAdminInsights: () => run<AdminInsights>(() => backend.getAdminInsights(me())),
  getConnectionGraph: () => run<ConnectionGraph>(() => backend.getConnectionGraph(me())),

  // --- Chat ---
  sendChat: (message: string, conversationId?: string) =>
    run<{ conversationId: string; message: ChatMessage }>(() =>
      backend.sendChat(me(), message, conversationId),
    ),
  listConversations: () => run<Conversation[]>(() => backend.listConversations(me())),
  getConversation: (id: string) =>
    run<{ conversation: Conversation; messages: ChatMessage[] }>(() =>
      backend.getConversation(me(), id),
    ),
  createConversation: (title?: string) =>
    run<Conversation>(() => backend.createConversation(me(), title)),
  deleteConversation: (id: string) => run<void>(() => backend.deleteConversation(me(), id)),

  // --- Messaging ---
  listThreads: () => run<MessageThreadSummary[]>(() => backend.listThreads(me())),
  getThread: (threadId: string) =>
    run<{
      thread: MessageThreadSummary;
      participant: UserSummary | null;
      messages: DirectMessage[];
    }>(() => backend.getThread(me(), threadId)),
  sendMessage: (userId: number, text: string) =>
    run<{ message: DirectMessage }>(() => backend.sendMessage(me(), userId, text)),

  // --- Floor map ---
  getFloorMap: (floorId: string, seat: string, building: string) =>
    run<FloorMapData>(() => backend.getFloorMap(floorId, seat, building)),
};

export type { SurfacedPerson };
