// Typed API client for the ConnectOPS backend.
//
// All requests go through `request()`, which attaches the mock-auth `x-user-id` header
// based on the currently selected user (persisted in localStorage by the auth context).

import type {
  ChatMessage,
  Conversation,
  DirectMessage,
  DirectoryFilterOptions,
  FloorMapData,
  MessageThreadSummary,
  SurfacedPerson,
  User,
  UserSummary,
} from '../types';

const BASE = '/api';
const USER_ID_KEY = 'connectops.currentUserId';

export function getStoredUserId(): number {
  const raw = localStorage.getItem(USER_ID_KEY);
  return raw ? Number(raw) : 1;
}

export function setStoredUserId(id: number): void {
  localStorage.setItem(USER_ID_KEY, String(id));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': String(getStoredUserId()),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.error || detail;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// --- Users / profiles ---
export const api = {
  getCurrentUser: () => request<User>('/users/me'),
  getUser: (id: number) => request<User>(`/users/${id}`),
  updateUser: (id: number, patch: Partial<User>) =>
    request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  getManager: (id: number) => request<UserSummary | null>(`/users/${id}/manager`),
  getReports: (id: number) => request<UserSummary[]>(`/users/${id}/reports`),
  getTeammates: (id: number) => request<UserSummary[]>(`/users/${id}/teammates`),
  getUserLocation: (id: number) =>
    request<{ floor: number | null; seat: string | null; building: string }>(
      `/users/${id}/location`,
    ),

  // --- Directory ---
  getDirectory: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<UserSummary[]>(`/directory${query ? `?${query}` : ''}`);
  },
  getDirectoryFilters: () => request<DirectoryFilterOptions>('/directory/filters'),

  // --- Chat ---
  sendChat: (message: string, conversationId?: string) =>
    request<{ conversationId: string; message: ChatMessage }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    }),
  listConversations: () => request<Conversation[]>('/chat/conversations'),
  getConversation: (id: string) =>
    request<{ conversation: Conversation; messages: ChatMessage[] }>(
      `/chat/conversations/${id}`,
    ),
  createConversation: (title?: string) =>
    request<Conversation>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  deleteConversation: (id: string) =>
    request<void>(`/chat/conversations/${id}`, { method: 'DELETE' }),

  // --- Messaging ---
  listThreads: () => request<MessageThreadSummary[]>('/messages'),
  getThread: (threadId: string) =>
    request<{
      thread: MessageThreadSummary;
      participant: UserSummary | null;
      messages: DirectMessage[];
    }>(`/messages/${threadId}`),
  sendMessage: (userId: number, text: string) =>
    request<{ message: DirectMessage }>(`/messages/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // --- Floor map ---
  getFloorMap: (floorId: string, seat: string, building: string) => {
    const query = new URLSearchParams({ seat, building }).toString();
    return request<FloorMapData>(`/floors/${floorId}/map?${query}`);
  },
};

export type { SurfacedPerson };
