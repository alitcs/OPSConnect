// Mock AI service for ConnectOPS.
//
// Simulates an LLM that answers organizational questions. It parses the query for
// keywords (skills, departments, names, intents) and returns realistic responses,
// surfacing people as inline mini cards with a contextual rationale.
//
// TODO (production): replace this entire module with a call to Microsoft Copilot or a
// dedicated Python AI microservice. Keep the returned shape (`AIReply`) identical so the
// controller and frontend don't change.

import type { SurfacedPerson, User } from '../types.js';
import { getAllUsers } from '../data/store.js';
import { toSummary } from './userService.js';

export interface AIReply {
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

/** Build a contextual rationale for why a person matched a skill query. */
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
  /** Returns a reply if this intent matches the query, otherwise null. */
  match: (query: string, users: User[]) => AIReply | null;
}

// Skill keywords the AI knows how to search for.
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
  // --- Person lookup by name: "Tell me about Priya" ---
  {
    name: 'person-lookup',
    match: (query, users) => {
      if (!/(tell me about|who is|what'?s .* background|about)\b/.test(query)) {
        // Still allow a bare name match below via the generic name check.
      }
      const match = users.find((u) => {
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
        people: [
          surface(
            match,
            `${match.title} — ${match.branch}, ${match.ministry}.`,
          ),
        ],
      };
    },
  },

  // --- Org navigation: "Who should I talk to about accessibility standards?" ---
  {
    name: 'accessibility-navigation',
    match: (query, users) => {
      if (!/accessib/.test(query)) return null;
      const people = users
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

  // --- Field exploration: "Who works in cybersecurity? What does their day look like?" ---
  {
    name: 'cybersecurity-field',
    match: (query, users) => {
      if (!/(cyber|security)/.test(query)) return null;
      const people = users
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

  // --- Co-op / shadowing: "I want DevOps experience — who can I shadow?" ---
  {
    name: 'shadow-mentor',
    match: (query, users) => {
      if (!/(shadow|learn from|mentor)/.test(query)) return null;
      const keyword =
        SKILL_KEYWORDS.find((k) => query.includes(k)) ?? 'devops';
      const people = users
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

  // --- Strategic staffing: "I need to deliver an analytics dashboard — what skills exist?" ---
  {
    name: 'staffing-dashboard',
    match: (query, users) => {
      if (!/(dashboard|deliver|staff|build a team|achieve|project)/.test(query))
        return null;
      const keywords = SKILL_KEYWORDS.filter((k) => query.includes(k));
      const search = keywords.length ? keywords : ['data analytics', 'data visualization'];
      const seen = new Set<number>();
      const people: SurfacedPerson[] = [];
      for (const k of search) {
        for (const u of users.filter((u) => hasSkill(u, k))) {
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

  // --- Team discovery: "What teams work on data analytics?" ---
  {
    name: 'team-discovery',
    match: (query, users) => {
      if (!/what teams|which teams|teams work/.test(query)) return null;
      const keyword = SKILL_KEYWORDS.find((k) => query.includes(k)) ?? 'data';
      const teams = Array.from(
        new Set(
          users.filter((u) => hasSkill(u, keyword)).map((u) => `${u.team} (${u.ministry})`),
        ),
      ).slice(0, 5);
      if (!teams.length) return null;
      return {
        text: `Teams working on ${keyword} across the OPS:\n\n${teams
          .map((t) => `• ${t}`)
          .join('\n')}`,
        people: [],
      };
    },
  },

  // --- Counting / general org question: "How many co-ops are in Infrastructure?" ---
  {
    name: 'count-coops',
    match: (query, users) => {
      if (!/how many|count|number of/.test(query)) return null;
      if (/co-?op/.test(query)) {
        const coops = users.filter((u) => u.coopInfo !== null);
        let scoped = coops;
        const team = SKILL_KEYWORDS.find((k) => query.includes(k));
        if (/infrastructure/.test(query)) {
          scoped = coops.filter((u) => norm(u.team).includes('infrastructure') || norm(u.team).includes('end user'));
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
        text: `There are ${users.length} employees in the directory for this prototype.`,
        people: [],
      };
    },
  },

  // --- Generic skill discovery: "Who has Python and data visualization experience?" ---
  {
    name: 'skill-discovery',
    match: (query, users) => {
      const keywords = SKILL_KEYWORDS.filter((k) => query.includes(k));
      if (!keywords.length) return null;
      const seen = new Set<number>();
      const people: SurfacedPerson[] = [];
      // Prefer people who match the MOST requested skills.
      const scored = users
        .map((u) => ({ u, score: keywords.filter((k) => hasSkill(u, k)).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      for (const { u } of scored) {
        if (seen.has(u.id)) continue;
        seen.add(u.id);
        const matched = keywords.filter((k) => hasSkill(u, k));
        people.push(
          surface(
            u,
            `${u.title} on the ${u.team} team — matches ${matched.join(' and ')}.`,
          ),
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

const OFF_TOPIC = [
  'poem',
  'joke',
  'recipe',
  'weather',
  'sports score',
  'movie',
  'song',
  'story about',
];

// Adjacent-but-helpful topics we shouldn't refuse (e.g. lunch near the office).
const ADJACENT = ['lunch', 'coffee', 'parking', 'commute', 'restaurant'];

export function generateReply(rawQuery: string): AIReply {
  const query = norm(rawQuery).trim();
  const users = getAllUsers();

  // Completely off-topic → gentle redirect (light guardrail).
  if (OFF_TOPIC.some((t) => query.includes(t)) && !ADJACENT.some((a) => query.includes(a))) {
    return {
      text: "I'm designed to help with organizational questions — try asking me about people, teams, or skills at OPS!",
      people: [],
    };
  }

  // Adjacent-but-helpful → be helpful, don't refuse.
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

  // Fallback for unrecognized but on-topic queries.
  return {
    text: "I can help you find people, teams, and skills across the OPS. Try asking something like \u201cWho has Python and data visualization experience?\u201d or \u201cWho works in cybersecurity?\u201d",
    people: [],
  };
}
