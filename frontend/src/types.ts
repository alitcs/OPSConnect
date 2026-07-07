// Frontend domain types — mirror of backend/src/types.ts.

export type ActivityStatus = 'Online' | 'Away' | 'Offline' | 'Do Not Disturb';

export interface CoopInfo {
  school: string;
  program: string;
  term: string;
}

export interface User {
  id: number;
  name: string;
  title: string;
  team: string;
  branch: string;
  division: string;
  ministry: string;
  cluster: string;
  location: string;
  workHours: string;
  status: ActivityStatus;
  email: string;
  phone: string;
  managerId: number | null;
  directReports: number[];
  teammates: number[];
  floor: number | null;
  seat: string | null;
  floorPublic: boolean;
  seatPublic: boolean;
  skills: string[];
  certifications: string[];
  interests: string[];
  aspirations: string[];
  mentoringAreas: string[];
  coopInfo: CoopInfo | null;

  // --- Bulletin board availability ("open for coffee today") ---
  availableForCoffee: boolean;
  availabilityNote: string | null;
  availabilitySetAt: string | null;

  // --- Platform engagement ---
  isActiveUser: boolean; // actively signed up vs. passively listed from the directory
  isAdmin: boolean; // program-coordinator access to org-level insights

  // --- Privacy: who is allowed to start a direct message with you ---
  messagePrivacy: 'everyone' | 'ministry' | 'none';
}

export interface UserSummary {
  id: number;
  name: string;
  title: string;
  team: string;
  ministry: string;
  location: string;
  status: ActivityStatus;
}

export interface SurfacedPerson {
  user: UserSummary;
  rationale: string;
  /** For project-staffing results: the capability this person covers. */
  capability?: string;
  /** How closely this person fits the request — drives the confidence badge. */
  matchStrength?: 'high' | 'medium';
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  text: string;
  people?: SurfacedPerson[];
  /** Suggested next questions rendered as tappable chips under an assistant reply. */
  followUps?: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  threadId: string;
  fromUserId: number;
  toUserId: number;
  text: string;
  createdAt: string;
}

export interface MessageThreadSummary {
  id: string;
  participantIds: [number, number];
  lastMessageAt: string;
  participant: UserSummary | null;
  lastMessage: string | null;
  /** True when the most recent message was sent by the current user. */
  lastMessageFromMe: boolean;
  /** True when the other person messaged last — i.e. it's your turn to reply. */
  needsReply: boolean;
}

export interface FloorMapData {
  floorId: string;
  building: string;
  floor: number;
  width: number;
  height: number;
  highlightedSeat: { seat: string; x: number; y: number } | null;
}

export interface DirectoryFilterOptions {
  departments: string[];
  teams: string[];
  locations: string[];
  jobTitles: string[];
  ministries: string[];
}

// --- Bulletin board / "Connect" feature ---

/** A person surfaced on the Connect board, with mutual context (shared interests + proximity). */
export interface ConnectPerson {
  user: UserSummary;
  availabilityNote: string | null;
  sharedInterests: string[];
  /** Short proximity label (e.g. "Floor 14 · 777 Bay Street") when co-located today. */
  proximity: string | null;
  isNearby: boolean;
}

/** Smart proximity summary — "N people near you on Floor X are open for coffee today." */
export interface ProximitySummary {
  count: number;
  floor: number | null;
  building: string | null;
  people: ConnectPerson[];
  /** Whether the current user shares their floor (required to compute proximity). */
  shareEnabled: boolean;
}

/** Randomized daily nudge — may surface 0, 1, or 2 nearby people. */
export interface DailyNudge {
  message: string;
  people: ConnectPerson[];
}

/** A logged coffee chat used for the private activity metric. */
export interface ConnectionRecord {
  withUser: UserSummary;
  at: string;
  crossTeam: boolean;
}

/** Private, self-reflective activity metric — no manager visibility. */
export interface ActivityMetrics {
  coffeeChatsThisMonth: number;
  coffeeChatsTotal: number;
  distinctPeople: number;
  crossTeamCount: number;
  crossTeamPct: number;
  history: { month: string; count: number }[];
  recent: ConnectionRecord[];
}

/** Per-team rollup for the admin insights page. */
export interface TeamInsight {
  team: string;
  ministry: string;
  members: number;
  activeUsers: number;
  connections: number;
  connectionsPerActive: number;
}

/** A skill and how many people across the org list it. */
export interface SkillInsight {
  skill: string;
  count: number;
}

/** A person who connects many ministries — an org-network "bridge" / connector. */
export interface BridgeInsight {
  id: number;
  name: string;
  title: string;
  ministry: string;
  ministriesReached: number;
  connections: number;
}

/** Org-level analytics for program coordinators — aggregate only, never individual activity. */
export interface AdminInsights {
  // Adoption & reach
  totalEmployees: number;
  activeUsers: number;
  activationRate: number;
  availableToday: number;
  ministryCount: number;
  adoptionTrend: { month: string; value: number }[];

  // Network health / silos
  totalConnections: number;
  avgConnections: number;
  crossTeamPct: number;
  crossMinistryPct: number;
  teams: TeamInsight[];
  bridges: BridgeInsight[];

  // Knowledge & expertise
  distinctSkills: number;
  topSkills: SkillInsight[];
  scarceSkills: SkillInsight[];

  // Onboarding
  coopCount: number;
  coopConnectionRate: number;
  orgConnectionRate: number;
  mentorsAvailable: number;

  // ROI
  estHoursSaved: number;
}

/** A single person in the org-wide connection graph. */
export interface ConnectionGraphNode {
  id: number;
  name: string;
  title: string;
  team: string;
  ministry: string;
  status: ActivityStatus;
  /** Number of distinct people this person is connected to. */
  degree: number;
  isCoop: boolean;
  isActiveUser: boolean;
}

/** A connection (the two people have messaged) between two nodes. */
export interface ConnectionGraphLink {
  source: number;
  target: number;
  /** How many interactions back this edge — drives edge intensity. */
  weight: number;
}

/** Full org connection graph for the admin network view. */
export interface ConnectionGraph {
  nodes: ConnectionGraphNode[];
  links: ConnectionGraphLink[];
  ministries: string[];
}
