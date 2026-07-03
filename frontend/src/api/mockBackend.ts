// In-browser mock backend for ConnectOPS.
//
// This is a faithful port of the Node/Express backend (store + services + mock AI +
// controllers) so the app runs entirely client-side — no server required. It lets the
// static Netlify deploy work end-to-end. Data lives in memory and resets on reload.
//
// The original backend remains the source of truth for a future real deployment; this
// module mirrors its behavior and response shapes exactly.

import seedUsers from '../data/users.json';
import seedConversations from '../data/conversations.json';
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

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface MessageThread {
  id: string;
  participantIds: [number, number];
  lastMessageAt: string;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// --- In-memory state (cloned from seed so mutations don't touch the imports) ---

const users: User[] = JSON.parse(JSON.stringify(seedUsers)) as User[];
const conversations: Conversation[] = JSON.parse(
  JSON.stringify(seedConversations),
) as Conversation[];

function toSummary(u: User): UserSummary {
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

// --- User services -------------------------------------------------------

function getUserById(id: number): User | undefined {
  return users.find((u) => u.id === id);
}

function requireUser(id: number): User {
  const user = getUserById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

function toPublicProfile(u: User): User {
  return {
    ...u,
    floor: u.floorPublic ? u.floor : null,
    seat: u.seatPublic ? u.seat : null,
  };
}

interface DirectoryFilters {
  department?: string;
  team?: string;
  location?: string;
  jobTitle?: string;
  ministry?: string;
  search?: string;
}

function filterUsers(filters: DirectoryFilters): User[] {
  let result = users;
  if (filters.department) {
    const dept = filters.department.toLowerCase();
    result = result.filter(
      (u) => u.branch.toLowerCase() === dept || u.division.toLowerCase() === dept,
    );
  }
  if (filters.team) {
    const team = filters.team.toLowerCase();
    result = result.filter((u) => u.team.toLowerCase() === team);
  }
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    result = result.filter((u) => u.location.toLowerCase() === loc);
  }
  if (filters.jobTitle) {
    const title = filters.jobTitle.toLowerCase();
    result = result.filter((u) => u.title.toLowerCase() === title);
  }
  if (filters.ministry) {
    const ministry = filters.ministry.toLowerCase();
    result = result.filter((u) => u.ministry.toLowerCase() === ministry);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        u.team.toLowerCase().includes(q),
    );
  }
  return result;
}

function getFilterOptions(): DirectoryFilterOptions {
  const unique = (values: string[]) =>
    Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  return {
    departments: unique(users.flatMap((u) => [u.branch, u.division])),
    teams: unique(users.map((u) => u.team)),
    locations: unique(users.map((u) => u.location)),
    jobTitles: unique(users.map((u) => u.title)),
    ministries: unique(users.map((u) => u.ministry)),
  };
}

// --- Mock AI -------------------------------------------------------------

interface AIReply {
  text: string;
  people: SurfacedPerson[];
}

const norm = (s: string) => s.toLowerCase();

function hasSkill(user: User, keyword: string): boolean {
  const k = norm(keyword);
  return (
    user.skills.some((s) => norm(s).includes(k)) ||
    norm(user.title).includes(k) ||
    norm(user.team).includes(k) ||
    user.interests.some((i) => norm(i).includes(k))
  );
}

function surface(user: User, rationale: string): SurfacedPerson {
  return { user: toSummary(user), rationale };
}

function rationaleForSkill(user: User, keyword: string): string {
  const k = norm(keyword);
  const matchedSkills = user.skills.filter((s) => norm(s).includes(k));
  const tenure = user.coopInfo ? 'co-op student' : user.title;
  if (matchedSkills.length > 0) {
    return `${user.title} on the ${user.team} team — has ${matchedSkills.join(
      ', ',
    )} listed in their skills.`;
  }
  if (norm(user.team).includes(k)) {
    return `${user.title} on the ${user.team} team — works directly in this area.`;
  }
  return `${tenure} — surfaced based on their role and expertise in this area.`;
}

interface Intent {
  name: string;
  match: (query: string, list: User[]) => AIReply | null;
}

const SKILL_KEYWORDS = [
  'python',
  'data analytics',
  'data analysis',
  'data visualization',
  'tableau',
  'machine learning',
  'devops',
  'cybersecurity',
  'security',
  'accessibility',
  'react',
  'frontend',
  'cloud',
  'azure',
  'kubernetes',
  'gis',
  'sql',
  'policy',
  'environmental',
];

const intents: Intent[] = [
  {
    name: 'person-lookup',
    match: (query, list) => {
      const match = list.find((u) => {
        const first = norm(u.name.split(' ')[0]);
        return query.includes(first) && query.split(' ').length <= 8;
      });
      if (!match) return null;
      if (!/(tell me about|who is|background|about)\b/.test(query)) return null;
      const skills = match.skills.length
        ? ` Their listed skills include ${match.skills.slice(0, 4).join(', ')}.`
        : '';
      return {
        text: `${match.name} is a ${match.title} on the ${match.team} team (${match.branch}, ${match.ministry}), based at ${match.location}.${skills}`,
        people: [surface(match, `${match.title} — ${match.branch}, ${match.ministry}.`)],
      };
    },
  },
  {
    name: 'accessibility-navigation',
    match: (query, list) => {
      if (!/accessib/.test(query)) return null;
      const people = list
        .filter((u) => hasSkill(u, 'accessibility'))
        .slice(0, 3)
        .map((u) => surface(u, rationaleForSkill(u, 'accessibility')));
      if (!people.length) return null;
      return {
        text: 'For accessibility standards, these are the people leading that work across the OPS:',
        people,
      };
    },
  },
  {
    name: 'cybersecurity-field',
    match: (query, list) => {
      if (!/(cyber|security)/.test(query)) return null;
      const people = list
        .filter((u) => hasSkill(u, 'cybersecurity') || hasSkill(u, 'security'))
        .slice(0, 3)
        .map((u) =>
          surface(
            u,
            `${u.title} on the ${u.team} team — works on ${u.skills
              .slice(0, 2)
              .join(' and ')}.`,
          ),
        );
      if (!people.length) return null;
      return {
        text: 'Several people work in cybersecurity across the OPS. A typical day involves threat modeling, securing cloud environments, and reviewing access controls. Here are a few you could reach out to:',
        people,
      };
    },
  },
  {
    name: 'shadow-mentor',
    match: (query, list) => {
      if (!/(shadow|learn from|mentor)/.test(query)) return null;
      const keyword = SKILL_KEYWORDS.find((k) => query.includes(k)) ?? 'devops';
      const people = list
        .filter((u) => hasSkill(u, keyword) && u.mentoringAreas.length > 0)
        .slice(0, 3)
        .map((u) =>
          surface(
            u,
            `${u.title} — open to mentoring on ${u.mentoringAreas.join(
              ', ',
            )}. A great person to shadow for ${keyword} experience.`,
          ),
        );
      if (!people.length) return null;
      return {
        text: `Here are people who list ${keyword} expertise and are open to mentoring — good candidates to shadow or learn from:`,
        people,
      };
    },
  },
  {
    name: 'staffing-dashboard',
    match: (query, list) => {
      if (!/(dashboard|deliver|staff|build a team|achieve|project)/.test(query)) return null;
      const keywords = SKILL_KEYWORDS.filter((k) => query.includes(k));
      const search = keywords.length ? keywords : ['data analytics', 'data visualization'];
      const seen = new Set<number>();
      const people: SurfacedPerson[] = [];
      for (const k of search) {
        for (const u of list.filter((x) => hasSkill(x, k))) {
          if (seen.has(u.id)) continue;
          seen.add(u.id);
          people.push(surface(u, rationaleForSkill(u, k)));
          if (people.length >= 4) break;
        }
        if (people.length >= 4) break;
      }
      if (!people.length) return null;
      return {
        text: `Based on the skills you'd need (${search.join(
          ', ',
        )}), here's the internal capability that could help deliver this:`,
        people,
      };
    },
  },
  {
    name: 'team-discovery',
    match: (query, list) => {
      if (!/what teams|which teams|teams work/.test(query)) return null;
      const keyword = SKILL_KEYWORDS.find((k) => query.includes(k)) ?? 'data';
      const teamList = Array.from(
        new Set(
          list.filter((u) => hasSkill(u, keyword)).map((u) => `${u.team} (${u.ministry})`),
        ),
      ).slice(0, 5);
      if (!teamList.length) return null;
      return {
        text: `Teams working on ${keyword} across the OPS:\n\n${teamList
          .map((t) => `• ${t}`)
          .join('\n')}`,
        people: [],
      };
    },
  },
  {
    name: 'count-coops',
    match: (query, list) => {
      if (!/how many|count|number of/.test(query)) return null;
      if (/co-?op/.test(query)) {
        const coops = list.filter((u) => u.coopInfo !== null);
        let scoped = coops;
        const team = SKILL_KEYWORDS.find((k) => query.includes(k));
        if (/infrastructure/.test(query)) {
          scoped = coops.filter(
            (u) =>
              norm(u.team).includes('infrastructure') || norm(u.team).includes('end user'),
          );
        } else if (team) {
          scoped = coops.filter((u) => hasSkill(u, team));
        }
        return {
          text: `There ${scoped.length === 1 ? 'is' : 'are'} ${scoped.length} co-op student${
            scoped.length === 1 ? '' : 's'
          } matching that this term${
            scoped.length ? `: ${scoped.map((u) => u.name).join(', ')}.` : '.'
          }`,
          people: [],
        };
      }
      return {
        text: `There are ${list.length} employees in the directory for this prototype.`,
        people: [],
      };
    },
  },
  {
    name: 'skill-discovery',
    match: (query, list) => {
      const keywords = SKILL_KEYWORDS.filter((k) => query.includes(k));
      if (!keywords.length) return null;
      const seen = new Set<number>();
      const people: SurfacedPerson[] = [];
      const scored = list
        .map((u) => ({ u, score: keywords.filter((k) => hasSkill(u, k)).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      for (const { u } of scored) {
        if (seen.has(u.id)) continue;
        seen.add(u.id);
        const matched = keywords.filter((k) => hasSkill(u, k));
        people.push(
          surface(u, `${u.title} on the ${u.team} team — matches ${matched.join(' and ')}.`),
        );
        if (people.length >= 4) break;
      }
      if (!people.length) return null;
      return {
        text: `Here are people with experience in ${keywords.join(' and ')}:`,
        people,
      };
    },
  },
];

const OFF_TOPIC = ['poem', 'joke', 'recipe', 'weather', 'sports score', 'movie', 'song', 'story about'];
const ADJACENT = ['lunch', 'coffee', 'parking', 'commute', 'restaurant'];

function generateReply(rawQuery: string): AIReply {
  const query = norm(rawQuery).trim();
  if (OFF_TOPIC.some((t) => query.includes(t)) && !ADJACENT.some((a) => query.includes(a))) {
    return {
      text: "I'm designed to help with organizational questions — try asking me about people, teams, or skills at OPS!",
      people: [],
    };
  }
  if (ADJACENT.some((a) => query.includes(a))) {
    return {
      text: 'There are a few good spots near 777 Bay Street — the food court at College Park and the cafés along Bay Street are popular with the team. Happy to help with people and skills questions too!',
      people: [],
    };
  }
  for (const intent of intents) {
    const reply = intent.match(query, users);
    if (reply) return reply;
  }
  return {
    text: "I can help you find people, teams, and skills across the OPS. Try asking something like \u201cWho has Python and data visualization experience?\u201d or \u201cWho works in cybersecurity?\u201d",
    people: [],
  };
}

// --- Floor map -----------------------------------------------------------

const MAP_WIDTH = 800;
const MAP_HEIGHT = 500;

function seatToCoordinates(seat: string): { x: number; y: number } {
  const match = seat.match(/-([A-Z])(\d+)/);
  const margin = 80;
  if (!match) return { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
  const rowLetter = match[1].charCodeAt(0) - 'A'.charCodeAt(0);
  const seatNumber = Number(match[2]);
  const cols = 8;
  const col = seatNumber % cols;
  const row = rowLetter;
  const usableW = MAP_WIDTH - margin * 2;
  const usableH = MAP_HEIGHT - margin * 2;
  const x = margin + (col / (cols - 1)) * usableW;
  const y = margin + (row / 5) * usableH;
  return { x: Math.round(x), y: Math.round(y) };
}

// --- Conversation / message helpers --------------------------------------

function threadKey(a: number, b: number): string {
  const [low, high] = a < b ? [a, b] : [b, a];
  return `thread-${low}-${high}`;
}

const EDITABLE_FIELDS: (keyof User)[] = [
  'skills',
  'certifications',
  'interests',
  'aspirations',
  'mentoringAreas',
  'coopInfo',
  'floorPublic',
  'seatPublic',
];

// --- Public handlers (mirror the REST controllers) -----------------------

export const backend = {
  getCurrentUser(userId: number): User {
    return requireUser(userId);
  },

  getUser(userId: number, id: number): User {
    const user = requireUser(id);
    return userId === id ? user : toPublicProfile(user);
  },

  updateUser(userId: number, id: number, patch: Partial<User>): User {
    if (userId !== id) throw new ApiError(403, 'You can only edit your own profile.');
    const user = requireUser(id);
    for (const key of EDITABLE_FIELDS) {
      if (key in patch) {
        // @ts-expect-error indexed assignment across a union of value types
        user[key] = patch[key];
      }
    }
    return user;
  },

  getManager(id: number): UserSummary | null {
    const user = requireUser(id);
    const manager = user.managerId ? getUserById(user.managerId) : undefined;
    return manager ? toSummary(manager) : null;
  },

  getReports(id: number): UserSummary[] {
    const user = requireUser(id);
    return user.directReports
      .map((rid) => getUserById(rid))
      .filter((u): u is User => Boolean(u))
      .map(toSummary);
  },

  getTeammates(id: number): UserSummary[] {
    const user = requireUser(id);
    return user.teammates
      .map((tid) => getUserById(tid))
      .filter((u): u is User => Boolean(u))
      .map(toSummary);
  },

  getUserLocation(id: number): { floor: number | null; seat: string | null; building: string } {
    const user = requireUser(id);
    if (!user.floorPublic && !user.seatPublic) {
      throw new ApiError(403, 'This user has not shared their location.');
    }
    return {
      floor: user.floorPublic ? user.floor : null,
      seat: user.seatPublic ? user.seat : null,
      building: user.location,
    };
  },

  getDirectory(filters: DirectoryFilters): UserSummary[] {
    return filterUsers(filters).map(toSummary);
  },

  getDirectoryFilters(): DirectoryFilterOptions {
    return getFilterOptions();
  },

  // --- Chat ---
  listConversations(userId: number): Conversation[] {
    return conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  getConversation(userId: number, id: string): { conversation: Conversation; messages: ChatMessage[] } {
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation || conversation.userId !== userId) {
      throw new ApiError(404, 'Conversation not found');
    }
    const messages = chatMessages
      .filter((m) => m.conversationId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { conversation, messages };
  },

  createConversation(userId: number, title?: string): Conversation {
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: `conv-${uuid()}`,
      userId,
      title: title || 'New chat',
      createdAt: now,
      updatedAt: now,
    };
    conversations.push(conversation);
    return conversation;
  },

  deleteConversation(userId: number, id: string): void {
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation || conversation.userId !== userId) {
      throw new ApiError(404, 'Conversation not found');
    }
    const index = conversations.findIndex((c) => c.id === id);
    conversations.splice(index, 1);
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      if (chatMessages[i].conversationId === id) chatMessages.splice(i, 1);
    }
  },

  sendChat(
    userId: number,
    message: string,
    conversationId?: string,
  ): { conversationId: string; message: ChatMessage } {
    const text = message?.trim();
    if (!text) throw new ApiError(400, 'message is required');

    let convId = conversationId;
    if (convId) {
      const existing = conversations.find((c) => c.id === convId);
      if (!existing || existing.userId !== userId) {
        throw new ApiError(404, 'Conversation not found');
      }
    } else {
      const title = text.length > 40 ? `${text.slice(0, 40)}…` : text;
      convId = this.createConversation(userId, title).id;
    }

    const now = () => new Date().toISOString();
    const touch = (id: string) => {
      const c = conversations.find((x) => x.id === id);
      if (c) c.updatedAt = new Date().toISOString();
    };

    const userMessage: ChatMessage = {
      id: `msg-${uuid()}`,
      conversationId: convId,
      role: 'user',
      text,
      createdAt: now(),
    };
    chatMessages.push(userMessage);
    touch(convId);

    const reply = generateReply(text);
    const assistantMessage: ChatMessage = {
      id: `msg-${uuid()}`,
      conversationId: convId,
      role: 'assistant',
      text: reply.text,
      people: reply.people,
      createdAt: now(),
    };
    chatMessages.push(assistantMessage);
    touch(convId);

    return { conversationId: convId, message: assistantMessage };
  },

  // --- Messaging ---
  listThreads(userId: number): MessageThreadSummary[] {
    return threads
      .filter((t) => t.participantIds.includes(userId))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .map((thread) => {
        const otherId = thread.participantIds.find((id) => id !== userId)!;
        const other = getUserById(otherId);
        const msgs = directMessages
          .filter((m) => m.threadId === thread.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const last = msgs[msgs.length - 1];
        return {
          ...thread,
          participant: other ? toSummary(other) : null,
          lastMessage: last ? last.text : null,
        };
      });
  },

  getThread(
    userId: number,
    threadId: string,
  ): { thread: MessageThreadSummary; participant: UserSummary | null; messages: DirectMessage[] } {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread || !thread.participantIds.includes(userId)) {
      throw new ApiError(404, 'Thread not found');
    }
    const otherId = thread.participantIds.find((id) => id !== userId)!;
    const other = getUserById(otherId);
    const participant = other ? toSummary(other) : null;
    const messages = directMessages
      .filter((m) => m.threadId === thread.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = messages[messages.length - 1];
    return {
      thread: { ...thread, participant, lastMessage: last ? last.text : null },
      participant,
      messages,
    };
  },

  sendMessage(userId: number, toUserId: number, text: string): { message: DirectMessage } {
    const body = text?.trim();
    if (!body) throw new ApiError(400, 'text is required');
    if (!getUserById(toUserId)) throw new ApiError(404, 'Recipient not found');
    if (toUserId === userId) throw new ApiError(400, 'You cannot message yourself.');

    const id = threadKey(userId, toUserId);
    let thread = threads.find((t) => t.id === id);
    const now = new Date().toISOString();
    if (!thread) {
      thread = { id, participantIds: [userId, toUserId], lastMessageAt: now };
      threads.push(thread);
    }
    const message: DirectMessage = {
      id: `dm-${uuid()}`,
      threadId: id,
      fromUserId: userId,
      toUserId,
      text: body,
      createdAt: now,
    };
    directMessages.push(message);
    thread.lastMessageAt = now;
    return { message };
  },

  // --- Floor map ---
  getFloorMap(floorId: string, seat: string, building: string): FloorMapData {
    const floorNumber = Number(floorId.split('-').pop());
    return {
      floorId,
      building: building || 'OPS Office',
      floor: Number.isFinite(floorNumber) ? floorNumber : 0,
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      highlightedSeat: seat ? { seat, ...seatToCoordinates(seat) } : null,
    };
  },

  // --- Accounts / auth support ---

  /** Case-insensitive lookup of a user by email. */
  findUserByEmail(email: string): User | undefined {
    const target = email.trim().toLowerCase();
    return users.find((u) => u.email.toLowerCase() === target);
  },

  /** Create a brand-new employee profile and add it to the in-memory directory. */
  createUser(profile: Omit<User, 'id'>): User {
    const nextId = users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const user: User = { ...profile, id: nextId };
    users.push(user);
    return user;
  },

  /**
   * Re-insert a previously created user (e.g. rehydrated from persisted accounts)
   * so their id resolves after an in-memory reset. Existing ids are left untouched.
   */
  registerUser(user: User): User {
    const existing = getUserById(user.id);
    if (existing) return existing;
    users.push(user);
    return user;
  },
};
