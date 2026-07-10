// Shared domain types for the ConnectOPS backend.
// These mirror the frontend types in `frontend/src/types.ts`.
// In a real system these might live in a shared package.

export type ActivityStatus = 'Online' | 'Away' | 'Offline' | 'Do Not Disturb';

export interface CoopInfo {
  school: string;
  program: string;
  term: string;
}

/** Tier 1 (public) + Tier B (user-entered) + Tier 2 (consent-gated) data for an employee. */
export interface User {
  id: number;
  // --- Tier 1: auto-populated public data ---
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

  // --- Tier 2: consent-gated location data (default OFF) ---
  floor: number | null;
  seat: string | null;
  floorPublic: boolean; // user opted in to share floor
  seatPublic: boolean; // user opted in to share seat

  // --- Tier B: user-entered data ---
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
  isActiveUser: boolean;
  isAdmin: boolean;

  // --- Privacy: who is allowed to start a direct message with you ---
  messagePrivacy: 'everyone' | 'ministry' | 'none';
}

/** Compact representation used in lists, mini cards, and preview cards (Tier 1 only). */
export interface UserSummary {
  id: number;
  name: string;
  title: string;
  team: string;
  ministry: string;
  location: string;
  status: ActivityStatus;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  text: string;
  /** People surfaced by the AI for this message (mini cards rendered inline). */
  people?: SurfacedPerson[];
  /** Projects/tickets surfaced with suggested staffing. */
  projects?: SurfacedProject[];
  /** Suggested next questions rendered as tappable chips under an assistant reply. */
  followUps?: string[];
  createdAt: string;
}

/** A person the AI surfaced, with a contextual rationale. */
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

export interface Conversation {
  id: string;
  userId: number; // owner
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  conversationId: string;
  message: ChatMessage;
}

export interface DirectMessage {
  id: string;
  threadId: string;
  fromUserId: number;
  toUserId: number;
  text: string;
  createdAt: string;
}

export interface MessageThread {
  id: string;
  participantIds: [number, number];
  lastMessageAt: string;
}

export interface FloorMapData {
  floorId: string;
  building: string;
  floor: number;
  /** SVG viewBox dimensions for the placeholder floor plan. */
  width: number;
  height: number;
  /** The highlighted seat for the requested user. */
  highlightedSeat: {
    seat: string;
    x: number;
    y: number;
  } | null;
}

// --- Bulletin board / Connect feature ---

export interface ConnectPerson {
  user: UserSummary;
  availabilityNote: string | null;
  sharedInterests: string[];
  proximity: string | null;
  isNearby: boolean;
}

export interface ProximitySummary {
  count: number;
  floor: number | null;
  building: string | null;
  people: ConnectPerson[];
  shareEnabled: boolean;
}

export interface DailyNudge {
  message: string;
  people: ConnectPerson[];
}

export interface ConnectionRecord {
  withUser: UserSummary;
  at: string;
  crossTeam: boolean;
}

export interface ActivityMetrics {
  coffeeChatsThisMonth: number;
  coffeeChatsTotal: number;
  distinctPeople: number;
  crossTeamCount: number;
  crossTeamPct: number;
  history: { month: string; count: number }[];
  recent: ConnectionRecord[];
}

export interface TeamInsight {
  team: string;
  ministry: string;
  members: number;
  activeUsers: number;
  connections: number;
  connectionsPerActive: number;
}

export interface AdminInsights {
  totalEmployees: number;
  activeUsers: number;
  activationRate: number;
  availableToday: number;
  totalConnections: number;
  crossTeamPct: number;
  coopCount: number;
  coopConnectionRate: number;
  teams: TeamInsight[];
  engagementGaps: string[];
}

export interface CoffeeChat {
  id: string;
  userId: number;
  withUserId: number;
  at: string;
}
