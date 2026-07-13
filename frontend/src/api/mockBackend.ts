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
import { projects } from '../data/projects';
import { EDGE_MODES } from '../types';
import type {
  ActivityMetrics,
  AdminInsights,
  BridgeInsight,
  ChatMessage,
  ConnectPerson,
  ConnectionGraph,
  Conversation,
  DailyNudge,
  DirectMessage,
  DirectoryFilterOptions,
  EdgeMode,
  FloorMapData,
  MessageThreadSummary,
  ProximitySummary,
  SurfacedPerson,
  SurfacedProject,
  ProjectTicket,
  TeamInsight,
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

// --- Synthetic roster expansion (demo scale) -----------------------------
//
// Grows the hand-authored roster up to a larger population so the org network view looks
// like a real organization. Fully deterministic (seeded PRNG) so ids and profiles stay
// stable across reloads. These profiles are lightweight but complete enough to open.

const TARGET_POPULATION = 250;

const SYNTH_FIRST = [
  'Aaron', 'Bianca', 'Caleb', 'Diana', 'Elias', 'Farah', 'Gabriel', 'Hana', 'Ibrahim',
  'Julia', 'Kwame', 'Lena', 'Mateo', 'Nadia', 'Omar', 'Paula', 'Quentin', 'Rosa',
  'Sanjay', 'Tara', 'Umar', 'Vera', 'Wesley', 'Ximena', 'Yara', 'Zane', 'Adrian',
  'Beatrice', 'Cyrus', 'Delia', 'Ethan', 'Fiona', 'Gregory', 'Helena', 'Ivan', 'Jasmine',
  'Karl', 'Leah', 'Malik', 'Noor', 'Oscar', 'Petra', 'Rahim', 'Sofia', 'Theo', 'Uma',
  'Victor', 'Willa', 'Yusuf', 'Zoe',
];
const SYNTH_LAST = [
  'Adams', 'Bakshi', 'Chen', 'Dubois', 'Eze', 'Fernandez', 'Gagnon', 'Hughes', 'Ibrahim',
  'Jansen', 'Kaur', 'Lopez', 'Mensah', 'Novak', 'Owusu', 'Park', 'Quinn', 'Rossi',
  'Singh', 'Tremblay', 'Uddin', 'Vasquez', 'Wong', 'Xu', 'Yamamoto', 'Zhang', 'Bello',
  'Costa', 'Dixit', 'Farrell', 'Grant', 'Haddad', 'Iqbal', 'Johansson', 'Kelly', 'Lund',
  'Moreau', 'Nair', 'Okafor', 'Petrov', 'Reyes', 'Silva', 'Thompson', 'Volkov', 'Walsh',
];

const SYNTH_TEAMS: Array<{
  team: string;
  branch: string;
  division: string;
  ministry: string;
  cluster: string;
  titles: string[];
}> = [
  { team: 'Data Platform Engineering', branch: 'Analytics Branch', division: 'Health Data Division', ministry: 'Ministry of Health', cluster: 'Health Services I&IT Cluster', titles: ['Data Engineer', 'Analytics Developer', 'BI Analyst', 'Data Scientist'] },
  { team: 'Clinical Systems', branch: 'Health Systems Branch', division: 'Health Data Division', ministry: 'Ministry of Health', cluster: 'Health Services I&IT Cluster', titles: ['Systems Analyst', 'Integration Specialist', 'Solution Designer'] },
  { team: 'Network Operations', branch: 'Infrastructure Branch', division: 'Technology Operations Division', ministry: 'Ministry of Transportation', cluster: 'Transportation I&IT Cluster', titles: ['Network Engineer', 'Systems Administrator', 'Site Reliability Engineer'] },
  { team: 'Traffic Systems', branch: 'Mobility Branch', division: 'Technology Operations Division', ministry: 'Ministry of Transportation', cluster: 'Transportation I&IT Cluster', titles: ['Software Developer', 'IoT Engineer', 'QA Engineer'] },
  { team: 'Design & Research', branch: 'Digital Services Branch', division: 'Digital Service Division', ministry: 'Treasury Board Secretariat', cluster: 'Central Agencies I&IT Cluster', titles: ['UX Designer', 'Service Designer', 'User Researcher', 'Content Designer'] },
  { team: 'Platform Services', branch: 'Digital Services Branch', division: 'Digital Service Division', ministry: 'Treasury Board Secretariat', cluster: 'Central Agencies I&IT Cluster', titles: ['Full Stack Developer', 'Platform Engineer', 'DevOps Engineer'] },
  { team: 'Fiscal Strategy', branch: 'Fiscal Policy Branch', division: 'Office of the Budget', ministry: 'Ministry of Finance', cluster: 'Central Agencies I&IT Cluster', titles: ['Policy Analyst', 'Economist', 'Research Analyst'] },
  { team: 'Revenue Systems', branch: 'Revenue Branch', division: 'Taxation Division', ministry: 'Ministry of Finance', cluster: 'Central Agencies I&IT Cluster', titles: ['Business Analyst', 'Database Administrator', 'Application Developer'] },
  { team: 'Justice Applications', branch: 'Justice Solutions Branch', division: 'Justice Technology Division', ministry: 'Ministry of the Attorney General', cluster: 'Justice Technology Services', titles: ['Application Developer', 'Business Analyst', 'Project Manager'] },
  { team: 'Court Modernization', branch: 'Court Services Branch', division: 'Justice Technology Division', ministry: 'Ministry of the Attorney General', cluster: 'Justice Technology Services', titles: ['Product Manager', 'Change Manager', 'Delivery Lead'] },
  { team: 'Learning Platforms', branch: 'Education Technology Branch', division: 'Community Services Division', ministry: 'Ministry of Education', cluster: 'Community Services I&IT Cluster', titles: ['Frontend Developer', 'QA Engineer', 'Accessibility Analyst'] },
  { team: 'Student Data Services', branch: 'Education Technology Branch', division: 'Community Services Division', ministry: 'Ministry of Education', cluster: 'Community Services I&IT Cluster', titles: ['Data Analyst', 'Reporting Analyst', 'Systems Analyst'] },
  { team: 'Cloud Enablement', branch: 'Platform Engineering Branch', division: 'Health Data Division', ministry: 'Ministry of Health', cluster: 'Health Services I&IT Cluster', titles: ['Cloud Engineer', 'Security Engineer', 'Automation Engineer'] },
  { team: 'Cybersecurity Operations', branch: 'Security Branch', division: 'Technology Operations Division', ministry: 'Ministry of Transportation', cluster: 'Transportation I&IT Cluster', titles: ['Security Analyst', 'Threat Analyst', 'Incident Responder'] },
  { team: 'Enterprise Architecture', branch: 'Architecture Branch', division: 'Digital Service Division', ministry: 'Treasury Board Secretariat', cluster: 'Central Agencies I&IT Cluster', titles: ['Solutions Architect', 'Enterprise Architect', 'Technical Lead'] },
  { team: 'Program Delivery', branch: 'Delivery Branch', division: 'Office of the Budget', ministry: 'Ministry of Finance', cluster: 'Central Agencies I&IT Cluster', titles: ['Delivery Manager', 'Scrum Master', 'Project Coordinator'] },
];

const SYNTH_LOCATIONS = [
  '777 Bay Street, Toronto',
  '5700 Yonge Street, Toronto',
  '1201 Wilson Avenue, Toronto',
  '95 Grosvenor Street, Toronto',
  '720 Bay Street, Toronto',
  '315 Front Street West, Toronto',
];
const SYNTH_STATUSES: User['status'][] = [
  'Online', 'Online', 'Online', 'Away', 'Away', 'Offline', 'Do Not Disturb',
];
const SYNTH_SKILLS = [
  'Python', 'SQL', 'TypeScript', 'React', 'Azure', 'AWS', 'Kubernetes', 'Figma',
  'Tableau', 'Power BI', 'Java', 'Go', 'Terraform', 'Agile', 'User Research',
  'Accessibility', 'Security', 'Data Modelling',
];
const SYNTH_INTERESTS = [
  'Data visualization', 'Cloud native', 'Design systems', 'Cycling', 'Photography',
  'Hiking', 'Machine learning', 'Accessibility', 'Mentoring', 'Running', 'Chess', 'Cooking',
];
const SYNTH_SCHOOLS = ['University of Toronto', 'University of Waterloo', 'York University', 'Toronto Metropolitan University', 'Queen\u2019s University'];
const SYNTH_PROGRAMS = ['Computer Science', 'Software Engineering', 'Data Science', 'Information Systems'];

(function expandRoster() {
  const rand = mulberry32(0x5eed1234);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const used = new Set(users.map((u) => u.name));
  let id = users.reduce((max, u) => Math.max(max, u.id), 0) + 1;

  while (users.length < TARGET_POPULATION) {
    const t = pick(SYNTH_TEAMS);
    let name = `${pick(SYNTH_FIRST)} ${pick(SYNTH_LAST)}`;
    let guard = 0;
    while (used.has(name) && guard++ < 25) {
      name = `${pick(SYNTH_FIRST)} ${pick(SYNTH_LAST)}`;
    }
    used.add(name);
    const emailBase = name.toLowerCase().replace(/[^a-z]+/g, '.');

    users.push({
      id,
      name,
      title: pick(t.titles),
      team: t.team,
      branch: t.branch,
      division: t.division,
      ministry: t.ministry,
      cluster: t.cluster,
      location: pick(SYNTH_LOCATIONS),
      workHours: '9:00 AM \u2013 5:00 PM',
      status: pick(SYNTH_STATUSES),
      email: `${emailBase}.${id}@ontario.ca`,
      phone: `416-555-${String(1000 + id).slice(-4)}`,
      managerId: null,
      directReports: [],
      teammates: [],
      floor: 3 + Math.floor(rand() * 15),
      seat: null,
      floorPublic: rand() < 0.6,
      seatPublic: false,
      skills: [pick(SYNTH_SKILLS), pick(SYNTH_SKILLS)],
      certifications: [],
      interests: [pick(SYNTH_INTERESTS), pick(SYNTH_INTERESTS)],
      aspirations: [],
      mentoringAreas: [],
      coopInfo:
        rand() < 0.07
          ? { school: pick(SYNTH_SCHOOLS), program: pick(SYNTH_PROGRAMS), term: 'Summer 2026' }
          : null,
      isActiveUser: true,
      isAdmin: false,
      availableForCoffee: false,
      availabilityNote: null,
      availabilitySetAt: null,
      messagePrivacy: 'everyone',
    } as User);
    id++;
  }
})();

// --- Engagement seed: availability, active/idle, admin, coffee-chat log ---
//
// Anchored to a fixed "now" so the seeded activity metric and admin insights stay stable
// and internally consistent in the demo. Live user actions still use the real clock.

const NOW = new Date('2026-07-06T13:30:00.000Z');
const NOW_ISO = NOW.toISOString();

// Employees who appear in the directory but haven't actively signed up to ConnectOPS.
const IDLE_IDS = new Set<number>([10, 20]);
// Program-coordinator access to the org-level insights page.
const ADMIN_IDS = new Set<number>([1, 5, 25]);
// Who has set themselves "open for coffee" today, with an optional note.
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

interface CoffeeChat {
  id: string;
  userId: number; // who logged it
  withUserId: number;
  at: string;
}

const coffeeChats: CoffeeChat[] = (
  [
    // Current user (Priya, id 1) — this month + history for the private metric.
    [1, 7, '2026-07-02'],
    [1, 11, '2026-07-01'],
    [1, 21, '2026-07-05'],
    [1, 3, '2026-06-24'],
    [1, 26, '2026-06-18'],
    [1, 12, '2026-06-10'],
    [1, 17, '2026-05-20'],
    [1, 5, '2026-05-08'],
    // Broader org activity so admin insights are meaningful.
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

// --- Bulletin board / Connect helpers ------------------------------------

function normText(s: string): string {
  return s.trim().toLowerCase();
}

function sharedInterestsBetween(a: User, b: User): string[] {
  const setB = new Set(b.interests.map(normText));
  return a.interests.filter((i) => setB.has(normText(i)));
}

/** A proximity label if the target shares their floor and is co-located with the viewer today. */
function proximityLabel(target: User, viewer: User): string | null {
  // Reciprocal: you only see who's near you if you also share your own location.
  if (!viewer.floorPublic || viewer.floor == null) return null;
  if (!target.floorPublic || target.floor == null) return null;
  if (viewer.location !== target.location || viewer.floor !== target.floor) return null;
  return `Floor ${target.floor} · ${target.location}`;
}

function toConnectPerson(target: User, viewer: User): ConnectPerson {
  const proximity = proximityLabel(target, viewer);
  return {
    user: toSummary(target),
    availabilityNote: target.availabilityNote,
    sharedInterests: sharedInterestsBetween(viewer, target).slice(0, 3),
    proximity,
    isNearby: proximity != null,
  };
}

/** Everyone who is an active user and open for coffee today (excluding the viewer). */
function connectFeed(viewerId: number): ConnectPerson[] {
  const viewer = requireUser(viewerId);
  return users
    .filter((u) => u.id !== viewerId && u.isActiveUser && u.availableForCoffee)
    .map((u) => toConnectPerson(u, viewer))
    .sort((a, b) => {
      if (a.isNearby !== b.isNearby) return a.isNearby ? -1 : 1;
      if (b.sharedInterests.length !== a.sharedInterests.length) {
        return b.sharedInterests.length - a.sharedInterests.length;
      }
      return a.user.name.localeCompare(b.user.name);
    });
}

function proximitySummary(viewerId: number): ProximitySummary {
  const viewer = requireUser(viewerId);
  const nearby = connectFeed(viewerId).filter((p) => p.isNearby);
  return {
    count: nearby.length,
    floor: viewer.floor,
    building: viewer.location,
    people: nearby,
    shareEnabled: viewer.floorPublic && viewer.floor != null,
  };
}

// Small seeded RNG so the "randomized" daily nudge is stable within a session/day but still
// feels arbitrary (may surface one, both, or neither of the nearby people).
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dailyNudge(viewerId: number): DailyNudge {
  const viewer = requireUser(viewerId);
  const nearby = proximitySummary(viewerId).people;
  const day = NOW_ISO.slice(0, 10);
  const rng = mulberry32(hashSeed(`${viewerId}:${day}`));
  const roll = rng();
  let count = roll < 0.25 ? 0 : roll < 0.7 ? 1 : 2;
  count = Math.min(count, nearby.length);
  const pool = [...nearby];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const people = pool.slice(0, count);
  const floorTxt = viewer.floor != null ? ` on Floor ${viewer.floor}` : '';
  const message =
    count === 0
      ? 'No nudge for you today — but the Connect board always shows who’s around to help.'
      : `${count} ${count === 1 ? 'person' : 'people'} near you${floorTxt} ${
          count === 1 ? 'is' : 'are'
        } open to help today.`;
  return { message, people };
}

function activityMetrics(viewerId: number): ActivityMetrics {
  const viewer = requireUser(viewerId);
  const mine = coffeeChats.filter((c) => c.userId === viewerId || c.withUserId === viewerId);
  const otherOf = (c: CoffeeChat) => (c.userId === viewerId ? c.withUserId : c.userId);
  const monthKey = (iso: string) => iso.slice(0, 7);
  const thisMonth = NOW_ISO.slice(0, 7);

  const distinct = new Set(mine.map(otherOf));
  let crossTeamCount = 0;
  for (const c of mine) {
    const other = getUserById(otherOf(c));
    if (other && other.team !== viewer.team) crossTeamCount++;
  }

  const monthCounts = new Map<string, number>();
  for (const c of mine) {
    const k = monthKey(c.at);
    monthCounts.set(k, (monthCounts.get(k) ?? 0) + 1);
  }
  const history = Array.from(monthCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));

  const recent = [...mine]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5)
    .map((c) => {
      const other = getUserById(otherOf(c))!;
      return { withUser: toSummary(other), at: c.at, crossTeam: other.team !== viewer.team };
    });

  const total = mine.length;
  return {
    coffeeChatsThisMonth: mine.filter((c) => monthKey(c.at) === thisMonth).length,
    coffeeChatsTotal: total,
    distinctPeople: distinct.size,
    crossTeamCount,
    crossTeamPct: total ? Math.round((crossTeamCount / total) * 100) : 0,
    history,
    recent,
  };
}

function adminInsights(viewerId: number): AdminInsights {
  const viewer = requireUser(viewerId);
  if (!viewer.isAdmin) {
    throw new ApiError(403, 'Insights are available to program coordinators only.');
  }

  const totalEmployees = users.length;
  const activeUsers = users.filter((u) => u.isActiveUser).length;
  const availableToday = users.filter((u) => u.availableForCoffee).length;
  const activationRate = totalEmployees ? Math.round((activeUsers / totalEmployees) * 100) : 0;
  const ministryCount = new Set(users.map((u) => u.ministry)).size;

  // Reuse the exact same network that powers the 3D graph, so the numbers match on screen.
  const { edges, degree, adjacency } = buildOrgNetwork();
  const totalConnections = edges.length;
  const degreeSum = [...degree.values()].reduce((s, d) => s + d, 0);
  const avgConnections = activeUsers ? Math.round((degreeSum / activeUsers) * 10) / 10 : 0;

  // Silos — how much of the network crosses team and ministry boundaries.
  let crossTeam = 0;
  let crossMinistry = 0;
  for (const e of edges) {
    const a = getUserById(e.a);
    const b = getUserById(e.b);
    if (!a || !b) continue;
    if (a.team !== b.team) crossTeam++;
    if (a.ministry !== b.ministry) crossMinistry++;
  }
  const crossTeamPct = totalConnections ? Math.round((crossTeam / totalConnections) * 100) : 0;
  const crossMinistryPct = totalConnections
    ? Math.round((crossMinistry / totalConnections) * 100)
    : 0;

  // Team leaderboard — connections per active member (network-based).
  interface TeamAgg {
    team: string;
    ministry: string;
    members: number;
    activeUsers: number;
    connections: number;
  }
  const teamMap = new Map<string, TeamAgg>();
  const teamKey = (u: User) => `${u.team}|${u.ministry}`;
  for (const u of users) {
    const k = teamKey(u);
    const agg =
      teamMap.get(k) ??
      { team: u.team, ministry: u.ministry, members: 0, activeUsers: 0, connections: 0 };
    agg.members++;
    if (u.isActiveUser) agg.activeUsers++;
    teamMap.set(k, agg);
  }
  for (const e of edges) {
    const a = getUserById(e.a);
    const b = getUserById(e.b);
    if (a) {
      const agg = teamMap.get(teamKey(a));
      if (agg) agg.connections++;
    }
    if (b) {
      const agg = teamMap.get(teamKey(b));
      if (agg) agg.connections++;
    }
  }
  const teams: TeamInsight[] = Array.from(teamMap.values())
    .filter((t) => t.activeUsers >= 2)
    .map((t) => ({
      team: t.team,
      ministry: t.ministry,
      members: t.members,
      activeUsers: t.activeUsers,
      connections: t.connections,
      connectionsPerActive: t.activeUsers
        ? Math.round((t.connections / t.activeUsers) * 10) / 10
        : 0,
    }))
    .sort((a, b) => b.connectionsPerActive - a.connectionsPerActive);

  // Bridges — people whose connections span the most distinct ministries (ONA connectors).
  const bridges: BridgeInsight[] = users
    .map((u) => {
      const reached = new Set<string>();
      const nbrs = adjacency.get(u.id);
      if (nbrs) {
        for (const nId of nbrs) {
          const n = getUserById(nId);
          if (n) reached.add(n.ministry);
        }
      }
      return {
        id: u.id,
        name: u.name,
        title: u.title,
        ministry: u.ministry,
        ministriesReached: reached.size,
        connections: degree.get(u.id) ?? 0,
      };
    })
    .sort(
      (a, b) => b.ministriesReached - a.ministriesReached || b.connections - a.connections,
    )
    .slice(0, 4);

  // Knowledge & expertise — supply-side coverage from listed skills.
  const skillCount = new Map<string, number>();
  for (const u of users) {
    const seen = new Set<string>();
    for (const raw of u.skills) {
      const skill = raw.trim();
      const norm = skill.toLowerCase();
      if (!skill || seen.has(norm)) continue;
      seen.add(norm);
      skillCount.set(skill, (skillCount.get(skill) ?? 0) + 1);
    }
  }
  const skillEntries = Array.from(skillCount.entries()).map(([skill, count]) => ({
    skill,
    count,
  }));
  const distinctSkills = skillEntries.length;
  const topSkills = [...skillEntries].sort((a, b) => b.count - a.count).slice(0, 6);
  const scarceSkills = skillEntries
    .filter((s) => s.count <= 2)
    .sort((a, b) => a.count - b.count || a.skill.localeCompare(b.skill))
    .slice(0, 8);

  // Onboarding — how new people (co-ops) engage vs. the wider org.
  const coops = users.filter((u) => u.coopInfo);
  const coopConnTotal = coops.reduce((s, u) => s + (degree.get(u.id) ?? 0), 0);
  const coopConnectionRate = coops.length
    ? Math.round((coopConnTotal / coops.length) * 10) / 10
    : 0;
  const nonCoops = users.filter((u) => !u.coopInfo && u.isActiveUser);
  const nonCoopConnTotal = nonCoops.reduce((s, u) => s + (degree.get(u.id) ?? 0), 0);
  const orgConnectionRate = nonCoops.length
    ? Math.round((nonCoopConnTotal / nonCoops.length) * 10) / 10
    : 0;
  const mentorsAvailable = users.filter((u) => u.mentoringAreas.length > 0).length;

  // Adoption trend — deterministic six-month ramp ending at today's active count.
  const trendRand = mulberry32(0x0a11ce);
  const monthLabels = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const startValue = Math.round(activeUsers * 0.42);
  const stepValue = (activeUsers - startValue) / (monthLabels.length - 1);
  const adoptionTrend = monthLabels.map((month, i) => {
    if (i === monthLabels.length - 1) return { month, value: activeUsers };
    const jitter = Math.round((trendRand() - 0.5) * stepValue * 0.5);
    return { month, value: Math.max(0, Math.round(startValue + stepValue * i + jitter)) };
  });

  // ROI — a defensible estimate: each connection stands in for a successful "find the right
  // person" that saved ~15 minutes of hunting through email/Teams/SharePoint.
  const estHoursSaved = Math.round((totalConnections * 15) / 60);
  // Loaded hourly cost of an OPS staff member (~$110k salary + overhead ÷ ~1,900 hrs).
  const estCostSaved = estHoursSaved * 55;
  const adoptionDelta = adoptionTrend.length
    ? adoptionTrend[adoptionTrend.length - 1].value - adoptionTrend[0].value
    : 0;

  // Network health — reframe "connections" into an actionable "who is actually connecting"
  // signal, and flag the active members who are still isolated (0 links).
  const activeList = users.filter((u) => u.isActiveUser);
  const isolatedActive = activeList.filter((u) => (degree.get(u.id) ?? 0) === 0).length;
  const connectedRate = activeUsers
    ? Math.round(((activeUsers - isolatedActive) / activeUsers) * 100)
    : 0;
  const sortedDegrees = activeList.map((u) => degree.get(u.id) ?? 0).sort((a, b) => a - b);
  const medianConnections = sortedDegrees.length
    ? sortedDegrees.length % 2
      ? sortedDegrees[(sortedDegrees.length - 1) / 2]
      : Math.round(
          (sortedDegrees[sortedDegrees.length / 2 - 1] + sortedDegrees[sortedDegrees.length / 2]) / 2,
        )
    : 0;
  const thisMonth = NOW_ISO.slice(0, 7);
  const coffeeThisMonth = coffeeChats.filter((c) => c.at.slice(0, 7) === thisMonth).length;

  // Knowledge continuity — how many skills rest on a single person (a bus-factor risk).
  const singlePointSkills = skillEntries.filter((s) => s.count === 1).length;

  // Onboarding — how well co-ops have plugged into the network, and mentor supply vs demand.
  const coopsConnected = coops.filter((u) => (degree.get(u.id) ?? 0) > 0).length;
  const coopConnectedPct = coops.length ? Math.round((coopsConnected / coops.length) * 100) : 0;
  const menteesPerMentor = mentorsAvailable
    ? Math.round((coops.length / mentorsAvailable) * 10) / 10
    : coops.length;

  return {
    totalEmployees,
    activeUsers,
    activationRate,
    availableToday,
    ministryCount,
    adoptionTrend,
    totalConnections,
    avgConnections,
    crossTeamPct,
    crossMinistryPct,
    isolatedActive,
    connectedRate,
    medianConnections,
    coffeeThisMonth,
    teams,
    bridges,
    distinctSkills,
    singlePointSkills,
    topSkills,
    scarceSkills,
    coopCount: coops.length,
    coopConnectionRate,
    orgConnectionRate,
    coopsConnected,
    coopConnectedPct,
    mentorsAvailable,
    menteesPerMentor,
    estHoursSaved,
    estCostSaved,
    adoptionDelta,
  };
}

// --- Connection graph (org-wide network) ---------------------------------
//
// Nodes are people; an edge means the two people have messaged. The demo seeds a
// deterministic, clustered communication network (dense within teams, with cross-team
// bridges) layered on top of real coffee-chat activity, so the 3D network view is rich
// and stable across reloads without depending on live message history.

// A single person in the org-wide connection graph is built below; the seeded network is
// deterministic thanks to the shared mulberry32 PRNG defined earlier.

interface OrgEdge {
  a: number;
  b: number;
  weight: number;
  kind: EdgeKind;
}
interface OrgNetwork {
  edges: OrgEdge[];
  degree: Map<number, number>;
  adjacency: Map<number, Set<number>>;
}

// The relationship type an edge represents — used to colour-code edges in the Combined lens.
type EdgeKind =
  | 'coffee'
  | 'team'
  | 'division'
  | 'ministry'
  | 'cluster'
  | 'project'
  | 'skills'
  | 'interests'
  | 'reporting'
  | 'location'
  | 'mentorship'
  | 'cohort'
  | 'bridge';

interface TypedEdge {
  a: number;
  b: number;
  weight: number;
  kind: EdgeKind;
}

// Group people by a single key (e.g. team, ministry). People with a null key are skipped.
function groupBy(keyFn: (u: User) => string | null | undefined): Map<string, number[]> {
  const g = new Map<string, number[]>();
  for (const u of users) {
    const k = keyFn(u);
    if (!k) continue;
    const arr = g.get(k) ?? [];
    arr.push(u.id);
    g.set(k, arr);
  }
  return g;
}

// Group people by each of several keys (e.g. every skill or interest they list).
function multiGroupBy(valuesFn: (u: User) => string[]): Map<string, number[]> {
  const g = new Map<string, number[]>();
  for (const u of users) {
    for (const raw of valuesFn(u)) {
      const k = raw.trim().toLowerCase();
      if (!k) continue;
      const arr = g.get(k) ?? [];
      arr.push(u.id);
      g.set(k, arr);
    }
  }
  return g;
}

// Connect each member of a group to the next `span` members. This yields a connected,
// readable cluster with bounded degree instead of an O(n²) clique that would swamp the graph.
function chainGroups(groups: Map<string, number[]>, kind: EdgeKind, span: number): TypedEdge[] {
  const edges: TypedEdge[] = [];
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    const sorted = [...members].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = 1; j <= span && i + j < sorted.length; j++) {
        edges.push({ a: sorted[i], b: sorted[i + j], weight: 1, kind });
      }
    }
  }
  return edges;
}

// The original clustered network (coffee + intra-team + cross-team bridges + hub connectors),
// now typed so its edges can be colour-coded. This is the Combined lens and the canonical
// network behind the aggregate insights, so those numbers stay stable.
function combinedEdges(): TypedEdge[] {
  const rand = mulberry32(0x0ec0ffee);
  const edges: TypedEdge[] = [];

  // 1) Real coffee-chat activity counts as a strong connection.
  for (const chat of coffeeChats) edges.push({ a: chat.userId, b: chat.withUserId, weight: 2, kind: 'coffee' });

  // 2) A sparse, readable slice of intra-team connectivity.
  const teamGroups = new Map<string, number[]>();
  for (const u of users) {
    const list = teamGroups.get(u.team) ?? [];
    list.push(u.id);
    teamGroups.set(u.team, list);
  }
  for (const members of teamGroups.values()) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        if (rand() < 0.18) edges.push({ a: members[i], b: members[j], weight: 1, kind: 'team' });
      }
    }
  }

  // 3) Cross-team bridges — each person keeps a couple of contacts outside their team.
  const allIds = users.map((u) => u.id);
  for (const u of users) {
    const bridges = 1 + Math.floor(rand() * 2);
    for (let b = 0; b < bridges; b++) {
      const other = allIds[Math.floor(rand() * allIds.length)];
      const otherUser = getUserById(other);
      if (otherUser && otherUser.team !== u.team) edges.push({ a: u.id, b: other, weight: 1, kind: 'bridge' });
    }
  }

  // 4) A few hub connectors so leads read as central.
  const connectors = [1, 5, 25, 33, 35, 37, 40, 51, 60];
  for (const hub of connectors) {
    const reach = 3 + Math.floor(rand() * 3);
    for (let r = 0; r < reach; r++) {
      edges.push({ a: hub, b: allIds[Math.floor(rand() * allIds.length)], weight: 1, kind: 'bridge' });
    }
  }
  return edges;
}

// Raw (pre-dedupe) edges for a given relationship lens.
function edgesForMode(mode: EdgeMode): TypedEdge[] {
  switch (mode) {
    case 'team':
      return chainGroups(groupBy((u) => u.team), 'team', 4);
    case 'division':
      return chainGroups(groupBy((u) => u.division), 'division', 3);
    case 'ministry':
      return chainGroups(groupBy((u) => u.ministry), 'ministry', 3);
    case 'cluster':
      return chainGroups(groupBy((u) => u.cluster), 'cluster', 3);
    case 'location':
      return chainGroups(
        groupBy((u) => (u.floor != null ? `${u.location}#${u.floor}` : null)),
        'location',
        4,
      );
    case 'cohort':
      return chainGroups(
        groupBy((u) => (u.coopInfo ? `${u.coopInfo.school}#${u.coopInfo.term}` : null)),
        'cohort',
        5,
      );
    case 'skills':
      return chainGroups(multiGroupBy((u) => u.skills), 'skills', 2);
    case 'interests':
      return chainGroups(multiGroupBy((u) => u.interests), 'interests', 2);
    case 'coffee':
      return coffeeChats
        .filter((c) => c.userId !== c.withUserId)
        .map((c) => ({ a: c.userId, b: c.withUserId, weight: 2, kind: 'coffee' as const }));
    case 'reporting': {
      const edges: TypedEdge[] = [];
      for (const u of users) {
        if (u.managerId != null && getUserById(u.managerId)) {
          edges.push({ a: u.id, b: u.managerId, weight: 2, kind: 'reporting' });
        }
      }
      return edges;
    }
    case 'project': {
      const edges: TypedEdge[] = [];
      for (const p of projects) {
        const team = surfaceProject(p, users).suggestedPeople.map((sp) => sp.user.id);
        for (let i = 0; i < team.length; i++) {
          for (let j = i + 1; j < team.length; j++) {
            edges.push({ a: team[i], b: team[j], weight: 1, kind: 'project' });
          }
        }
      }
      return edges;
    }
    case 'mentorship': {
      const edges: TypedEdge[] = [];
      for (const mentor of users) {
        if (!mentor.mentoringAreas.length) continue;
        let added = 0;
        for (const learner of users) {
          if (added >= 4) break;
          if (learner.id === mentor.id) continue;
          const matches = mentor.mentoringAreas.some((area) => {
            const a = norm(area);
            return (
              learner.skills.some((s) => norm(s).includes(a) || a.includes(norm(s))) ||
              learner.aspirations.some((s) => norm(s).includes(a) || a.includes(norm(s))) ||
              learner.interests.some((s) => norm(s).includes(a))
            );
          });
          if (matches) {
            edges.push({ a: mentor.id, b: learner.id, weight: 1, kind: 'mentorship' });
            added++;
          }
        }
      }
      return edges;
    }
    case 'combined':
    default:
      return combinedEdges();
  }
}

// Networks are deterministic, so memoize per lens — the graph and the assistant may both
// ask for the same lens repeatedly within a session.
const networkCache = new Map<EdgeMode, OrgNetwork>();

// The one source of truth for "who is connected to whom" under a given relationship lens —
// powers the 3D graph, the aggregate insights, and the assistant's relationship reasoning.
function buildNetwork(mode: EdgeMode): OrgNetwork {
  const cached = networkCache.get(mode);
  if (cached) return cached;

  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const merged = new Map<string, OrgEdge>();
  for (const e of edgesForMode(mode)) {
    if (e.a === e.b) continue;
    const a = Math.min(e.a, e.b);
    const b = Math.max(e.a, e.b);
    const k = key(a, b);
    const existing = merged.get(k);
    if (existing) existing.weight += e.weight;
    else merged.set(k, { a, b, weight: e.weight, kind: e.kind });
  }

  const degree = new Map<number, number>();
  const adjacency = new Map<number, Set<number>>();
  const edges: OrgEdge[] = [];
  for (const e of merged.values()) {
    degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
    degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
    if (!adjacency.has(e.a)) adjacency.set(e.a, new Set());
    if (!adjacency.has(e.b)) adjacency.set(e.b, new Set());
    adjacency.get(e.a)!.add(e.b);
    adjacency.get(e.b)!.add(e.a);
    edges.push(e);
  }
  const net: OrgNetwork = { edges, degree, adjacency };
  networkCache.set(mode, net);
  return net;
}

// The canonical network used by the aggregate insights and per-person engagement stats.
function buildOrgNetwork(): OrgNetwork {
  return buildNetwork('combined');
}

function connectionGraph(viewerId: number, mode: EdgeMode = 'combined'): ConnectionGraph {
  const viewer = requireUser(viewerId);
  if (!viewer.isAdmin) {
    throw new ApiError(403, 'The network view is available to program coordinators only.');
  }

  const safeMode: EdgeMode = EDGE_MODES.some((m) => m.id === mode) ? mode : 'combined';
  const { edges, degree } = buildNetwork(safeMode);
  const links = edges.map((e) => ({ source: e.a, target: e.b, weight: e.weight, kind: e.kind }));

  const nodes = users.map((u) => ({
    id: u.id,
    name: u.name,
    title: u.title,
    team: u.team,
    ministry: u.ministry,
    status: u.status,
    degree: degree.get(u.id) ?? 0,
    isCoop: u.coopInfo !== null,
    isActiveUser: u.isActiveUser,
  }));

  const ministries = Array.from(new Set(users.map((u) => u.ministry))).sort();

  const degreeSum = [...degree.values()].reduce((s, d) => s + d, 0);
  const connectedCount = nodes.filter((n) => n.degree > 0).length;
  const avgConnections = connectedCount ? Math.round((degreeSum / connectedCount) * 10) / 10 : 0;

  return {
    nodes,
    links,
    ministries,
    mode: safeMode,
    edgeCount: edges.length,
    avgConnections,
    connectedCount,
  };
}

// --- Mock AI -------------------------------------------------------------

interface AIReply {
  text: string;
  people: SurfacedPerson[];
  projects?: SurfacedProject[];
  followUps?: string[];
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

function surface(user: User, rationale: string, capability?: string, matchStrength?: 'high' | 'medium'): SurfacedPerson {
  const person: SurfacedPerson = { user: toSummary(user), rationale };
  if (capability) person.capability = capability;
  if (matchStrength) person.matchStrength = matchStrength;
  return person;
}

// Deterministic, explainable confidence: strong when there are multiple direct skill hits
// (or a title/team match), otherwise a solid "good" match. No black-box scoring.
function strengthFor(user: User, keywords: string[]): 'high' | 'medium' {
  const hits = keywords.filter((k) => user.skills.some((s) => norm(s).includes(norm(k)))).length;
  const titleOrTeam = keywords.some(
    (k) => norm(user.title).includes(norm(k)) || norm(user.team).includes(norm(k)),
  );
  return hits >= 2 || (hits >= 1 && titleOrTeam) ? 'high' : 'medium';
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
  match: (query: string, list: User[], me: User) => AIReply | null;
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

// Robust skill matching: instead of a fixed keyword list, build a vocabulary from every skill
// that actually appears in the directory and on projects. This means any listed skill is
// searchable — not just a hand-picked set. Common synonyms/abbreviations map onto canonical
// skill names so "ml", "k8s", "a11y", etc. still resolve.
const SKILL_SYNONYMS: Record<string, string> = {
  ml: 'machine learning',
  ai: 'machine learning',
  js: 'javascript',
  k8s: 'kubernetes',
  a11y: 'accessibility',
  dataviz: 'data visualization',
  'data viz': 'data visualization',
  infosec: 'cybersecurity',
  'cyber security': 'cybersecurity',
  'front end': 'frontend',
  'front-end': 'frontend',
  'back end': 'backend',
  'back-end': 'backend',
};

const SKILL_VOCAB: string[] = (() => {
  const set = new Set<string>(SKILL_KEYWORDS);
  for (const u of users) u.skills.forEach((s) => set.add(norm(s)));
  for (const p of projects) p.requiredSkills.forEach((s) => set.add(norm(s)));
  // Longest phrases first so "data visualization" wins over the substring "data".
  return Array.from(set).sort((a, b) => b.length - a.length);
})();

// Canonical skills mentioned in a query, de-duplicated and free of shorter substrings.
function skillsInQuery(query: string): string[] {
  const q = ` ${query} `;
  const found: string[] = [];
  for (const [syn, canon] of Object.entries(SKILL_SYNONYMS)) {
    if (q.includes(syn) && !found.includes(canon)) found.push(canon);
  }
  for (const skill of SKILL_VOCAB) {
    if (!q.includes(skill)) continue;
    if (found.some((f) => f === skill || f.includes(skill))) continue;
    found.push(skill);
  }
  return found;
}

function firstSkillInQuery(query: string): string | undefined {
  return skillsInQuery(query)[0];
}

const uniqueList = (values: string[]): string[] =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));

// People by name — supports disambiguation when several employees share a first name.
// Prefers an exact full-name hit; otherwise falls back to first/last-name token matches.
function findPeopleByName(query: string, list: User[]): User[] {
  const q = norm(query);
  const full = list.filter((u) => q.includes(norm(u.name)));
  if (full.length) return full;
  const words = new Set(q.split(/[^a-z]+/).filter((w) => w.length > 2));
  const byToken = list.filter((u) =>
    norm(u.name)
      .split(/\s+/)
      .some((part) => part.length > 2 && words.has(part)),
  );
  // Canonical hand-authored seed users (lower ids) first for a stable, sensible default.
  return byToken.sort((a, b) => Number(b.isActiveUser) - Number(a.isActiveUser) || a.id - b.id);
}

// Ministry short forms used across the OPS. Only resolve to a ministry that exists in the data.
const MINISTRY_ALIASES: Record<string, string> = {
  tbs: 'treasury board secretariat',
  mgcs: 'ministry of government and consumer services',
  mto: 'ministry of transportation',
  mccss: 'ministry of children, community and social services',
  mmah: 'ministry of municipal affairs and housing',
  mra: 'ministry of red tape reduction',
  cab: 'cabinet office',
};

type OrgKind = 'ministry' | 'division' | 'branch' | 'team';

// Detect an org unit (ministry / division / branch / team) named in a query, grounded in data.
function detectOrgUnit(query: string): { kind: OrgKind; name: string } | null {
  const q = ` ${norm(query)} `;
  const ministries = uniqueList(users.map((u) => u.ministry));
  for (const [alias, full] of Object.entries(MINISTRY_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(q)) {
      const m = ministries.find((x) => norm(x).includes(full) || full.includes(norm(x)));
      if (m) return { kind: 'ministry', name: m };
    }
  }
  const findIn = (kind: OrgKind, values: string[]) => {
    const hit = values.find((x) => x.length > 3 && q.includes(norm(x)));
    return hit ? { kind, name: hit } : null;
  };
  return (
    findIn('ministry', ministries) ??
    findIn('division', uniqueList(users.map((u) => u.division))) ??
    findIn('branch', uniqueList(users.map((u) => u.branch))) ??
    findIn('team', uniqueList(users.map((u) => u.team)))
  );
}

// A fixed "today" anchored to the mock dataset (projects are seeded around mid-2026), so
// "overdue" / "due soon" stay meaningful regardless of the real wall-clock date.
const DEMO_NOW = new Date('2026-07-10T12:00:00');
const DAY_MS = 24 * 60 * 60 * 1000;

// Priority ordering so the active-portfolio view leads with the most urgent work.
const PRIORITY_RANK: Record<string, number> = { Critical: 3, High: 2, Medium: 1, Low: 0 };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Map a project's required skills to internal people — one best-fit person per skill,
// preferring someone open to help today. Records which skills are covered vs. a staffing gap.
function surfaceProject(
  project: ProjectTicket,
  list: User[],
  rationale?: string,
): SurfacedProject {
  const seen = new Set<number>();
  const suggestedPeople: SurfacedPerson[] = [];
  const coveredSkills: string[] = [];
  const gapSkills: string[] = [];
  for (const skill of project.requiredSkills) {
    const candidate = list
      .filter((u) => hasSkill(u, skill) && !seen.has(u.id))
      .sort((a, b) => Number(b.availableForCoffee) - Number(a.availableForCoffee))[0];
    if (!candidate) {
      gapSkills.push(skill);
      continue;
    }
    seen.add(candidate.id);
    coveredSkills.push(skill);
    const matched = candidate.skills.filter((s) => norm(s).includes(norm(skill)));
    const skillTxt = matched.length ? ` (${matched.slice(0, 2).join(', ')})` : '';
    const avail = candidate.availableForCoffee ? ' Open to help today.' : '';
    suggestedPeople.push(
      surface(
        candidate,
        `${candidate.title} on the ${candidate.team} team${skillTxt}.${avail}`,
        skill,
        strengthFor(candidate, [skill]),
      ),
    );
  }
  return { project, rationale, suggestedPeople, coveredSkills, gapSkills };
}

const intents: Intent[] = [
  {
    name: 'capabilities',
    match: (query) => {
      if (
        !/(what can you do|what do you do|how (do|can) you help|what can i ask|your capabilities|what are you able|show me examples|what should i ask|how does this (app|tool|chat|assistant) work|help me get started|^\s*help\s*$)/.test(
          query,
        )
      ) {
        return null;
      }
      return {
        text: "I'm your OPS connections assistant. I can help you:\n\n• Find people by skill — “Who knows Tableau?”\n• Staff a project — “I'm launching an analytics dashboard, who can help?”\n• Look up a project or ticket — “Who could work on HDP-482?”\n• See what's active, due soon, or blocked across the OPS\n• Understand the OPS org structure — ministries, divisions, and teams\n• Find who reports to whom, or who's on a team\n• Find people open to help near you today\n\nTry one of the suggestions below to get started.",
        people: [],
        followUps: [
          'Who can help with a Python and Azure project?',
          'How is the OPS structured?',
          'What projects are due soon?',
          "Who's open to help right now?",
        ],
      };
    },
  },
  {
    name: 'project-intelligence',
    match: (query, list) => {
      const idMatch = query.match(/\b([a-z]{2,5})-(\d{1,5})\b/i);
      const mentionsTickets =
        /\b(ticket|tickets|jira|kanban|sprint|backlog|epic|devops board|azure devops)\b/.test(
          query,
        );
      // Browsing existing, tracked projects — not describing a brand-new project to staff.
      const browsingProjects =
        /\bprojects?\b/.test(query) &&
        /(being worked|worked on|active|current|ongoing|underway|in progress|in-flight|in flight|happening|list|show me|what|which|status|deadline|timeline|due|going on|on the go)/.test(
          query,
        );
      // A new-project staffing ask ("I'm starting a project that needs…") belongs to
      // project-staffing, which surfaces people directly — don't hijack it here.
      const isNewProjectStaffing =
        /(i'?m |i am |we'?re |we are |i want to|i need to|launching|starting a|kick ?off|assemble|build a team|put together)/.test(
          query,
        );
      // Status / deadline lenses over the tracked portfolio.
      const wantsOverdue = /(overdue|past due|behind schedule|missed (the )?deadline|slipping)/.test(query);
      const wantsDueSoon =
        /(due (soon|this|next|in)|closing (soon|out)|upcoming deadline|deadline(s)? (coming|approaching|near)|coming up|wrapping up|due date)/.test(
          query,
        );
      const wantsBlocked = /(blocked|stuck|at risk|stalled|held up)/.test(query);
      const wantsCritical = /(critical|highest priority|high[- ]priority|most urgent|urgent(ly)?|top priority)/.test(query);
      const wantsFilter = wantsOverdue || wantsDueSoon || wantsBlocked || wantsCritical;
      if (!idMatch && !mentionsTickets && !wantsFilter && (!browsingProjects || isNewProjectStaffing)) {
        return null;
      }

      // 1) Specific ticket by ID, e.g. "HDP-482" or "show me FIN-77".
      if (idMatch) {
        const id = idMatch[0].toUpperCase();
        const project = projects.find((p) => p.id.toUpperCase() === id);
        if (project) {
          const surfaced = surfaceProject(project, list, 'Direct match on ticket ID.');
          return {
            text: `Here's ${project.id} — ${project.title}. It's a ${project.priority.toLowerCase()}-priority ${project.type.toLowerCase()} for ${project.team} (${project.ministry}), currently ${project.status.toLowerCase()} and due ${fmtDate(
              project.dueDate,
            )}. Based on the skills it needs, here's who could work on it:`,
            people: [],
            projects: [surfaced],
          };
        }
      }

      // 2) Status / deadline lens — surface the matching slice of the portfolio.
      if (wantsFilter) {
        const open = projects.filter((p) => p.status !== 'Done');
        let filtered = open;
        let lens = '';
        if (wantsOverdue) {
          filtered = open.filter((p) => new Date(p.dueDate) < DEMO_NOW);
          lens = 'past their due date and not yet done';
        } else if (wantsBlocked) {
          filtered = open.filter((p) => p.status === 'Blocked');
          lens = 'currently blocked';
        } else if (wantsDueSoon) {
          filtered = open.filter((p) => {
            const days = (new Date(p.dueDate).getTime() - DEMO_NOW.getTime()) / DAY_MS;
            return days >= 0 && days <= 30;
          });
          lens = 'due within the next 30 days';
        } else {
          filtered = open.filter((p) => p.priority === 'Critical' || p.priority === 'High');
          lens = 'high or critical priority';
        }
        filtered = filtered
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 4);
        if (filtered.length) {
          return {
            text: `Here ${filtered.length === 1 ? 'is 1 project' : `are ${filtered.length} projects`} ${lens}, soonest deadline first:`,
            people: [],
            projects: filtered.map((p) =>
              surfaceProject(p, list, `${p.status} · ${p.priority} priority · due ${fmtDate(p.dueDate)}`),
            ),
            followUps: ['What else is active right now?', "Who's open to help right now?"],
          };
        }
        return {
          text: `Good news — nothing is ${lens} right now.`,
          people: [],
        };
      }

      // 3) Projects that call for a specific skill.
      const skill = firstSkillInQuery(query);
      if (skill && /(need|require|skill|who can|staff|work on)/.test(query)) {
        const matches = projects.filter((p) =>
          p.requiredSkills.some((s) => norm(s).includes(norm(skill))),
        );
        if (matches.length) {
          return {
            text: `Projects across the OPS that call for ${skill}. Each card shows the people whose skills map to the work:`,
            people: [],
            projects: matches.slice(0, 3).map((p) => surfaceProject(p, list, `Requires ${skill}.`)),
          };
        }
      }

      // 3) General "what's being worked on" — the active portfolio, most urgent first.
      const active = projects
        .filter((p) => p.status !== 'Done')
        .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority])
        .slice(0, 3);
      return {
        text: 'Here are projects currently in flight across the OPS, drawn from each team\u2019s ticketing tool. Ask about any ticket by ID to see who could staff it:',
        people: [],
        projects: active.map((p) => surfaceProject(p, list)),
        followUps: ['Which projects need Python?', 'Who can work on HDP-482?'],
      };
    },
  },
  {
    name: 'org-structure',
    match: (query) => {
      if (
        !/(org(ani[sz]ation)?[ -]?(structure|chart|hierarchy)|how is (the )?ops (structured|organi[sz]ed|set up|laid out)|structure of (the )?ops|how does (the )?ops (work|fit together)|ops hierarchy|ministries and divisions|how many ministries|what ministries|ops org|how is ops)/.test(
          query,
        )
      ) {
        return null;
      }
      const ministries = uniqueList(users.map((u) => u.ministry));
      const divisions = uniqueList(users.map((u) => u.division));
      const teams = uniqueList(users.map((u) => u.team));
      const text = `The Ontario Public Service (OPS) is the ~66,000-person workforce that runs the day-to-day machinery of the Ontario government — distinct from the elected side (MPPs, the Premier, and Cabinet).\n\nInside the OPS the hierarchy flows:\n\nMinistries (~21) → Divisions → Branches → Units / Teams\n\nCutting across that vertical structure are I&IT Clusters (shared technology services for groups of ministries), plus Agencies (e.g. TVO, WSIB, Legal Aid Ontario) and the Broader Public Sector (hospitals, school boards) that connect in but sit organizationally apart.\n\nIn this directory I can see ${ministries.length} ministries, ${divisions.length} divisions, and ${teams.length} teams — for example ${ministries
        .slice(0, 4)
        .join(', ')}. Each ministry runs its own branches and processes, so people and knowledge end up siloed — which is exactly the gap I'm here to help you cross.`;
      return {
        text,
        people: [],
        followUps: [
          'Who works in the Ministry of Health?',
          'What teams sit in Treasury Board Secretariat?',
          'Who can help with a data project?',
        ],
      };
    },
  },
  {
    name: 'people-overview',
    match: (query, list) => {
      if (
        !/(overview of (the )?(people|team|workforce|org|directory)|people (overview|context|summary|snapshot)|tell me about (the )?(people|team|workforce|everyone|directory)|who works here|overall people|snapshot of (the )?(people|team|org)|how many people|whole (team|directory))/.test(
          query,
        )
      ) {
        return null;
      }
      const total = list.length;
      const coops = list.filter((u) => u.coopInfo !== null).length;
      const ministryCount = uniqueList(list.map((u) => u.ministry)).length;
      const openToHelp = list.filter((u) => u.availableForCoffee).length;
      const skillCount = new Map<string, number>();
      list.forEach((u) => u.skills.forEach((s) => skillCount.set(s, (skillCount.get(s) ?? 0) + 1)));
      const topSkills = Array.from(skillCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([s]) => s);
      return {
        text: `This directory holds ${total} people across ${ministryCount} ministries. ${coops} are co-op students, and ${openToHelp} are open to help today. The most common skills on file are ${topSkills.join(
          ', ',
        )}. Ask about a specific skill, team, ministry, or project to go deeper.`,
        people: [],
        followUps: [
          'How is the OPS structured?',
          'Who works in the Ministry of Health?',
          "Who's open to help right now?",
        ],
      };
    },
  },
  {
    name: 'org-roster',
    match: (query, list) => {
      const unit = detectOrgUnit(query);
      if (!unit) return null;
      if (
        !/(who|people|roster|staff|works?|working|in the|part of|members|team|division|branch|employees|sits? in|based in)/.test(
          query,
        )
      ) {
        return null;
      }
      const inUnit = list.filter((u) => norm(u[unit.kind]) === norm(unit.name));
      if (!inUnit.length) return null;

      // Structural view: "what teams / divisions / branches are in <ministry>?"
      const asksStructure = /(what|which|list|show|how many).*(teams|divisions|branches)/.test(query);
      if (asksStructure && unit.kind === 'ministry') {
        const level: OrgKind = /division/.test(query)
          ? 'division'
          : /branch/.test(query)
            ? 'branch'
            : 'team';
        const sub = uniqueList(inUnit.map((u) => u[level]));
        return {
          text: `${unit.name} has ${sub.length} ${level}${sub.length === 1 ? '' : 's'} in the directory:\n\n${sub
            .map((s) => `• ${s}`)
            .join('\n')}`,
          people: [],
          followUps: [`Who works in ${unit.name}?`, 'How is the OPS structured?'],
        };
      }

      // People view: surface a few members plus the team breakdown.
      const teamsInUnit = uniqueList(inUnit.map((u) => u.team));
      const people = inUnit
        .slice(0, 5)
        .map((u) => surface(u, `${u.title} — ${u.team}${u.coopInfo ? ' · co-op student' : ''}.`));
      const breakdown =
        unit.kind === 'ministry' && teamsInUnit.length > 1
          ? ` It spans ${teamsInUnit.length} teams, including ${teamsInUnit.slice(0, 3).join(', ')}.`
          : '';
      return {
        text: `There ${inUnit.length === 1 ? 'is 1 person' : `are ${inUnit.length} people`} in ${unit.name} in this directory.${breakdown} A few of them:`,
        people,
        followUps: [`What teams sit in ${unit.name}?`, "Who's open to help right now?"],
      };
    },
  },
  {
    name: 'reporting-lines',
    match: (query, list) => {
      if (
        !/(reports? to|direct reports?|reportees|who manages|manager of|who'?s (the )?manager|who is (the )?manager|report to|works? for|teammates|works with|colleagues|who'?s on .*team|on their team|on his team|on her team)/.test(
          query,
        )
      ) {
        return null;
      }
      const person = findPeopleByName(query, list)[0];
      if (!person) return null;
      const label = (u: User) => `${u.title} — ${u.team}, ${u.ministry}.`;

      // Downward: who reports to this person.
      if (/(who reports? to|direct reports?|reportees|reports? of|who works under)/.test(query)) {
        const reports = person.directReports
          .map((id) => getUserById(id))
          .filter((u): u is User => Boolean(u));
        if (!reports.length) {
          return { text: `${person.name} has no direct reports listed in the directory.`, people: [] };
        }
        return {
          text: `${reports.length} ${reports.length === 1 ? 'person reports' : 'people report'} to ${person.name} (${person.title}):`,
          people: reports.map((u) => surface(u, label(u))),
        };
      }

      // Upward: this person's manager.
      if (/(who does .* report to|report to whom|manager|manages|works? for)/.test(query)) {
        if (person.managerId == null) {
          return { text: `${person.name} doesn't have a manager listed in the directory.`, people: [] };
        }
        const mgr = getUserById(person.managerId);
        if (!mgr) return { text: `${person.name}'s manager isn't in the directory.`, people: [] };
        return {
          text: `${person.name}'s manager is ${mgr.name} — ${mgr.title} on the ${mgr.team} team.`,
          people: [surface(mgr, label(mgr))],
        };
      }

      // Sideways: teammates.
      const mates = person.teammates
        .map((id) => getUserById(id))
        .filter((u): u is User => Boolean(u));
      if (!mates.length) {
        return { text: `${person.name} has no teammates listed in the directory.`, people: [] };
      }
      return {
        text: `${person.name} works alongside ${mates.length} ${mates.length === 1 ? 'teammate' : 'teammates'} on the ${person.team} team:`,
        people: mates.slice(0, 6).map((u) => surface(u, label(u))),
      };
    },
  },
  {
    name: 'proximity-availability',
    match: (query, _list, me) => {
      if (
        !/(open to help|open for coffee|available (for|to)|who'?s around|who is around|around today|near me|nearby|coffee today|my floor|grab a coffee|open to chat|free to chat|who can help me right now)/.test(
          query,
        )
      ) {
        return null;
      }
      const feed = connectFeed(me.id);
      if (!feed.length) {
        return {
          text: 'No one has set themselves as open to help right now. Set your own status on the Connect board to let people know you’re around.',
          people: [],
        };
      }
      const nearby = feed.filter((p) => p.isNearby);
      const chosen = (nearby.length ? nearby : feed).slice(0, 4);
      const people = chosen.map((p) => surface(getUserById(p.user.id)!, connectRationale(p)));
      const floorTxt = me.floor != null ? ` on Floor ${me.floor}` : '';
      const text = nearby.length
        ? `${nearby.length} ${
            nearby.length === 1 ? 'person is' : 'people are'
          } open to help near you${floorTxt} right now:`
        : 'No one is on your floor right now, but here are people across the OPS who are open to help today:';
      return { text, people };
    },
  },
  {
    name: 'draft-intro',
    match: (query, _list, me) => {
      if (!/((draft|write|help me with).*(intro|message|email))|intro message|reach out to/.test(query)) {
        return null;
      }
      const first = me.name.split(' ')[0];
      const text = `Here's a short intro you can adapt and send on Teams or by email:\n\n“Hi — I'm ${first} on the ${me.team} team. I'm pulling together a small group to help on a project and your name came up as someone with the right expertise. Would you have 15 minutes this week for a quick chat? No commitment — I'd just like to share what I'm working on and see if it's a fit. Thanks!”\n\nWant me to tailor the tone or shorten it?`;
      return { text, people: [] };
    },
  },
  {
    name: 'certification-lookup',
    match: (query, list) => {
      if (
        !/(certif|certified|credential|pmp|cissp|\bcka\b|itil|scrum master|aws certified|azure (solutions|security)|tableau desktop|wcag|comptia)/.test(
          query,
        )
      ) {
        return null;
      }
      const certTokens = [
        'pmp',
        'cissp',
        'cka',
        'kubernetes',
        'itil',
        'scrum',
        'aws',
        'azure',
        'tableau',
        'wcag',
        'accessibility',
        'security',
        'comptia',
        'network',
      ];
      const token = certTokens.find((t) => query.includes(t));
      let matched = list.filter((u) => u.certifications.length > 0);
      if (token) {
        matched = matched.filter((u) => u.certifications.some((c) => norm(c).includes(token)));
      }
      if (!matched.length) {
        return {
          text: token
            ? `No one in the directory lists a ${token.toUpperCase()} certification yet.`
            : 'No certifications are listed in the directory yet.',
          people: [],
        };
      }
      const people = matched
        .slice(0, 5)
        .map((u) => surface(u, `${u.title} on the ${u.team} team — holds ${u.certifications.join(', ')}.`));
      return {
        text: token
          ? `People certified in ${token.toUpperCase()} across the OPS:`
          : 'People with professional certifications across the OPS:',
        people,
      };
    },
  },
  {
    name: 'person-lookup',
    match: (query, list) => {
      if (!/(tell me about|who is|background|about|profile of|info on|details on)\b/.test(query)) {
        return null;
      }
      const matches = findPeopleByName(query, list).filter(
        () => query.split(' ').length <= 10,
      );
      if (!matches.length) return null;
      // Same-name disambiguation — let the user pick when several people could match.
      if (matches.length > 1) {
        return {
          text: `I found ${matches.length} people who could match that name — which one did you mean?`,
          people: matches
            .slice(0, 5)
            .map((u) => surface(u, `${u.title} — ${u.team}, ${u.ministry}.`)),
        };
      }
      const match = matches[0];
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
    name: 'shared-interests',
    match: (query, list, me) => {
      if (
        !/(share.*interest|shares my interest|common interest|similar interest|same interest|who likes|people who like|who'?s into|hobbies|interested in the same|things in common)/.test(
          query,
        )
      ) {
        return null;
      }
      const allInterests = uniqueList(users.flatMap((u) => u.interests));
      const named = allInterests.find((i) => i.length > 2 && query.includes(norm(i)));
      if (named) {
        const people = list
          .filter((u) => u.id !== me.id && u.interests.some((i) => norm(i) === norm(named)))
          .slice(0, 5)
          .map((u) => surface(u, `${u.title} on the ${u.team} team — also into ${named}.`));
        if (!people.length) {
          return { text: `No one else lists ${named} as an interest yet.`, people: [] };
        }
        return { text: `People who share your interest in ${named}:`, people };
      }
      const ranked = list
        .filter((u) => u.id !== me.id)
        .map((u) => ({ u, shared: sharedInterestsBetween(me, u) }))
        .filter((x) => x.shared.length > 0)
        .sort((a, b) => b.shared.length - a.shared.length)
        .slice(0, 4);
      if (!ranked.length) {
        return {
          text: "I couldn't find anyone sharing your listed interests. Add a few interests to your profile and I'll find better matches.",
          people: [],
        };
      }
      const people = ranked.map(({ u, shared }) =>
        surface(u, `${u.title} on the ${u.team} team — you both like ${shared.slice(0, 2).join(' and ')}.`),
      );
      return { text: 'People across the OPS who share your interests:', people };
    },
  },
  {
    name: 'accessibility-navigation',
    match: (query, list) => {
      if (!/accessib/.test(query)) return null;
      const people = list
        .filter((u) => hasSkill(u, 'accessibility'))
        .slice(0, 3)
        .map((u) => surface(u, rationaleForSkill(u, 'accessibility'), undefined, strengthFor(u, ['accessibility'])));
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
            undefined,
            strengthFor(u, ['cybersecurity', 'security']),
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
      const keyword = firstSkillInQuery(query) ?? 'devops';
      const people = list
        .filter((u) => hasSkill(u, keyword) && u.mentoringAreas.length > 0)
        .slice(0, 3)
        .map((u) =>
          surface(
            u,
            `${u.title} — open to mentoring on ${u.mentoringAreas.join(
              ', ',
            )}. A great person to shadow for ${keyword} experience.`,
            undefined,
            strengthFor(u, [keyword]),
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
    name: 'coop-onboarding',
    match: (query, list, me) => {
      if (
        !/(i'?m (a )?(new )?co-?op|new co-?op|new here|just (started|joined|got here)|onboard|first (day|week)|getting started|who should i (meet|talk to|know|connect)|new to (the|my|our) team|settling in|new to ops|new employee)/.test(
          query,
        )
      ) {
        return null;
      }
      const seen = new Set<number>([me.id]);
      const picks: SurfacedPerson[] = [];
      const add = (u: User | undefined, why: string) => {
        if (u && !seen.has(u.id)) {
          seen.add(u.id);
          picks.push(surface(u, why));
        }
      };
      if (me.managerId != null) add(getUserById(me.managerId), 'Your manager — a good first check-in.');
      me.teammates.slice(0, 3).forEach((id) => add(getUserById(id), `On your ${me.team} team — worth meeting early.`));
      for (const u of list) {
        if (picks.length >= 5) break;
        if (seen.has(u.id) || !u.availableForCoffee) continue;
        const shared = sharedInterestsBetween(me, u).slice(0, 2);
        add(
          u,
          shared.length
            ? `Open to help today · you both like ${shared.join(' and ')}.`
            : 'Open to help today — a friendly first coffee.',
        );
      }
      if (!picks.length) {
        return {
          text: "Welcome aboard! Set yourself as open to help on the Connect board and add a few interests to your profile — I'll suggest people to meet once there's a bit more to go on.",
          people: [],
        };
      }
      return {
        text: `Welcome aboard! Here are a few people to meet in your first week on the ${me.team} team (${me.ministry}):`,
        people: picks,
        followUps: ['Who on my team is open to help today?', 'Who shares my interests?'],
      };
    },
  },
  {
    name: 'project-staffing',
    match: (query, list) => {
      if (
        !/(dashboard|deliver|staff|build a team|assemble|put together|initiative|kick ?off|launch|working on|starting a|need (people|someone|a team|help)|who can help|looking for|team to|project)/.test(
          query,
        )
      ) {
        return null;
      }
      // Read the project: which capabilities does it call for?
      const needed = skillsInQuery(query);
      const search = needed.length ? needed : ['data analytics', 'data visualization'];
      const seen = new Set<number>();
      const people: SurfacedPerson[] = [];
      const covered: string[] = [];
      for (const capability of search) {
        // Best person for this capability, preferring someone open to help today.
        const candidate = list
          .filter((u) => hasSkill(u, capability) && !seen.has(u.id))
          .sort((a, b) => Number(b.availableForCoffee) - Number(a.availableForCoffee))[0];
        if (!candidate) continue;
        seen.add(candidate.id);
        covered.push(capability);
        const matched = candidate.skills.filter((s) => norm(s).includes(norm(capability)));
        const skillTxt = matched.length ? ` (${matched.slice(0, 2).join(', ')})` : '';
        const avail = candidate.availableForCoffee ? ' Open to help today.' : '';
        people.push(
          surface(
            candidate,
            `${candidate.title} on the ${candidate.team} team${skillTxt}.${avail}`,
            capability,
            strengthFor(candidate, [capability]),
          ),
        );
        if (people.length >= 5) break;
      }
      if (!people.length) return null;
      const intro = needed.length
        ? `I read your project as needing ${covered.join(
            ', ',
          )}. Here's the internal capability that maps to each — a starting team you could reach out to:`
        : "Here's the internal capability that could help deliver this — a starting team you could reach out to:";
      return {
        text: intro,
        people,
        followUps: [
          'Only show people open to help now',
          'Draft an intro message to this team',
        ],
      };
    },
  },
  {
    name: 'team-discovery',
    match: (query, list) => {
      if (!/what teams|which teams|teams work/.test(query)) return null;
      const keyword = firstSkillInQuery(query) ?? 'data';
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
        const team = firstSkillInQuery(query);
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
      const keywords = skillsInQuery(query);
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
          surface(u, `${u.title} on the ${u.team} team — matches ${matched.join(' and ')}.`, undefined, strengthFor(u, matched)),
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
const ADJACENT = ['lunch', 'parking', 'commute', 'restaurant', 'coffee shop', 'café', 'cafe'];

function connectRationale(p: ConnectPerson): string {
  const parts: string[] = ['Open to help today'];
  if (p.availabilityNote) parts.push(p.availabilityNote);
  if (p.sharedInterests.length) parts.push(`you both like ${p.sharedInterests.join(' and ')}`);
  if (p.proximity) parts.push(`nearby · ${p.proximity}`);
  return parts.join(' · ');
}

// Append mutual context ("you both like X") to surfaced people so the AI reads as a social
// intelligence layer rather than a search bar. Skips people who already carry that context.
function addMutualContext(people: SurfacedPerson[], me: User): SurfacedPerson[] {
  return people.map((p) => {
    if (p.user.id === me.id) return p;
    if (p.rationale.toLowerCase().includes('you both like')) return p;
    const target = getUserById(p.user.id);
    if (!target) return p;
    const shared = sharedInterestsBetween(me, target).slice(0, 2);
    if (!shared.length) return p;
    const base = p.rationale.trim().endsWith('.') ? p.rationale.trim() : `${p.rationale.trim()}.`;
    return { ...p, rationale: `${base} You both like ${shared.join(' and ')}.` };
  });
}

// Contextual next-step chips shown under an assistant reply, derived from the matched intent.
function followUpsFor(name: string): string[] | undefined {
  switch (name) {
    case 'project-intelligence':
      return ['What other projects are active?', "Who's open to help right now?"];
    case 'proximity-availability':
      return ['Show everyone open to help today', 'Who shares my interests?'];
    case 'cybersecurity-field':
    case 'accessibility-navigation':
    case 'skill-discovery':
      return ["Who's open to help right now?", 'Which teams focus on this?'];
    case 'shadow-mentor':
      return ["Who's open to help right now?", 'Show me more mentors'];
    case 'person-lookup':
      return ["Who's on their team?", 'Find others with similar skills'];
    case 'team-discovery':
      return ['Who leads these teams?', "Who's open to help right now?"];
    case 'certification-lookup':
      return ['Who can help staff a project?', "Who's open to help right now?"];
    case 'shared-interests':
      return ["Who's open to help right now?", 'Who works near me?'];
    case 'reporting-lines':
      return ['What teams sit in this ministry?', 'How is the OPS structured?'];
    case 'org-roster':
      return ['How is the OPS structured?', "Who's open to help right now?"];
    default:
      return undefined;
  }
}

// Run the intent pipeline and post-process a match (mutual context + follow-up chips).
// Returns null when nothing matched, so callers can layer their own fallbacks on top.
function runIntents(query: string, me: User): AIReply | null {
  for (const intent of intents) {
    const reply = intent.match(query, users, me);
    if (reply) {
      const people = addMutualContext(reply.people, me);
      const followUps = reply.followUps ?? followUpsFor(intent.name);
      return { ...reply, people, followUps };
    }
  }
  return null;
}

function generateReply(rawQuery: string, me: User): AIReply {
  const query = norm(rawQuery).trim();
  if (OFF_TOPIC.some((t) => query.includes(t)) && !ADJACENT.some((a) => query.includes(a))) {
    return {
      text: "I'm designed to help with organizational questions — try asking me about people, teams, or skills at OPS!",
      people: [],
    };
  }
  const matched = runIntents(query, me);
  if (matched) return matched;
  if (ADJACENT.some((a) => query.includes(a))) {
    return {
      text: 'There are a few good spots near 777 Bay Street — the food court at College Park and the cafés along Bay Street are popular with the team. Happy to help with people and skills questions too!',
      people: [],
    };
  }
  return {
    text: "I can help you find people, teams, and skills across the OPS. Try describing a project — e.g. \u201cI\u2019m launching an analytics dashboard, who can help?\u201d — or ask \u201cWho\u2019s open to help near me?\u201d",
    people: [],
    followUps: [
      "I'm starting a project that needs data analytics and Azure — who can help?",
      "Who's open to help right now?",
    ],
  };
}

// --- Admin analytics assistant -------------------------------------------
//
// A second, admin-only AI surface. The org-wide Copilot above is deliberately
// privacy-preserving — it only ever surfaces aggregate signals. This assistant is the
// opposite: it answers the coordinator questions that require individual-level engagement
// data — who is most/least connected, how a specific person is engaging, how the co-ops are
// settling in, which teams are thriving. It is gated behind isAdmin at the handler and is
// never reachable by a regular member.

interface AdminPersonStat {
  user: User;
  connections: number; // degree in the org network
  coffeeTotal: number; // coffee chats this person took part in
  coffeeThisMonth: number;
  distinctPeople: number; // distinct coffee-chat partners
  crossTeam: number; // coffee chats with someone outside their team
  ministriesReached: number; // distinct ministries their connections span
}

/** Build per-person engagement stats from the same network + coffee-chat log the graph uses. */
function computeActivity(): Map<number, AdminPersonStat> {
  const { degree, adjacency } = buildOrgNetwork();
  const thisMonth = NOW_ISO.slice(0, 7);
  const stats = new Map<number, AdminPersonStat>();

  for (const u of users) {
    const reached = new Set<string>();
    const nbrs = adjacency.get(u.id);
    if (nbrs) {
      for (const nId of nbrs) {
        const n = getUserById(nId);
        if (n) reached.add(n.ministry);
      }
    }
    stats.set(u.id, {
      user: u,
      connections: degree.get(u.id) ?? 0,
      coffeeTotal: 0,
      coffeeThisMonth: 0,
      distinctPeople: 0,
      crossTeam: 0,
      ministriesReached: reached.size,
    });
  }

  const distinct = new Map<number, Set<number>>();
  for (const chat of coffeeChats) {
    for (const [self, other] of [
      [chat.userId, chat.withUserId],
      [chat.withUserId, chat.userId],
    ] as const) {
      const s = stats.get(self);
      if (!s) continue;
      s.coffeeTotal++;
      if (chat.at.slice(0, 7) === thisMonth) s.coffeeThisMonth++;
      const partner = getUserById(other);
      if (partner && partner.team !== s.user.team) s.crossTeam++;
      const set = distinct.get(self) ?? new Set<number>();
      set.add(other);
      distinct.set(self, set);
    }
  }
  for (const [id, set] of distinct) {
    const s = stats.get(id);
    if (s) s.distinctPeople = set.size;
  }
  return stats;
}

/** Count with the right singular/plural word: n1(1,'connection','connections') → "1 connection". */
const n1 = (n: number, singular: string, plural: string): string =>
  `${n} ${n === 1 ? singular : plural}`;

function topBy(
  list: AdminPersonStat[],
  key: (s: AdminPersonStat) => number,
  count = 5,
): AdminPersonStat[] {
  return [...list]
    .sort((a, b) => key(b) - key(a) || a.user.name.localeCompare(b.user.name))
    .slice(0, count);
}

// --- Relationship reasoning helpers (admin) ------------------------------

// A compact person card for admin replies.
function adminSurface(u: User, extra?: string): SurfacedPerson {
  return surface(u, extra ?? `${u.title} — ${u.team}, ${u.ministry}.`);
}

// People named in a query, full-name matches first, de-duplicated.
function peopleInQuery(query: string): User[] {
  const q = ` ${norm(query)} `;
  const scored: { u: User; full: boolean }[] = [];
  for (const u of users) {
    const name = norm(u.name);
    if (q.includes(name)) {
      scored.push({ u, full: true });
      continue;
    }
    const parts = name.split(/\s+/).filter((p) => p.length > 2);
    if (parts.some((p) => new RegExp(`\\b${p}\\b`).test(q))) scored.push({ u, full: false });
  }
  scored.sort((a, b) => Number(b.full) - Number(a.full) || a.u.id - b.u.id);
  const seen = new Set<number>();
  const out: User[] = [];
  for (const s of scored) {
    if (!seen.has(s.u.id)) {
      seen.add(s.u.id);
      out.push(s.u);
    }
  }
  return out;
}

// Breadth-first shortest path between two people in a given adjacency map.
function shortestPath(
  aId: number,
  bId: number,
  adjacency: Map<number, Set<number>>,
): number[] | null {
  if (aId === bId) return [aId];
  const prev = new Map<number, number>();
  const visited = new Set<number>([aId]);
  const queue: number[] = [aId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of adjacency.get(cur) ?? []) {
      if (visited.has(nb)) continue;
      visited.add(nb);
      prev.set(nb, cur);
      if (nb === bId) {
        const path = [bId];
        let p = bId;
        while (prev.has(p)) {
          p = prev.get(p)!;
          path.unshift(p);
        }
        return path;
      }
      queue.push(nb);
    }
  }
  return null;
}

function describePath(path: number[]): string {
  const names = path.map((id) => getUserById(id)?.name ?? '—');
  return `The chain runs ${names.join(' → ')}.`;
}

// Everything two people visibly have in common, as human-readable lines.
function commonGround(a: User, b: User): string[] {
  const out: string[] = [];
  if (a.team === b.team) out.push(`Both on the ${a.team} team`);
  else if (a.division === b.division) out.push(`Both in the ${a.division}`);
  if (a.ministry === b.ministry) out.push(`Both in ${a.ministry}`);
  if (a.cluster && a.cluster === b.cluster) out.push(`Both served by the ${a.cluster}`);
  if (a.location === b.location) out.push(`Both based at ${a.location}`);
  const inter = (x: string[], y: string[]) => {
    const setY = new Set(y.map(norm));
    return x.filter((v) => setY.has(norm(v)));
  };
  const skills = inter(a.skills, b.skills);
  if (skills.length) out.push(`Shared skills: ${skills.join(', ')}`);
  const interests = inter(a.interests, b.interests);
  if (interests.length) out.push(`Shared interests: ${interests.join(', ')}`);
  const certs = inter(a.certifications, b.certifications);
  if (certs.length) out.push(`Shared certifications: ${certs.join(', ')}`);
  if (a.managerId === b.id) out.push(`${b.name} manages ${a.name}`);
  else if (b.managerId === a.id) out.push(`${a.name} manages ${b.name}`);
  else if (a.managerId != null && a.managerId === b.managerId) out.push('Report to the same manager');
  const sharedProjects = projects.filter((p) => {
    const ids = surfaceProject(p, users).suggestedPeople.map((sp) => sp.user.id);
    return ids.includes(a.id) && ids.includes(b.id);
  });
  if (sharedProjects.length) out.push(`Both map to ${sharedProjects.map((p) => p.id).join(', ')}`);
  return out;
}

// Suggest people a person would benefit from meeting: strong attribute overlap, not yet linked.
function recommendConnections(person: User, mode: EdgeMode): SurfacedPerson[] {
  const { adjacency } = buildNetwork(mode);
  const neighbors = adjacency.get(person.id) ?? new Set<number>();
  const skillSet = new Set(person.skills.map(norm));
  const interestSet = new Set(person.interests.map(norm));
  const scored = users
    .filter((u) => u.id !== person.id && !neighbors.has(u.id))
    .map((u) => {
      const sharedSkills = u.skills.filter((s) => skillSet.has(norm(s)));
      const sharedInterests = u.interests.filter((i) => interestSet.has(norm(i)));
      let score = sharedSkills.length * 2 + sharedInterests.length;
      if (u.division === person.division && u.team !== person.team) score += 1;
      if (u.ministry === person.ministry) score += 1;
      if (u.mentoringAreas.length && person.coopInfo) score += 2;
      return { u, score, sharedSkills, sharedInterests };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  return scored.map(({ u, sharedSkills, sharedInterests }) => {
    const bits: string[] = [];
    if (sharedSkills.length) bits.push(`shares ${sharedSkills.slice(0, 2).join(', ')}`);
    if (sharedInterests.length) bits.push(`both into ${sharedInterests.slice(0, 2).join(', ')}`);
    if (u.mentoringAreas.length && person.coopInfo)
      bits.push(`open to mentoring on ${u.mentoringAreas.slice(0, 2).join(', ')}`);
    if (u.ministry === person.ministry && !bits.length) bits.push('same ministry');
    return surface(u, `${u.title} on the ${u.team} team — ${bits.join(' · ') || 'strong overlap'}.`);
  });
}

// Skills held by only one active person — knowledge single-points-of-failure.
function busFactorReply(): AIReply {
  const holders = new Map<string, User[]>();
  for (const u of users) {
    if (!u.isActiveUser) continue;
    const seen = new Set<string>();
    for (const raw of u.skills) {
      const k = norm(raw);
      if (seen.has(k)) continue;
      seen.add(k);
      const arr = holders.get(raw.trim()) ?? [];
      arr.push(u);
      holders.set(raw.trim(), arr);
    }
  }
  const solo = [...holders.entries()]
    .filter(([, us]) => us.length === 1)
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (!solo.length) {
    return {
      text: 'Good news — every listed skill has at least two active people who can cover it. No single points of failure right now.',
      people: [],
    };
  }
  const lines = solo.slice(0, 8).map(([skill, us]) => `• ${skill} — only ${us[0].name}`);
  const people = solo
    .slice(0, 5)
    .map(([skill, us]) =>
      surface(us[0], `Sole active holder of ${skill} — a knowledge single-point-of-failure.`, skill, 'high'),
    );
  return {
    text: `${solo.length} skill${solo.length === 1 ? '' : 's'} rely on a single active person — worth building backup for:\n\n${lines.join('\n')}`,
    people,
    followUps: ['Who could mentor to spread these skills?', 'Which projects have staffing gaps?'],
  };
}

// Active projects whose required skills aren't fully covered internally.
function staffingGapReply(): AIReply {
  const open = projects.filter((p) => p.status !== 'Done');
  const surfaced = open.map((p) => surfaceProject(p, users)).filter((sp) => sp.gapSkills.length > 0);
  if (!surfaced.length) {
    return {
      text: 'Every active project has internal coverage for all of its required skills right now — no staffing gaps.',
      people: [],
    };
  }
  const lines = surfaced.map(
    (sp) => `• ${sp.project.id} ${sp.project.title} — missing ${sp.gapSkills.join(', ')}`,
  );
  return {
    text: `${surfaced.length} active project${surfaced.length === 1 ? '' : 's'} ${surfaced.length === 1 ? 'has' : 'have'} a staffing gap — required skills with no internal match:\n\n${lines.join('\n')}`,
    people: [],
    projects: surfaced,
    followUps: ['Which skills rely on just one person?', 'Who can help staff these?'],
  };
}

function adoptionTrendReply(me: User): AIReply {
  const ins = adminInsights(me.id);
  const trend = ins.adoptionTrend;
  const first = trend[0];
  const last = trend[trend.length - 1];
  const delta = last.value - first.value;
  const pct = first.value ? Math.round((delta / first.value) * 100) : 0;
  const series = trend.map((t) => `${t.month} ${t.value}`).join(' · ');
  return {
    text: `Adoption is ${delta >= 0 ? 'up' : 'down'} ${Math.abs(pct)}% over six months — from ${first.value} active in ${first.month} to ${last.value} in ${last.month} (${ins.activationRate}% of the directory). Monthly active: ${series}.`,
    people: [],
    followUps: ['Who needs a nudge to connect?', 'How are the co-ops settling in?'],
  };
}

function draftOutreachReply(): AIReply {
  const stats = computeActivity();
  const isolated = [...stats.values()]
    .filter((s) => s.user.isActiveUser)
    .sort((a, b) => a.connections - b.connections)
    .slice(0, 3)
    .map((s) => s.user.name.split(' ')[0]);
  const names = isolated.join(', ');
  const text = `Here's a warm, low-pressure nudge you can adapt and send on Teams to your least-connected members${names ? ` (e.g. ${names})` : ''}:\n\n“Hi — I noticed you're just getting started on ConnectOPS. There's a friendly group of people across the OPS marked ‘open to help’ this week, and it's a great low-key way to meet someone outside your immediate team. Want me to suggest a couple of people who share your interests or skills? No pressure — happy to make an intro whenever you're ready.”\n\nWant me to tailor it for the co-op cohort specifically?`;
  return {
    text,
    people: [],
    followUps: ['How are the co-ops settling in?', 'Who needs a nudge to connect?'],
  };
}

// Map a relationship-lens keyword in the query to an edge mode (for mode-aware answers).
function detectModeInQuery(query: string): EdgeMode | null {
  if (/shared skills?|same skills?|by skills?/.test(query)) return 'skills';
  if (/shared interests?|same interests?|by interests?/.test(query)) return 'interests';
  if (/same team|by team|teammates?/.test(query)) return 'team';
  if (/same ministry|by ministry/.test(query)) return 'ministry';
  if (/same division|same branch|by division/.test(query)) return 'division';
  if (/same cluster|i&it cluster|by cluster/.test(query)) return 'cluster';
  if (/coffee|already connected|have connected/.test(query)) return 'coffee';
  if (/same project|by project|project team/.test(query)) return 'project';
  if (/reporting|org chart/.test(query)) return 'reporting';
  if (/same floor|same location|proximity/.test(query)) return 'location';
  if (/mentor/.test(query)) return 'mentorship';
  if (/cohort|same school|same term/.test(query)) return 'cohort';
  return null;
}

// "Who's most connected [by <lens>]" — degree ranking within the requested/active lens.
function mostConnectedByMode(query: string, mode: EdgeMode): AIReply {
  const detected = detectModeInQuery(query) ?? mode;
  const info = EDGE_MODES.find((m) => m.id === detected) ?? EDGE_MODES[0];
  const { degree } = buildNetwork(detected);
  const ranked = users
    .map((u) => ({ u, d: degree.get(u.id) ?? 0 }))
    .filter((x) => x.d > 0)
    .sort((a, b) => b.d - a.d || a.u.name.localeCompare(b.u.name))
    .slice(0, 5);
  if (!ranked.length) {
    return { text: `No connections exist in the ${info.label.toLowerCase()} view.`, people: [] };
  }
  return {
    text: `Most connected by ${info.label.toLowerCase()} (${info.description}) — the strongest hubs in that lens:`,
    people: ranked.map((x) =>
      surface(
        x.u,
        `${x.u.title} on the ${x.u.team} team — ${n1(x.d, 'connection', 'connections')} in this view.`,
        `${x.d} connections`,
        'high',
      ),
    ),
    followUps: ['Who bridges the most ministries?', 'Who needs a nudge to connect?'],
  };
}

// Relationship + advanced analytics intents unique to the admin assistant. Returns null to
// let the standard analytics pipeline (and then the main-bot capabilities) take over.
function adminRelationshipReply(query: string, me: User, mode: EdgeMode): AIReply | null {
  const modeInfo = EDGE_MODES.find((m) => m.id === mode) ?? EDGE_MODES[0];
  const two = peopleInQuery(query).slice(0, 2);
  const isDirectCheck =
    /(know each other|know one another|do (they|.*and.*) know|have (they|.*) (met|connected|talked)|are (they|.*) connected|did (they|.*) connect|ever (met|connected))/.test(
      query,
    );

  // 1) Relationship path / direct check between two named people.
  if (
    two.length >= 2 &&
    (isDirectCheck ||
      /(how (are|is|do|does)|connected|connection between|path between|linked|related|degrees? of separation|reach)/.test(
        query,
      ))
  ) {
    const [a, b] = two;
    const { adjacency } = buildNetwork(mode);
    const direct = adjacency.get(a.id)?.has(b.id) ?? false;
    const coffee = coffeeChats.some(
      (c) =>
        (c.userId === a.id && c.withUserId === b.id) ||
        (c.userId === b.id && c.withUserId === a.id),
    );
    const path = shortestPath(a.id, b.id, adjacency);
    const lens = modeInfo.label.toLowerCase();

    if (isDirectCheck) {
      if (direct) {
        return {
          text: `Yes — ${a.name} and ${b.name} are directly connected in the ${lens} view${coffee ? ", and they've logged a coffee chat together" : ''}.`,
          people: [adminSurface(a), adminSurface(b)],
        };
      }
      if (path) {
        return {
          text: `Not directly — but they're linked through ${path.length - 2} ${path.length - 2 === 1 ? 'person' : 'people'} in the ${lens} view. ${describePath(path)}`,
          people: path.map((id) => adminSurface(getUserById(id)!)),
        };
      }
      return {
        text: `No — ${a.name} and ${b.name} aren't connected in the ${lens} view. A good introduction to make.`,
        people: [adminSurface(a), adminSurface(b)],
      };
    }

    if (!path) {
      return {
        text: `${a.name} and ${b.name} have no connecting path in the “${modeInfo.label}” view — they sit in separate clusters. Try switching the connection lens (e.g. shared skills) to reveal a link.`,
        people: [adminSurface(a), adminSurface(b)],
      };
    }
    if (path.length === 2) {
      return {
        text: `${a.name} and ${b.name} are directly connected in the ${lens} view${coffee ? " — they've had a coffee chat" : ''}.`,
        people: path.map((id) => adminSurface(getUserById(id)!)),
      };
    }
    return {
      text: `${a.name} and ${b.name} are ${path.length - 1} hops apart in the ${lens} view. ${describePath(path)}`,
      people: path.map((id) => adminSurface(getUserById(id)!)),
    };
  }

  // 2) Common ground between two named people.
  if (two.length >= 2 && /(in common|have in common|common ground|similar|share|both)/.test(query)) {
    const [a, b] = two;
    const shared = commonGround(a, b);
    if (!shared.length) {
      return {
        text: `${a.name} and ${b.name} don't share an obvious team, ministry, skill, or interest on file — connecting them would bridge two different parts of the org.`,
        people: [adminSurface(a), adminSurface(b)],
      };
    }
    return {
      text: `${a.name} and ${b.name} have common ground:\n\n${shared.map((s) => `• ${s}`).join('\n')}`,
      people: [adminSurface(a), adminSurface(b)],
    };
  }

  // 3) Warm intro / broker.
  if (
    /(introduce|warm intro|who could (connect|introduce)|who knows both|mutual (connection|contact)|get me to|reach someone|broker|common connection)/.test(
      query,
    )
  ) {
    const { adjacency } = buildNetwork(mode);
    if (two.length >= 2) {
      const [a, b] = two;
      const mutual = [...(adjacency.get(a.id) ?? [])].filter((id) => adjacency.get(b.id)?.has(id));
      if (mutual.length) {
        return {
          text: `${n1(mutual.length, 'person', 'people')} could make a warm introduction between ${a.name} and ${b.name} — connected to both:`,
          people: mutual.slice(0, 5).map((id) => adminSurface(getUserById(id)!)),
        };
      }
      return {
        text: `No one is currently connected to both ${a.name} and ${b.name}, so there's no warm-intro path yet — a direct introduction would create the first bridge.`,
        people: [adminSurface(a), adminSurface(b)],
      };
    }
    if (two.length === 1) {
      const person = two[0];
      const unit = detectOrgUnit(query);
      if (unit) {
        const nbrs = adjacency.get(person.id) ?? new Set<number>();
        const brokers = [...nbrs]
          .map((id) => getUserById(id)!)
          .filter((u) => norm(u[unit.kind]) === norm(unit.name));
        if (brokers.length) {
          return {
            text: `${person.name} already has ${n1(brokers.length, 'connection', 'connections')} in ${unit.name} who could open doors there:`,
            people: brokers.slice(0, 5).map((u) => adminSurface(u)),
          };
        }
        const secondary = new Set<number>();
        for (const id of nbrs) {
          for (const id2 of adjacency.get(id) ?? []) {
            const u = getUserById(id2);
            if (u && norm(u[unit.kind]) === norm(unit.name)) secondary.add(id2);
          }
        }
        if (secondary.size) {
          return {
            text: `${person.name} isn't directly connected into ${unit.name}, but these people there are two hops away — reachable through a mutual contact:`,
            people: [...secondary].slice(0, 5).map((id) => adminSurface(getUserById(id)!)),
          };
        }
        return {
          text: `${person.name} has no connection path into ${unit.name} yet — a deliberate introduction would be the first bridge.`,
          people: [],
        };
      }
    }
  }

  // 4) Connection recommendations.
  if (
    /(who should .* meet|recommend (connections|people|someone)|suggest (people|connections|someone)|who would .* benefit|expand .* network|who to connect|good connections for|who might .* click)/.test(
      query,
    )
  ) {
    const person = two[0] ?? me;
    const recs = recommendConnections(person, mode);
    if (!recs.length) {
      return {
        text: `${person.name} is already connected across the relevant teams — no obvious gaps to fill right now.`,
        people: [],
      };
    }
    return {
      text: `People ${person.name} would likely benefit from meeting — strong overlap, not yet connected:`,
      people: recs,
      followUps: ['Who could introduce them?', 'Who shares their skills?'],
    };
  }

  // 5) Bus factor / single point of failure.
  if (
    /(single point|bus factor|only person|one person|rely on (one|a single)|key person|sole|risk if .* (left|leaves)|scarce skill|rare skill|scarcity|only one)/.test(
      query,
    )
  ) {
    return busFactorReply();
  }

  // 6) Staffing-gap radar.
  if (
    /(staffing gap|staff.* gap|gaps? (in|across|on)|which projects .* (short|missing|need|gap|understaff)|understaffed|hard to staff|can'?t staff|coverage gap)/.test(
      query,
    )
  ) {
    return staffingGapReply();
  }

  // 7) Adoption / engagement trend.
  if (/(adoption|trend|over time|growing|month over month|momentum|sign-?ups?|uptake|trajectory)/.test(query)) {
    return adoptionTrendReply(me);
  }

  // 8) Draft outreach.
  if (
    /((draft|write|compose|help me).*(nudge|message|email|note|outreach|invite|reminder))|nudge (message|note|them)/.test(
      query,
    )
  ) {
    return draftOutreachReply();
  }

  // 9) Mode-aware "most connected by <lens>".
  if (
    /(most connected|top connect|well connected|best connected|biggest hub|most central|strongest hub|most links)/.test(
      query,
    ) &&
    detectModeInQuery(query)
  ) {
    return mostConnectedByMode(query, mode);
  }

  return null;
}

function generateAdminReply(rawQuery: string, me: User, mode: EdgeMode = 'combined'): AIReply {
  const query = norm(rawQuery).trim();
  const stats = computeActivity();
  const all = [...stats.values()];
  const active = all.filter((s) => s.user.isActiveUser);

  // Light guardrail — stay on the analytics topic.
  if (OFF_TOPIC.some((t) => query.includes(t)) && !ADJACENT.some((a) => query.includes(a))) {
    return {
      text: "I'm the program analytics assistant — I can tell you how people are engaging: who's most or least connected, how a specific person is settling in, how two people are connected, or how the co-ops and teams are doing.",
      people: [],
    };
  }

  // Relationship reasoning + advanced analytics unique to the admin assistant.
  const relationship = adminRelationshipReply(query, me, mode);
  if (relationship) return relationship;

  // --- Person lookup: "How engaged is Priya?" / "Tell me about Marcus's activity" ---
  const words = new Set(query.split(/[^a-z]+/).filter(Boolean));
  const named = all.find((s) => words.has(norm(s.user.name.split(' ')[0])));
  if (
    named &&
    query.split(/\s+/).length <= 12 &&
    /(how |activ|interact|engag|doing|connection|coffee|tell me about|about |status|profile|settl|look at)/.test(
      query,
    )
  ) {
    const s = named;
    const coopTxt = s.user.coopInfo
      ? ` As a co-op student (${s.user.coopInfo.program}), this is a good read on how they're settling in.`
      : '';
    const text = `${s.user.name} is a ${s.user.title} on the ${s.user.team} team. They hold ${n1(
      s.connections,
      'connection',
      'connections',
    )} in the org network, reaching ${n1(
      s.ministriesReached,
      'ministry',
      'ministries',
    )}. They've logged ${n1(s.coffeeTotal, 'coffee chat', 'coffee chats')} (${
      s.coffeeThisMonth
    } this month), meeting ${n1(
      s.distinctPeople,
      'distinct person',
      'distinct people',
    )} — ${s.crossTeam} of those outside their own team.${coopTxt}`;
    return {
      text,
      people: [
        surface(
          s.user,
          `${n1(s.connections, 'connection', 'connections')} · ${s.crossTeam} cross-team · ${
            s.coffeeThisMonth
          } this month`,
          `${s.connections} connections`,
        ),
      ],
      followUps: ['Who are the most connected people?', 'Who needs a nudge to connect?'],
    };
  }

  // --- Co-op onboarding: "How are the co-ops settling in?" ---
  if (/co-?op|intern|new (hire|hires|people|employee|employees|student|students|starter)|onboard|settl/.test(query)) {
    const coops = [...all]
      .filter((s) => s.user.coopInfo)
      .sort((a, b) => a.connections - b.connections);
    if (coops.length) {
      const avg =
        Math.round((coops.reduce((sum, s) => sum + s.connections, 0) / coops.length) * 10) / 10;
      return {
        text: `There ${coops.length === 1 ? 'is' : 'are'} ${n1(
          coops.length,
          'co-op student',
          'co-op students',
        )} in the program, averaging ${avg} connections each. Here's how they're settling into the network — least connected first, so start at the top:`,
        people: coops
          .slice(0, 5)
          .map((s) =>
            surface(
              s.user,
              `${s.user.title} on the ${s.user.team} team — ${n1(
                s.connections,
                'connection',
                'connections',
              )} so far${
                s.coffeeTotal === 0 ? ', no coffee chats logged yet' : `, ${s.coffeeTotal} coffee chats`
              }.`,
              `${s.connections} connections`,
            ),
          ),
        followUps: ['Who could mentor them?', 'Who are the most connected people?'],
      };
    }
  }

  // --- Bridges: "Who connects the most ministries?" ---
  if (/bridge|connector|cross-?ministry|cross-?team|silo|span|boundary|boundaries|link/.test(query)) {
    const top = topBy(active, (s) => s.ministriesReached).filter((s) => s.ministriesReached > 0);
    if (top.length) {
      return {
        text: "These people bridge the most ministries — the connectors keeping the org from siloing:",
        people: top.map((s) =>
          surface(
            s.user,
            `${s.user.title}, ${s.user.team} — reaches ${n1(
              s.ministriesReached,
              'ministry',
              'ministries',
            )} through ${n1(s.connections, 'connection', 'connections')}.`,
            `${s.ministriesReached} ministries`,
            'high',
          ),
        ),
        followUps: ['Who has the most connections overall?', 'Who needs a nudge to connect?'],
      };
    }
  }

  // --- Available today ---
  if (/available|open to help|open for coffee|around today|free (to|for)/.test(query)) {
    const avail = all.filter((s) => s.user.availableForCoffee);
    return {
      text: `${n1(avail.length, 'person is', 'people are')} marked open to help today across the OPS:`,
      people: avail
        .slice(0, 6)
        .map((s) =>
          surface(
            s.user,
            `${s.user.title} on the ${s.user.team} team${
              s.user.availabilityNote ? ` — “${s.user.availabilityNote}”` : ''
            }.`,
            `${s.connections} connections`,
          ),
        ),
      followUps: ['Who are the most connected people?', 'Who needs a nudge to connect?'],
    };
  }

  // --- Least connected / needs a nudge ---
  if (/least|lowest|fewest|isolat|quiet|inactive|not active|hasn'?t|struggl|disengag|nudge|need|risk|lonely|left out|behind|weak/.test(query)) {
    const low = [...active]
      .sort((a, b) => a.connections - b.connections || a.user.name.localeCompare(b.user.name))
      .slice(0, 5);
    return {
      text: "These active members have the fewest connections — good candidates for an introduction or a nudge toward the Connect board:",
      people: low.map((s) =>
        surface(
          s.user,
          `${s.user.title} on the ${s.user.team} team — only ${n1(
            s.connections,
            'connection',
            'connections',
          )} so far${s.coffeeTotal === 0 ? ', no coffee chats logged yet' : ''}.`,
          `${s.connections} connections`,
        ),
      ),
      followUps: ['Who are the most connected people?', 'How are the co-ops settling in?'],
    };
  }

  // --- Team leaderboard ---
  if (/team/.test(query)) {
    const insights = adminInsights(me.id);
    const wantLow = /least|low|lowest|struggl|quiet|behind|weak|nudge/.test(query);
    const list = wantLow
      ? [...insights.teams].reverse().slice(0, 5)
      : insights.teams.slice(0, 5);
    const lines = list.map(
      (t, i) =>
        `${i + 1}. ${t.team} (${t.ministry}) — ${t.connectionsPerActive} connections per active member · ${n1(
          t.activeUsers,
          'active member',
          'active members',
        )}`,
    );
    return {
      text: `${
        wantLow ? 'Teams with the lightest internal connectivity' : 'Most connected teams'
      }, by connections per active member:\n\n${lines.join('\n')}`,
      people: [],
      followUps: ['Who are the most connected people?', 'Who bridges the most ministries?'],
    };
  }

  // --- Program overview / snapshot ---
  const overview = (): AIReply => {
    const ins = adminInsights(me.id);
    const topConnector = topBy(active, (s) => s.connections)[0];
    const text = `Program snapshot: ${ins.activeUsers} of ${ins.totalEmployees} people are active (${
      ins.activationRate
    }% adoption), with ${ins.totalConnections} connections across the network — ${
      ins.crossTeamPct
    }% cross-team and ${ins.crossMinistryPct}% cross-ministry. ${
      ins.availableToday
    } are open to help today.${
      topConnector
        ? ` ${topConnector.user.name} is currently the most connected (${n1(
            topConnector.connections,
            'link',
            'links',
          )}).`
        : ''
    } Ask me who's most or least connected, how a specific person is engaging, or how the co-ops are settling in.`;
    return {
      text,
      people: topConnector
        ? [
            surface(
              topConnector.user,
              `Most connected — ${n1(
                topConnector.connections,
                'connection',
                'connections',
              )} across ${n1(topConnector.ministriesReached, 'ministry', 'ministries')}.`,
              `${topConnector.connections} connections`,
              'high',
            ),
          ]
        : [],
      followUps: [
        'Who are the most connected people?',
        'Who needs a nudge to connect?',
        'How are the co-ops settling in?',
      ],
    };
  };
  if (/overview|summary|snapshot|health|state of|going|dashboard|report|how (is|are|'?s)|how we/.test(query)) {
    return overview();
  }

  // --- Most connected / most active (default leaderboard) ---
  if (/most|top|highest|busiest|leader|champion|active|connected|engag|interact|social|central|hub/.test(query)) {
    const top = topBy(active, (s) => s.connections);
    return {
      text: "Here are the most connected people across the OPS right now — the strongest hubs in the network:",
      people: top.map((s) =>
        surface(
          s.user,
          `${s.user.title} on the ${s.user.team} team — connected to ${n1(
            s.connections,
            'person',
            'people',
          )} across ${n1(s.ministriesReached, 'ministry', 'ministries')}${
            s.coffeeThisMonth ? `, ${n1(s.coffeeThisMonth, 'coffee chat', 'coffee chats')} this month` : ''
          }.`,
          `${s.connections} connections`,
          'high',
        ),
      ),
      followUps: [
        'Who bridges the most ministries?',
        'Who needs a nudge to connect?',
        'How are the co-ops settling in?',
      ],
    };
  }

  // Main-bot capabilities (skills, projects, org structure, rosters, certs, reporting lines…)
  // so the admin assistant is a superset of the member Copilot.
  const main = runIntents(query, me);
  if (main) return main;

  // Fallback → a useful snapshot with guidance.
  return overview();
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
  'messagePrivacy',
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

  // --- Bulletin board / Connect ---
  getAvailability(userId: number): {
    availableForCoffee: boolean;
    availabilityNote: string | null;
    availabilitySetAt: string | null;
  } {
    const u = requireUser(userId);
    return {
      availableForCoffee: u.availableForCoffee,
      availabilityNote: u.availabilityNote,
      availabilitySetAt: u.availabilitySetAt,
    };
  },

  setAvailability(
    userId: number,
    available: boolean,
    note?: string | null,
  ): { availableForCoffee: boolean; availabilityNote: string | null; availabilitySetAt: string | null } {
    const u = requireUser(userId);
    u.availableForCoffee = available;
    u.availabilityNote = available ? (note?.trim() ? note.trim().slice(0, 120) : null) : null;
    u.availabilitySetAt = available ? new Date().toISOString() : null;
    u.isActiveUser = true; // setting availability activates you
    return {
      availableForCoffee: u.availableForCoffee,
      availabilityNote: u.availabilityNote,
      availabilitySetAt: u.availabilitySetAt,
    };
  },

  getConnectFeed(userId: number): ConnectPerson[] {
    return connectFeed(userId);
  },

  getProximity(userId: number): ProximitySummary {
    return proximitySummary(userId);
  },

  getDailyNudge(userId: number): DailyNudge {
    return dailyNudge(userId);
  },

  // --- Private activity metric ---
  getActivityMetrics(userId: number): ActivityMetrics {
    return activityMetrics(userId);
  },

  logCoffeeChat(userId: number, withUserId: number): ActivityMetrics {
    requireUser(userId);
    if (!getUserById(withUserId)) throw new ApiError(404, 'Person not found');
    if (withUserId === userId) throw new ApiError(400, 'You cannot log a chat with yourself.');
    coffeeChats.push({
      id: `cc-${uuid()}`,
      userId,
      withUserId,
      at: new Date().toISOString(),
    });
    return activityMetrics(userId);
  },

  // --- Admin insights (program coordinators) ---
  getAdminInsights(userId: number): AdminInsights {
    return adminInsights(userId);
  },

  getConnectionGraph(userId: number, mode?: EdgeMode): ConnectionGraph {
    return connectionGraph(userId, mode);
  },

  // --- Chat ---
  listConversations(userId: number): Conversation[] {
    return conversations
      .filter((c) => c.userId === userId && c.scope !== 'admin')
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

  createConversation(userId: number, title?: string, scope: 'chat' | 'admin' = 'chat'): Conversation {
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: `conv-${uuid()}`,
      userId,
      title: title || 'New chat',
      scope,
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

    const reply = generateReply(text, requireUser(userId));
    const assistantMessage: ChatMessage = {
      id: `msg-${uuid()}`,
      conversationId: convId,
      role: 'assistant',
      text: reply.text,
      people: reply.people,
      projects: reply.projects,
      followUps: reply.followUps,
      createdAt: now(),
    };
    chatMessages.push(assistantMessage);
    touch(convId);

    return { conversationId: convId, message: assistantMessage };
  },

  // --- Admin analytics assistant (program coordinators only) ---
  //
  // Admin threads are persisted like member chats but tagged scope: 'admin' so they stay
  // out of a member's personal Copilot history and only surface on the Insights page.
  listAdminConversations(userId: number): Conversation[] {
    const me = requireUser(userId);
    if (!me.isAdmin) {
      throw new ApiError(403, 'Program analytics are available to coordinators only.');
    }
    return conversations
      .filter((c) => c.userId === userId && c.scope === 'admin')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  getAdminConversation(
    userId: number,
    id: string,
  ): { conversation: Conversation; messages: ChatMessage[] } {
    const me = requireUser(userId);
    if (!me.isAdmin) {
      throw new ApiError(403, 'Program analytics are available to coordinators only.');
    }
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation || conversation.userId !== userId || conversation.scope !== 'admin') {
      throw new ApiError(404, 'Conversation not found');
    }
    const messages = chatMessages
      .filter((m) => m.conversationId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { conversation, messages };
  },

  deleteAdminConversation(userId: number, id: string): void {
    const me = requireUser(userId);
    if (!me.isAdmin) {
      throw new ApiError(403, 'Program analytics are available to coordinators only.');
    }
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation || conversation.userId !== userId || conversation.scope !== 'admin') {
      throw new ApiError(404, 'Conversation not found');
    }
    const index = conversations.findIndex((c) => c.id === id);
    conversations.splice(index, 1);
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      if (chatMessages[i].conversationId === id) chatMessages.splice(i, 1);
    }
  },

  // Persists the exchange under an admin-scoped conversation so coordinators can revisit
  // past analytics questions. Pass conversationId to continue a saved thread.
  sendAdminChat(
    userId: number,
    message: string,
    mode?: EdgeMode,
    conversationId?: string,
  ): { conversationId: string; message: ChatMessage } {
    const me = requireUser(userId);
    if (!me.isAdmin) {
      throw new ApiError(403, 'Program analytics are available to coordinators only.');
    }
    const text = message?.trim();
    if (!text) throw new ApiError(400, 'message is required');

    let convId = conversationId;
    if (convId) {
      const existing = conversations.find((c) => c.id === convId);
      if (!existing || existing.userId !== userId || existing.scope !== 'admin') {
        throw new ApiError(404, 'Conversation not found');
      }
    } else {
      const title = text.length > 40 ? `${text.slice(0, 40)}…` : text;
      convId = this.createConversation(userId, title, 'admin').id;
    }

    const now = () => new Date().toISOString();
    const touch = (id: string) => {
      const c = conversations.find((x) => x.id === id);
      if (c) c.updatedAt = new Date().toISOString();
    };

    const userMessage: ChatMessage = {
      id: `admin-${uuid()}`,
      conversationId: convId,
      role: 'user',
      text,
      createdAt: now(),
    };
    chatMessages.push(userMessage);
    touch(convId);

    const reply = generateAdminReply(text, me, mode ?? 'combined');
    const assistantMessage: ChatMessage = {
      id: `admin-${uuid()}`,
      conversationId: convId,
      role: 'assistant',
      text: reply.text,
      people: reply.people,
      projects: reply.projects,
      followUps: reply.followUps,
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
          lastMessageFromMe: last ? last.fromUserId === userId : false,
          needsReply: last ? last.fromUserId !== userId : false,
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
      thread: {
        ...thread,
        participant,
        lastMessage: last ? last.text : null,
        lastMessageFromMe: last ? last.fromUserId === userId : false,
        needsReply: last ? last.fromUserId !== userId : false,
      },
      participant,
      messages,
    };
  },

  sendMessage(userId: number, toUserId: number, text: string): { message: DirectMessage } {
    const body = text?.trim();
    if (!body) throw new ApiError(400, 'text is required');
    const recipient = getUserById(toUserId);
    if (!recipient) throw new ApiError(404, 'Recipient not found');
    if (toUserId === userId) throw new ApiError(400, 'You cannot message yourself.');

    // Respect the recipient's message-privacy preference. An existing conversation is always
    // allowed to continue — the gate only applies to a brand-new first message.
    const id = threadKey(userId, toUserId);
    const existingThread = threads.find((t) => t.id === id);
    if (!existingThread) {
      const privacy = recipient.messagePrivacy ?? 'everyone';
      const sender = requireUser(userId);
      if (privacy === 'none') {
        throw new ApiError(403, `${recipient.name.split(' ')[0]} isn’t accepting new messages right now.`);
      }
      if (privacy === 'ministry' && sender.ministry !== recipient.ministry) {
        throw new ApiError(
          403,
          `${recipient.name.split(' ')[0]} only accepts messages from people in their ministry.`,
        );
      }
    }

    let thread = existingThread;
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
    // Backfill fields that may be missing on accounts persisted before they existed.
    const normalized: User = {
      ...user,
      availableForCoffee: user.availableForCoffee ?? false,
      availabilityNote: user.availabilityNote ?? null,
      availabilitySetAt: user.availabilitySetAt ?? null,
      isActiveUser: user.isActiveUser ?? true,
      isAdmin: user.isAdmin ?? false,
      messagePrivacy: user.messagePrivacy ?? 'everyone',
    };
    users.push(normalized);
    return normalized;
  },
};
