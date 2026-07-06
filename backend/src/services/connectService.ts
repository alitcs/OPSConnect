// Bulletin-board / social-intelligence logic: availability feed, smart proximity,
// randomized daily nudge, private activity metric, and org-level admin insights.
//
// Mirrors the client-side mock so the real server and the static demo behave identically.

import type {
  ActivityMetrics,
  AdminInsights,
  ConnectPerson,
  DailyNudge,
  ProximitySummary,
  TeamInsight,
  User,
} from '../types.js';
import { getAllUsers, getCoffeeChats, getUserById, NOW_ISO } from '../data/store.js';
import { toSummary } from './userService.js';

function normText(s: string): string {
  return s.trim().toLowerCase();
}

function sharedInterestsBetween(a: User, b: User): string[] {
  const setB = new Set(b.interests.map(normText));
  return a.interests.filter((i) => setB.has(normText(i)));
}

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

export function connectFeed(viewer: User): ConnectPerson[] {
  return getAllUsers()
    .filter((u) => u.id !== viewer.id && u.isActiveUser && u.availableForCoffee)
    .map((u) => toConnectPerson(u, viewer))
    .sort((a, b) => {
      if (a.isNearby !== b.isNearby) return a.isNearby ? -1 : 1;
      if (b.sharedInterests.length !== a.sharedInterests.length) {
        return b.sharedInterests.length - a.sharedInterests.length;
      }
      return a.user.name.localeCompare(b.user.name);
    });
}

export function proximitySummary(viewer: User): ProximitySummary {
  const nearby = connectFeed(viewer).filter((p) => p.isNearby);
  return {
    count: nearby.length,
    floor: viewer.floor,
    building: viewer.location,
    people: nearby,
    shareEnabled: viewer.floorPublic && viewer.floor != null,
  };
}

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

export function dailyNudge(viewer: User): DailyNudge {
  const nearby = proximitySummary(viewer).people;
  const day = NOW_ISO.slice(0, 10);
  const rng = mulberry32(hashSeed(`${viewer.id}:${day}`));
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

export function activityMetrics(viewer: User): ActivityMetrics {
  const mine = getCoffeeChats().filter(
    (c) => c.userId === viewer.id || c.withUserId === viewer.id,
  );
  const otherOf = (c: { userId: number; withUserId: number }) =>
    c.userId === viewer.id ? c.withUserId : c.userId;
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

export function adminInsights(): AdminInsights {
  const users = getAllUsers();
  const coffeeChats = getCoffeeChats();

  const totalEmployees = users.length;
  const activeUsers = users.filter((u) => u.isActiveUser).length;
  const availableToday = users.filter((u) => u.availableForCoffee).length;
  const totalConnections = coffeeChats.length;

  let cross = 0;
  for (const c of coffeeChats) {
    const a = getUserById(c.userId);
    const b = getUserById(c.withUserId);
    if (a && b && a.team !== b.team) cross++;
  }
  const crossTeamPct = totalConnections ? Math.round((cross / totalConnections) * 100) : 0;

  const coops = users.filter((u) => u.coopInfo);
  const coopIds = new Set(coops.map((u) => u.id));
  const coopConnections = coffeeChats.filter(
    (c) => coopIds.has(c.userId) || coopIds.has(c.withUserId),
  ).length;
  const coopConnectionRate = coops.length
    ? Math.round((coopConnections / coops.length) * 10) / 10
    : 0;

  const nonCoops = users.filter((u) => !u.coopInfo);
  const nonCoopConnections = coffeeChats.filter(
    (c) => !coopIds.has(c.userId) || !coopIds.has(c.withUserId),
  ).length;
  const nonCoopRate = nonCoops.length
    ? Math.round((nonCoopConnections / nonCoops.length) * 10) / 10
    : 0;

  interface TeamAgg {
    team: string;
    ministry: string;
    members: number;
    activeUsers: number;
    connections: number;
  }
  const teamMap = new Map<string, TeamAgg>();
  const teamOf = (u: User) => `${u.team}|${u.ministry}`;
  for (const u of users) {
    const key = teamOf(u);
    const agg =
      teamMap.get(key) ??
      { team: u.team, ministry: u.ministry, members: 0, activeUsers: 0, connections: 0 };
    agg.members++;
    if (u.isActiveUser) agg.activeUsers++;
    teamMap.set(key, agg);
  }
  for (const c of coffeeChats) {
    const a = getUserById(c.userId);
    const b = getUserById(c.withUserId);
    if (a) {
      const agg = teamMap.get(teamOf(a));
      if (agg) agg.connections++;
    }
    if (b && (!a || teamOf(a) !== teamOf(b))) {
      const agg = teamMap.get(teamOf(b));
      if (agg) agg.connections++;
    }
  }
  const teams: TeamInsight[] = Array.from(teamMap.values())
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

  const engagementGaps: string[] = [];
  engagementGaps.push(
    `Co-op students average ${coopConnectionRate} connections each vs. ${nonCoopRate} for other employees — the cohort ConnectOPS exists to serve is connecting the least.`,
  );
  const laggard = [...teams]
    .filter((t) => t.activeUsers >= 2)
    .sort((a, b) => a.connectionsPerActive - b.connectionsPerActive)[0];
  if (laggard) {
    engagementGaps.push(
      `${laggard.team} (${laggard.ministry}) is the lowest-engaging team at ${laggard.connectionsPerActive} connections per active user.`,
    );
  }
  const idle = totalEmployees - activeUsers;
  if (idle > 0) {
    engagementGaps.push(
      `${idle} ${idle === 1 ? 'employee is' : 'employees are'} listed in the directory but ${
        idle === 1 ? 'has' : 'have'
      } not activated ConnectOPS yet.`,
    );
  }

  return {
    totalEmployees,
    activeUsers,
    activationRate: totalEmployees ? Math.round((activeUsers / totalEmployees) * 100) : 0,
    availableToday,
    totalConnections,
    crossTeamPct,
    coopCount: coops.length,
    coopConnectionRate,
    teams,
    engagementGaps,
  };
}
