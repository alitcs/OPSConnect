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
  FloorMapData,
  MessageThreadSummary,
  ProximitySummary,
  SurfacedPerson,
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
    teams,
    bridges,
    distinctSkills,
    topSkills,
    scarceSkills,
    coopCount: coops.length,
    coopConnectionRate,
    orgConnectionRate,
    mentorsAvailable,
    estHoursSaved,
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
}
interface OrgNetwork {
  edges: OrgEdge[];
  degree: Map<number, number>;
  adjacency: Map<number, Set<number>>;
}

// The one source of truth for "who is connected to whom" — powers both the 3D graph and
// the aggregate insights so the two can never disagree.
function buildOrgNetwork(): OrgNetwork {
  const rand = mulberry32(0x0ec0ffee);
  const edgeWeights = new Map<string, number>();
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const addEdge = (a: number, b: number, weight = 1) => {
    if (a === b) return;
    edgeWeights.set(key(a, b), (edgeWeights.get(key(a, b)) ?? 0) + weight);
  };

  // 1) Real coffee-chat activity counts as a strong connection.
  for (const chat of coffeeChats) addEdge(chat.userId, chat.withUserId, 2);

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
        if (rand() < 0.18) addEdge(members[i], members[j], 1);
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
      if (otherUser && otherUser.team !== u.team) addEdge(u.id, other, 1);
    }
  }

  // 4) A few hub connectors so leads read as central.
  const connectors = [1, 5, 25, 33, 35, 37, 40, 51, 60];
  for (const hub of connectors) {
    const reach = 3 + Math.floor(rand() * 3);
    for (let r = 0; r < reach; r++) {
      addEdge(hub, allIds[Math.floor(rand() * allIds.length)], 1);
    }
  }

  const degree = new Map<number, number>();
  const adjacency = new Map<number, Set<number>>();
  const edges: OrgEdge[] = Array.from(edgeWeights.entries()).map(([k, weight]) => {
    const [a, b] = k.split('-').map(Number);
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)!.add(b);
    adjacency.get(b)!.add(a);
    return { a, b, weight };
  });

  return { edges, degree, adjacency };
}

function connectionGraph(viewerId: number): ConnectionGraph {
  const viewer = requireUser(viewerId);
  if (!viewer.isAdmin) {
    throw new ApiError(403, 'The network view is available to program coordinators only.');
  }

  const { edges, degree } = buildOrgNetwork();
  const links = edges.map((e) => ({ source: e.a, target: e.b, weight: e.weight }));

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

  return { nodes, links, ministries };
}

// --- Mock AI -------------------------------------------------------------

interface AIReply {
  text: string;
  people: SurfacedPerson[];
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

const intents: Intent[] = [
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
      const needed = SKILL_KEYWORDS.filter((k) => query.includes(k));
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
    default:
      return undefined;
  }
}

function generateReply(rawQuery: string, me: User): AIReply {
  const query = norm(rawQuery).trim();
  if (OFF_TOPIC.some((t) => query.includes(t)) && !ADJACENT.some((a) => query.includes(a))) {
    return {
      text: "I'm designed to help with organizational questions — try asking me about people, teams, or skills at OPS!",
      people: [],
    };
  }
  for (const intent of intents) {
    const reply = intent.match(query, users, me);
    if (reply) {
      const people = addMutualContext(reply.people, me);
      const followUps = reply.followUps ?? followUpsFor(intent.name);
      return { ...reply, people, followUps };
    }
  }
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

  getConnectionGraph(userId: number): ConnectionGraph {
    return connectionGraph(userId);
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

    const reply = generateReply(text, requireUser(userId));
    const assistantMessage: ChatMessage = {
      id: `msg-${uuid()}`,
      conversationId: convId,
      role: 'assistant',
      text: reply.text,
      people: reply.people,
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
