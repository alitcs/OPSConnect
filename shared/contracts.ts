export type ActivityStatus = 'Online' | 'Away' | 'Offline' | 'Do Not Disturb';

export type ConnectIntentId =
  | 'coffee'
  | 'lunch'
  | 'walk'
  | 'exchange'
  | 'interest'
  | 'newhere';

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
  availableForCoffee: boolean;
  availabilityNote: string | null;
  availabilitySetAt: string | null;
  connectIntents?: ConnectIntentId[];
  isActiveUser: boolean;
  isAdmin: boolean;
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

export type ProjectStatus =
  | 'Backlog'
  | 'To Do'
  | 'In Progress'
  | 'In Review'
  | 'Blocked'
  | 'Done';

export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ProjectMilestone {
  label: string;
  date: string;
  done: boolean;
}

export interface ProjectTicket {
  id: string;
  title: string;
  source: string;
  type: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  team: string;
  ministry: string;
  summary: string;
  requiredSkills: string[];
  startDate: string;
  dueDate: string;
  progress: number;
  milestones: ProjectMilestone[];
}

export interface SurfacedPerson {
  user: UserSummary;
  rationale: string;
  capability?: string;
  matchStrength?: 'high' | 'medium';
}

export interface SurfacedProject {
  project: ProjectTicket;
  rationale?: string;
  suggestedPeople: SurfacedPerson[];
  coveredSkills: string[];
  gapSkills: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  text: string;
  people?: SurfacedPerson[];
  projects?: SurfacedProject[];
  followUps?: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
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

export interface FloorMapData {
  floorId: string;
  building: string;
  floor: number;
  width: number;
  height: number;
  highlightedSeat: { seat: string; x: number; y: number } | null;
}

export interface ConnectPerson {
  user: UserSummary;
  availabilityNote: string | null;
  sharedInterests: string[];
  proximity: string | null;
  isNearby: boolean;
  intents?: ConnectIntentId[];
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

export interface AdminInsightsDto {
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