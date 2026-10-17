import type {
  ActivityStatus,
  ConnectIntentId,
  EdgeMode,
  TeamInsight,
  UserSummary,
} from '../../shared/contracts.js';

export * from '../../shared/contracts.js';

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  author: string;
  updatedAt: string;
  readingMinutes: number;
  tags: string[];
  body: string[];
}

export interface MessageThreadSummary {
  id: string;
  participantIds: [number, number];
  lastMessageAt: string;
  participant: UserSummary | null;
  lastMessage: string | null;
  lastMessageFromMe: boolean;
  needsReply: boolean;
}

export interface InviteRecord {
  id: string;
  email: string;
  createdAt: string;
  deliveryStatus: 'mocked';
}

export interface DirectoryFilterOptions {
  departments: string[];
  teams: string[];
  locations: string[];
  jobTitles: string[];
  ministries: string[];
}

export interface ConnectIntentInfo {
  id: ConnectIntentId;
  label: string;
  icon: string;
  blurb: string;
}

export const CONNECT_INTENTS: ConnectIntentInfo[] = [
  { id: 'coffee', label: 'Coffee chat', icon: 'coffee', blurb: 'A casual catch-up over coffee' },
  { id: 'lunch', label: 'Lunch buddy', icon: 'utensils', blurb: 'Share a lunch break with someone' },
  { id: 'walk', label: 'Walk & talk', icon: 'footprints', blurb: 'A break and a chat away from the desk' },
  { id: 'exchange', label: 'Skill exchange', icon: 'swap', blurb: 'Trade knowledge, advice, or career notes' },
  { id: 'interest', label: 'Shared interest', icon: 'star', blurb: 'Meet over a hobby or shared interest' },
  { id: 'newhere', label: 'New here', icon: 'flag', blurb: 'New to the OPS and keen to meet people' },
];

export interface SkillInsight {
  skill: string;
  count: number;
}

export interface BridgeInsight {
  id: number;
  name: string;
  title: string;
  ministry: string;
  ministriesReached: number;
  connections: number;
}

/** Rich frontend presentation shape, separate from the backend AdminInsightsDto. */
export interface AdminInsightsView {
  totalEmployees: number;
  activeUsers: number;
  activationRate: number;
  availableToday: number;
  ministryCount: number;
  adoptionTrend: { month: string; value: number }[];
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
  distinctSkills: number;
  singlePointSkills: number;
  topSkills: SkillInsight[];
  scarceSkills: SkillInsight[];
  coopCount: number;
  coopConnectionRate: number;
  orgConnectionRate: number;
  coopsConnected: number;
  coopConnectedPct: number;
  mentorsAvailable: number;
  menteesPerMentor: number;
  estHoursSaved: number;
  estCostSaved: number;
  adoptionDelta: number;
}

export interface ConnectionGraphNode {
  id: number;
  name: string;
  title: string;
  team: string;
  ministry: string;
  status: ActivityStatus;
  degree: number;
  isCoop: boolean;
  isActiveUser: boolean;
}

export interface ConnectionGraphLink {
  source: number;
  target: number;
  weight: number;
  kind?: string;
}

export interface ConnectionGraph {
  nodes: ConnectionGraphNode[];
  links: ConnectionGraphLink[];
  ministries: string[];
  mode: EdgeMode;
  edgeCount: number;
  avgConnections: number;
  connectedCount: number;
}

export interface EdgeModeInfo {
  id: EdgeMode;
  label: string;
  description: string;
}

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