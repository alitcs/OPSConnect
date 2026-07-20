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

  // --- Bulletin board availability ("open to connect today") ---
  availableForCoffee: boolean;
  availabilityNote: string | null;
  availabilitySetAt: string | null;
  /** The kinds of low-pressure connection the person is open to today. */
  connectIntents: ConnectIntentId[];

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

// --- Project / ticket intelligence ---
//
// A general, tool-agnostic view of work in flight across the OPS. Different teams use
// different ticketing systems (Atlassian Jira, Azure DevOps, Trello, ServiceNow…), so this
// shape is deliberately neutral — `source` just records where the item came from. The AI
// reads a project's required skills and maps internal people to it.

export type ProjectStatus =
  | 'Backlog'
  | 'To Do'
  | 'In Progress'
  | 'In Review'
  | 'Blocked'
  | 'Done';

export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

/** A single dated checkpoint on a project's timeline. */
export interface ProjectMilestone {
  label: string;
  date: string;
  done: boolean;
}

/** A project or ticket pulled from a team's ticketing tool. */
export interface ProjectTicket {
  id: string;
  title: string;
  /** The ticketing tool this item came from (Jira, Azure DevOps, Trello…). */
  source: string;
  /** Item type as it appears in the source tool (Project, Epic, Story, Bug, Task). */
  type: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  team: string;
  ministry: string;
  summary: string;
  /** Capabilities the work calls for — the AI maps these to internal people. */
  requiredSkills: string[];
  startDate: string;
  dueDate: string;
  /** Completion 0–100. */
  progress: number;
  milestones: ProjectMilestone[];
}

/** A project surfaced in chat, with the internal people whose skills map to its needs. */
export interface SurfacedProject {
  project: ProjectTicket;
  /** Why this project matched the query. */
  rationale?: string;
  /** People whose skills cover the project's required capabilities. */
  suggestedPeople: SurfacedPerson[];
  /** Required skills with internal capability found. */
  coveredSkills: string[];
  /** Required skills with no internal match surfaced (a staffing gap). */
  gapSkills: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  text: string;
  people?: SurfacedPerson[];
  /** Projects/tickets surfaced with suggested staffing. */
  projects?: SurfacedProject[];
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
  /** Which surface owns this thread. Admin (coordinator) chats and Connect concierge chats
   *  are kept separate from a member's personal Copilot history. Defaults to 'chat'. */
  scope?: 'chat' | 'admin' | 'connect';
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
  /** The connection intents this person has opted into today. */
  intents: ConnectIntentId[];
}

// --- Connection intents ("what kind of connection are you open to today") ---

/** A low-pressure signal about the kind of human connection someone welcomes today. */
export type ConnectIntentId =
  | 'coffee'
  | 'lunch'
  | 'walk'
  | 'exchange'
  | 'interest'
  | 'newhere';

export interface ConnectIntentInfo {
  id: ConnectIntentId;
  label: string;
  /** Icon name from the shared Icon set. */
  icon: string;
  /** One-line, human description shown under the label. */
  blurb: string;
}

/** All connection intents, in display order. Warm but professional — no dating framing. */
export const CONNECT_INTENTS: ConnectIntentInfo[] = [
  { id: 'coffee', label: 'Coffee chat', icon: 'coffee', blurb: 'A casual catch-up over coffee' },
  { id: 'lunch', label: 'Lunch buddy', icon: 'utensils', blurb: 'Share a lunch break with someone' },
  { id: 'walk', label: 'Walk & talk', icon: 'footprints', blurb: 'A break and a chat away from the desk' },
  { id: 'exchange', label: 'Skill exchange', icon: 'swap', blurb: 'Trade knowledge, advice, or career notes' },
  { id: 'interest', label: 'Shared interest', icon: 'star', blurb: 'Meet over a hobby or shared interest' },
  { id: 'newhere', label: 'New here', icon: 'flag', blurb: 'New to the OPS and keen to meet people' },
];

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
  isolatedActive: number;
  connectedRate: number;
  medianConnections: number;
  coffeeThisMonth: number;
  teams: TeamInsight[];
  bridges: BridgeInsight[];

  // Knowledge & expertise
  distinctSkills: number;
  singlePointSkills: number;
  topSkills: SkillInsight[];
  scarceSkills: SkillInsight[];

  // Onboarding
  coopCount: number;
  coopConnectionRate: number;
  orgConnectionRate: number;
  coopsConnected: number;
  coopConnectedPct: number;
  mentorsAvailable: number;
  menteesPerMentor: number;

  // ROI
  estHoursSaved: number;
  estCostSaved: number;
  adoptionDelta: number;
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
  /** What kind of relationship this edge represents (for colour-coding in Combined view). */
  kind?: string;
}

/** Full org connection graph for the admin network view. */
export interface ConnectionGraph {
  nodes: ConnectionGraphNode[];
  links: ConnectionGraphLink[];
  ministries: string[];
  /** Which relationship lens produced these edges. */
  mode: EdgeMode;
  /** Total number of edges in the current view. */
  edgeCount: number;
  /** Average connections per connected node in the current view. */
  avgConnections: number;
  /** How many people have at least one connection in the current view. */
  connectedCount: number;
}

/**
 * The relationship lens that defines what an edge between two people means. Switching the
 * lens re-derives the whole network from a different signal (org structure, skills, activity…).
 */
export type EdgeMode =
  | 'combined'
  | 'coffee'
  | 'team'
  | 'division'
  | 'ministry'
  | 'cluster'
  | 'project'
  | 'skills'
  | 'interests'
  | 'reporting'
  | 'orgchart'
  | 'location'
  | 'mentorship'
  | 'cohort';

export interface EdgeModeInfo {
  id: EdgeMode;
  label: string;
  /** Short caption explaining what an edge means in this lens. */
  description: string;
}

/** All selectable connection lenses, in display order. */
export const EDGE_MODES: EdgeModeInfo[] = [
  { id: 'combined', label: 'Combined', description: 'coffee chats, teammates, and cross-team bridges' },
  { id: 'coffee', label: 'Already connected', description: 'people who have logged a coffee chat together' },
  { id: 'team', label: 'Same team', description: 'people on the same team' },
  { id: 'division', label: 'Same division', description: 'people in the same division or branch' },
  { id: 'ministry', label: 'Same ministry', description: 'people in the same ministry' },
  { id: 'cluster', label: 'Same I&IT cluster', description: 'people served by the same technology cluster' },
  { id: 'project', label: 'Same project', description: 'people whose skills staff the same project' },
  { id: 'skills', label: 'Shared skills', description: 'people who list the same skill' },
  { id: 'interests', label: 'Shared interests', description: 'people who share an interest' },
  { id: 'reporting', label: 'Reporting line', description: 'managers linked to their direct reports' },
  { id: 'orgchart', label: 'Org chart', description: 'the reporting hierarchy, laid out top-down (managers above their reports)' },
  { id: 'location', label: 'Same location', description: 'people on the same building floor' },
  { id: 'mentorship', label: 'Mentorship match', description: 'mentors linked to potential mentees' },
  { id: 'cohort', label: 'Co-op cohort', description: 'co-op students from the same school and term' },
];
