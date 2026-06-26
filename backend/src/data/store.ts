// In-memory data store for the ConnectOPS prototype.
//
// This is the single seam between the app and its "database". For the POC it loads
// seed JSON and keeps conversations/messages in memory. To go to production, replace
// the bodies of these functions with real database queries — the controllers and
// services only depend on this interface, not on how the data is stored.

import { randomUUID } from 'node:crypto';
import seedUsers from './users.json' with { type: 'json' };
import seedConversations from './conversations.json' with { type: 'json' };
import type {
  Conversation,
  ChatMessage,
  DirectMessage,
  MessageThread,
  User,
} from '../types.js';

// Clone seed data so mutations during runtime don't rewrite the JSON modules.
const users: User[] = JSON.parse(JSON.stringify(seedUsers)) as User[];
const conversations: Conversation[] = JSON.parse(
  JSON.stringify(seedConversations),
) as Conversation[];

const chatMessages: ChatMessage[] = [
  {
    id: 'msg-seed-1',
    conversationId: 'conv-seed-1',
    role: 'user',
    text: 'Who works in cybersecurity?',
    createdAt: '2026-06-22T14:02:00.000Z',
  },
  {
    id: 'msg-seed-2',
    conversationId: 'conv-seed-1',
    role: 'assistant',
    text: 'Here are a few people working in cybersecurity across the OPS:',
    people: [
      {
        user: toSummary(users.find((u) => u.id === 11)!),
        rationale:
          'Cloud Security Specialist on the Infrastructure & Cloud Operations team — holds CISSP and Azure Security certifications.',
      },
    ],
    createdAt: '2026-06-22T14:03:00.000Z',
  },
];

const directMessages: DirectMessage[] = [];
const threads: MessageThread[] = [];

function toSummary(u: User) {
  return {
    id: u.id,
    name: u.name,
    title: u.title,
    team: u.team,
    ministry: u.ministry,
    location: u.location,
    status: u.status,
  };
}

// --- Users ---------------------------------------------------------------

export function getAllUsers(): User[] {
  return users;
}

export function getUserById(id: number): User | undefined {
  return users.find((u) => u.id === id);
}

export function updateUser(id: number, patch: Partial<User>): User | undefined {
  const user = getUserById(id);
  if (!user) return undefined;
  // Only allow updating fields a user owns (Tier B + Tier 2 toggles). Tier 1 is
  // system-owned and not editable in this mock.
  const editable: (keyof User)[] = [
    'skills',
    'certifications',
    'interests',
    'aspirations',
    'mentoringAreas',
    'coopInfo',
    'floorPublic',
    'seatPublic',
  ];
  for (const key of editable) {
    if (key in patch) {
      // @ts-expect-error indexed assignment across a union of value types
      user[key] = patch[key];
    }
  }
  return user;
}

// --- Conversations & chat messages ---------------------------------------

export function getConversationsForUser(userId: number): Conversation[] {
  return conversations
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getConversationById(id: string): Conversation | undefined {
  return conversations.find((c) => c.id === id);
}

export function createConversation(userId: number, title: string): Conversation {
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: `conv-${randomUUID()}`,
    userId,
    title,
    createdAt: now,
    updatedAt: now,
  };
  conversations.push(conversation);
  return conversation;
}

export function deleteConversation(id: string): boolean {
  const index = conversations.findIndex((c) => c.id === id);
  if (index === -1) return false;
  conversations.splice(index, 1);
  for (let i = chatMessages.length - 1; i >= 0; i--) {
    if (chatMessages[i].conversationId === id) chatMessages.splice(i, 1);
  }
  return true;
}

export function getMessagesForConversation(conversationId: string): ChatMessage[] {
  return chatMessages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage {
  const stored: ChatMessage = {
    ...message,
    id: `msg-${randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  chatMessages.push(stored);
  const conversation = getConversationById(message.conversationId);
  if (conversation) conversation.updatedAt = stored.createdAt;
  return stored;
}

// --- Direct messages -----------------------------------------------------

function threadKey(a: number, b: number): string {
  const [low, high] = a < b ? [a, b] : [b, a];
  return `thread-${low}-${high}`;
}

export function getThreadsForUser(userId: number): MessageThread[] {
  return threads
    .filter((t) => t.participantIds.includes(userId))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function getThreadById(id: string): MessageThread | undefined {
  return threads.find((t) => t.id === id);
}

export function getMessagesForThread(threadId: string): DirectMessage[] {
  return directMessages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function sendDirectMessage(
  fromUserId: number,
  toUserId: number,
  text: string,
): { thread: MessageThread; message: DirectMessage } {
  const id = threadKey(fromUserId, toUserId);
  let thread = threads.find((t) => t.id === id);
  const now = new Date().toISOString();
  if (!thread) {
    thread = { id, participantIds: [fromUserId, toUserId], lastMessageAt: now };
    threads.push(thread);
  }
  const message: DirectMessage = {
    id: `dm-${randomUUID()}`,
    threadId: id,
    fromUserId,
    toUserId,
    text,
    createdAt: now,
  };
  directMessages.push(message);
  thread.lastMessageAt = now;
  return { thread, message };
}
