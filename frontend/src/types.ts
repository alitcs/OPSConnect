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
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  text: string;
  people?: SurfacedPerson[];
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
