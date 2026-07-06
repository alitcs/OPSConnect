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
  CoffeeChat,
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

// --- Engagement seed: availability, active/idle, admin, coffee-chat log ---
// Anchored to a fixed "now" so seeded metrics stay stable in the prototype.

export const NOW_ISO = '2026-07-06T13:30:00.000Z';

const IDLE_IDS = new Set<number>([10, 20]);
const ADMIN_IDS = new Set<number>([1, 5, 25]);
const AVAILABILITY_SEED: Array<[number, string | null]> = [
  [1, null],
  [12, 'Happy to walk through anything data or Tableau'],
  [18, null],
  [4, 'Around this afternoon — ask me about web dev'],
  [5, 'Open between meetings'],
  [3, null],
  [11, 'Glad to help with cloud or security questions'],
  [22, null],
  [13, 'New co-op — keen to meet the team!'],
  [17, null],
  [24, 'Up for a quick chat or walkthrough'],
  [9, null],
  [26, 'Ask me anything about accessibility'],
];

for (const u of users) {
  u.availableForCoffee = false;
  u.availabilityNote = null;
  u.availabilitySetAt = null;
  u.isActiveUser = !IDLE_IDS.has(u.id);
  u.isAdmin = ADMIN_IDS.has(u.id);
  u.messagePrivacy = u.messagePrivacy ?? 'everyone';
}
for (const [id, note] of AVAILABILITY_SEED) {
  const u = users.find((x) => x.id === id);
  if (u) {
    u.availableForCoffee = true;
    u.availabilityNote = note;
    u.availabilitySetAt = NOW_ISO;
  }
}

const coffeeChats: CoffeeChat[] = (
  [
    [1, 7, '2026-07-02'],
    [1, 11, '2026-07-01'],
    [1, 21, '2026-07-05'],
    [1, 3, '2026-06-24'],
    [1, 26, '2026-06-18'],
    [1, 12, '2026-06-10'],
    [1, 17, '2026-05-20'],
    [1, 5, '2026-05-08'],
    [5, 18, '2026-07-03'],
    [7, 18, '2026-07-04'],
    [12, 3, '2026-06-28'],
    [18, 26, '2026-07-02'],
    [4, 8, '2026-07-01'],
    [9, 15, '2026-06-30'],
    [2, 4, '2026-07-05'],
    [3, 11, '2026-07-02'],
    [6, 22, '2026-07-01'],
    [11, 14, '2026-06-29'],
    [22, 3, '2026-07-04'],
    [17, 19, '2026-07-03'],
    [24, 17, '2026-06-27'],
    [16, 23, '2026-06-20'],
    [21, 29, '2026-07-01'],
    [29, 28, '2026-06-25'],
    [26, 30, '2026-07-02'],
  ] as Array<[number, number, string]>
).map(([userId, withUserId, day], i) => ({
  id: `cc-seed-${i}`,
  userId,
  withUserId,
  at: `${day}T15:00:00.000Z`,
}));

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
    'messagePrivacy',
  ];
  for (const key of editable) {
    if (key in patch) {
      // @ts-expect-error indexed assignment across a union of value types
      user[key] = patch[key];
    }
  }
  return user;
}

// --- Bulletin board availability & coffee chats --------------------------

export function setAvailability(
  id: number,
  available: boolean,
  note?: string | null,
): User | undefined {
  const user = getUserById(id);
  if (!user) return undefined;
  user.availableForCoffee = available;
  user.availabilityNote = available ? (note?.trim() ? note.trim().slice(0, 120) : null) : null;
  user.availabilitySetAt = available ? new Date().toISOString() : null;
  user.isActiveUser = true;
  return user;
}

export function getCoffeeChats(): CoffeeChat[] {
  return coffeeChats;
}

export function addCoffeeChat(userId: number, withUserId: number): CoffeeChat {
  const chat: CoffeeChat = {
    id: `cc-${randomUUID()}`,
    userId,
    withUserId,
    at: new Date().toISOString(),
  };
  coffeeChats.push(chat);
  return chat;
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

/**
 * Whether `fromUserId` may start a NEW conversation with `toUserId`, honoring the
 * recipient's message-privacy preference. Existing conversations always continue.
 */
export function canMessage(
  fromUserId: number,
  toUserId: number,
): { ok: boolean; reason?: string } {
  const recipient = getUserById(toUserId);
  const sender = getUserById(fromUserId);
  if (!recipient || !sender) return { ok: false, reason: 'Recipient not found' };
  const existing = threads.find((t) => t.id === threadKey(fromUserId, toUserId));
  if (existing) return { ok: true };
  const privacy = recipient.messagePrivacy ?? 'everyone';
  if (privacy === 'none') {
    return { ok: false, reason: `${recipient.name.split(' ')[0]} isn’t accepting new messages right now.` };
  }
  if (privacy === 'ministry' && sender.ministry !== recipient.ministry) {
    return {
      ok: false,
      reason: `${recipient.name.split(' ')[0]} only accepts messages from people in their ministry.`,
    };
  }
  return { ok: true };
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
