# ConnectOPS — Full Application Specification for Copilot Code Generation

## INSTRUCTIONS TO COPILOT

Build a complete, working prototype of the ConnectOPS application based on the specification below. The backend should be fully scaffolded with all routes, controllers, models, and middleware in place — but use **dummy/mock data** instead of real database connections or external API integrations. The frontend should be fully built with all pages, components, navigation, and interactions functional using that dummy data. The app should look and feel like a real product when you run it.

**Tech stack:** Use whatever modern web stack you think is best for a mobile-first responsive web app + downloadable mobile app (e.g., React Native / Expo for mobile, Next.js or React for web, Node/Express or Python/FastAPI for backend — your call, but justify it). The app must work as both a **website** and a **downloadable mobile app**. Emphasize **mobile compatibility** — mobile-first design.

**Important:** Every feature, page, component, interaction, and data model described below has been carefully decided. Do not skip, simplify, or reinterpret anything. If something is marked "TBD" or "to be defined later," scaffold a placeholder for it with a clear TODO comment explaining what needs to be decided.

---

## 1. APPLICATION OVERVIEW

**App Name:** ConnectOPS

**Purpose:** An AI-powered organizational collaboration and connectivity tool for the Ontario Public Service (OPS). The primary function is an intelligent AI chat interface that queries organizational data to help employees discover people, skills, and expertise across the organization. Social connection is a secondary benefit — a natural byproduct of the collaboration features, not the main pitch.

**Core Value Proposition:** Collaboration and connectivity. We want people in the organization to be connected. Managers can ask "I need to achieve X — who can help?" and get intelligent, contextual answers. Employees can explore fields, find mentors, and discover expertise. Co-op students can find people with specific experience. The AI is the product, not an add-on.

**Target Users:** All OPS employees — co-op students, regular employees, managers, senior staff. Everyone accesses the same features with the same level of access. No role-based restrictions on core features.

**Platform:** Both a website and a downloadable mobile app. Mobile-first design priority, but must work well on desktop too.

**Competition Context:** This is for the OGT Summer 2026 Student Proposal competition. Track 2: Knowledge Retrieval and Information Access. Budget: $500,000/year over 3 fiscal years. Microsoft Copilot is the only approved AI tool in the OPS, but for this prototype, simulate the AI backend with a mock LLM service that returns realistic dummy responses.

---

## 2. NAVIGATION & LAYOUT

### 2.1 Top Navigation Bar
A persistent top navigation bar with 4 icons, listed in order of importance:

1. **Chat** (Homepage) — the AI chat interface. This is the primary feature and default landing page.
2. **Directory** — a browsable list of all employees with filters.
3. **Profile** — where the user edits their own profile information.
4. **Settings** — app settings (specifics TBD, but the page must exist with placeholder content and a TODO comment listing potential settings like notification preferences, privacy controls, theme, etc.).

### 2.2 Chat Page Layout (Homepage)
- **Top:** The top navigation bar (always visible).
- **Left sidebar:** Previous conversation history + a "New Chat" button. Standard AI chat sidebar pattern (like ChatGPT, Copilot, etc.). On mobile, this sidebar should be collapsible/hidden behind a hamburger menu or swipe gesture.
- **Center:** The active chat conversation thread. Messages scroll vertically. User messages on the right, AI responses on the left.
- **Bottom:** The chat input field with a send button. Always anchored to the bottom of the screen.

This is a standard AI chat interface. Users already know this pattern from ChatGPT, Copilot, etc. Zero learning curve. Do not deviate from this established pattern.

---

## 3. DATA MODEL

### 3.1 Tier 1 — Automatically Populated (Public Data)
This data is pulled from organizational databases (simulated with dummy data). It is always visible on every user's profile. No opt-in required — this information is already publicly available via Microsoft Teams.

For each employee, auto-populate:
- **Full name**
- **Job title**
- **Organizational structure:** Team, branch, division, ministry, cluster
- **Work hours** (e.g., "9 AM – 5 PM")
- **Activity status** (Online, Away, Offline, Do Not Disturb — simulating Teams/laptop status)
- **Email address**
- **Phone number**
- **Work location** (which office building — the OPS has multiple locations)
- **Reporting chain:** Who is their manager (who is "in charge of them")
- **Direct reports:** Who they manage (who they are "in charge of")
- **Teammates:** Who they work with on their immediate team

### 3.2 Tier 2 — Available But Requires User Consent
This data is available from organizational systems (e.g., workstation sign-in systems) but is **not shown by default**. Each user must manually opt-in to make this information visible on their profile. Default state: OFF.

- **Floor number** (which floor they are on today)
- **Seat number** (which workstation they signed into today)
- **Real-time building location** (derived from workstation sign-in data)

When a user opts in to share their seat/floor, their profile displays this info AND enables a **map view** (see Section 6.3).

### 3.3 Tier A — AI-Inferred Expertise
The AI backend infers skills and expertise from job titles and organizational structure. No user action needed.

Example: If someone's title is "Senior DevOps Engineer," the AI can reasonably surface them for DevOps-related queries. If someone is on the "Data Analytics Team," the AI infers data analytics expertise.

This is not displayed on the profile — it lives in the AI's reasoning layer. When the AI surfaces someone in a chat response, the rationale explains the inference.

### 3.4 Tier B — User-Entered Data (TBD)
Users will be able to manually add additional information to their profiles. The exact fields are TBD, but scaffold the following with placeholder/example fields and TODO comments:

- **Skills** (e.g., Python, Project Management, UX Research) — TODO: decide if this is free-text or a preset list
- **Certifications** (e.g., PMP, AWS Certified) — TODO: decide format
- **Interests** (e.g., machine learning, hiking, photography) — TODO: decide if preset list or free-text, and how to balance professionalism with variety
- **Career aspirations** (e.g., "Want to move into cybersecurity") — TODO: decide if preset categories (max 3) or free-text
- **Areas open to mentoring on** — TODO: decide format
- **Co-op rotation info** (school, program, term) — TODO: decide which fields

This data feeds the AI for better context and also appears in **Profile Section 2** (see Section 5).

### 3.5 Dummy Data Requirements
Generate at least **30 dummy employees** with realistic data spanning:
- At least 4 different ministries (e.g., TBS, MOH, MTO, MECP)
- At least 3 different office locations
- A mix of job titles (managers, senior staff, regular employees, co-op students)
- Varied organizational structures (different teams, branches, divisions)
- Some employees with Tier 2 data opted in (floor/seat visible), some opted out
- Some employees with Tier B data filled in, some with partial data, some with none
- Realistic reporting chains (managers → direct reports → teammates)

---

## 4. AI CHAT INTERFACE (Homepage)

### 4.1 Chat Behavior
- Standard AI chat interface: persistent conversation thread, sidebar with chat history, new chat button.
- **Guardrails:** Light guardrails. The AI should stay focused on organizational/work-related topics but should NOT be overly restrictive. If someone asks something adjacent to work (e.g., "What's a good lunch spot near the office?"), the AI should be helpful, not refuse. If someone asks something completely unrelated (e.g., "Write me a poem about cats"), the AI should gently redirect: "I'm designed to help with organizational questions — try asking me about people, teams, or skills at OPS!"
- **Conversation persistence:** Each conversation is saved and accessible from the left sidebar. Users can start new conversations with the "New Chat" button.

### 4.2 Core Query Patterns the AI Must Handle
The AI must be able to handle these types of queries (use mock responses that feel realistic):

| Who's Asking | What They're Asking | Example Query |
|---|---|---|
| Manager | Skill discovery for a project | "Who has Python and data visualization experience?" |
| Manager | Strategic staffing | "I need to deliver a new analytics dashboard — what skills exist internally to help?" |
| Manager | Capability + availability | "I need to achieve X with skills Y and Z — who at the organization can help me with this?" |
| Employee | Field exploration | "Who works in cybersecurity? What does their day look like?" |
| Co-op student | Experience seeking | "I want DevOps experience — who can I shadow or learn from?" |
| Anyone | Person lookup | "Tell me about Sarah in Finance — what's her background?" |
| Anyone | Org navigation | "Who should I talk to about accessibility standards?" |
| Anyone | Team discovery | "What teams work on data analytics?" |
| Anyone | General org questions | "How many co-ops are in the Infrastructure team this term?" |

### 4.3 AI Response Format — People Results
When the AI surfaces people in response to a query, it must display them as **inline mini profile cards** within the chat message. Each card shows:

- **Name**
- **Job title**
- **Team/department**
- **1-2 line rationale** explaining WHY this person was surfaced for this specific query. This rationale must be contextual, not generic. Examples:
  - "Senior DevOps Engineer — 4 years at OPS, currently leading the Infrastructure team's CI/CD pipeline migration"
  - "Data Analyst on the Policy Research team — previously a co-op in the same program you're in"
  - "Has Python and Tableau listed in their skills, and their team recently delivered a similar analytics dashboard"

### 4.4 Mini Card → Preview Card → Full Profile Flow
This is the **universal interaction pattern** across the entire app. It must be consistent everywhere:

1. **Mini profile card** (inline in chat or in directory list) — shows name, title, team. Tappable.
2. **Preview card** (popup/overlay) — shows Section 1 profile info: name, title, team, location, activity status, contact info. Easy to dismiss (tap outside, swipe down, X button). Has a **"View Full Profile"** button.
3. **Full profile page** — navigates to the person's complete profile (see Section 6).

This same flow applies whether the user finds someone through the AI chat OR through the Directory. The interaction pattern is identical in both contexts.

**IMPORTANT:** There must be NO button or link on the preview card or profile that says "Ask AI about this person" or "Chat with AI about this person." The AI chat and the directory/profile browsing are separate experiences. Linking them would feel like you're "investigating" someone, which is rude.

### 4.5 Non-People Responses
For queries that don't return people (e.g., "How many co-ops are in Infrastructure this term?"), the AI responds with plain text, possibly with simple data formatting (bullet points, numbers). No special card UI needed.

---

## 5. PROFILE PAGE (Own Profile — Editing)

This is where users view and edit their own profile. Accessed via the **Profile** icon in the top nav (3rd icon).

### 5.1 Two-Section Layout
The profile page has two distinct sections, separated by a **subtle visual separator** (a thin line, slight background color change, or small heading). Section 2 is NOT expandable/collapsible — it is simply further down the page, always visible if the user scrolls. No accordion, no toggle, no "show more" button.

**Section 1 — The "Business Card" (Top)**
Clean, glanceable, concise. Shows:
- Full name
- Job title
- Team / department / ministry
- Work location
- Email
- Phone number
- Activity status
- Work hours
- Manager (with link to their profile)
- Direct reports (with links to their profiles)

All Tier 1 data. This section should feel like a clean, modern business card. Minimal text, clear typography, good spacing.

**Section 2 — Extended Info (Below the separator)**
Richer, more detailed information. This section is slightly more complex and information-dense than Section 1, but should still be well-organized. Shows:
- All Tier B user-entered data (skills, certifications, interests, career aspirations, mentoring areas, co-op info)
- Tier 2 opt-in controls (toggle switches for floor/seat visibility)
- Any other extended profile fields added in the future

Each field should be editable inline or via an edit mode. Empty fields should show placeholder text encouraging the user to fill them in (e.g., "Add your skills to help others find you").

**The AI uses data from BOTH sections** to provide better context when answering queries about this person. Even if most humans never scroll to Section 2, the AI benefits from it.

### 5.2 Tier 2 Privacy Controls
Within Section 2, include toggle switches for Tier 2 data:
- **Show my floor:** ON/OFF (default: OFF)
- **Show my seat number:** ON/OFF (default: OFF)

When OFF, this data is not visible to anyone viewing the user's profile, and the map view (Section 6.3) is not available for this user.

---

## 6. PROFILE PAGE (Viewing Someone Else's Profile)

When a user views another person's profile (navigated to from a mini card, preview card, or directory), it shows a **read-only** version.

### 6.1 What's Shown
- **Section 1 info** (read-only) — name, title, team, location, contact info, activity status, work hours, manager, direct reports
- **Contact information** — email, phone number, clearly displayed
- **"Message" button** — if the in-app messaging feature is included (see Section 8). This button initiates a direct message conversation with this person.
- **Seat/floor map view** — if the person has opted in to share their seat (Tier 2 data is ON), display their floor and seat number AND provide a tappable link/button that opens a **map view** (see Section 6.3).

### 6.2 What's NOT Shown
- Section 2 extended info is NOT shown when viewing someone else's profile. Only Section 1 info is displayed. (The AI still uses Section 2 data internally for query responses, but it's not exposed on the public-facing profile view.)
- TODO: This decision may be revisited. Add a comment noting that the team may later decide to show some Tier B data (like skills and interests) on the public profile view.

### 6.3 Map View (Individual Person Only)
When viewing someone else's profile, IF they have opted in to share their seat/floor:
- Display their floor number and seat number as text
- Provide a tappable element (button or the seat number itself) that opens a **visual map of the building floor plan** highlighting ONLY that one person's seat

**CRITICAL:** This map view is ONLY available on individual profiles. There is NO building-wide map showing where everyone is sitting. A full building map of all employees would feel surveillance-like and creepy. The map is contextual — it answers "where is the specific person I'm going to meet?" not "where is everyone?"

For the prototype, create a simple placeholder floor plan image/SVG with a highlighted dot/marker showing the person's seat location. It doesn't need to be a real building — just demonstrate the concept.

---

## 7. DIRECTORY PAGE

Accessed via the **Directory** icon in the top nav (2nd icon).

### 7.1 Layout
A scrollable list of all employees. Each list item shows basic info (name, title, team, location) in a compact row format.

### 7.2 Filters
Filter controls at the top of the page (or in a filter panel). Available filters:
- **Department**
- **Team**
- **Location** (office building)
- **Job title**
- TODO: Add a comment noting that more filters may be added later (e.g., ministry, skills, availability status)

Filters should be combinable (e.g., filter by Department: Finance AND Location: Toronto).

### 7.3 Interaction Flow
Tapping a person in the directory list triggers the **same universal flow** as the AI chat:

1. **Tap person in list** → **Preview card** appears (popup/overlay with Section 1 info, easy to dismiss)
2. **Preview card** has a **"View Full Profile"** button → navigates to full profile page
3. User can dismiss the preview card and continue scrolling the directory without losing their place

The preview card must be easy to close — tap outside it, swipe it down, or hit an X button. The user should be able to quickly peek at several people without committing to navigating away from the directory.

### 7.4 No Map View on Directory
The directory is list-only. No map view toggle. No building-wide visualization. The map only appears on individual profiles (Section 6.3).

---

## 8. IN-APP MESSAGING (Planned — Include in Prototype)

### 8.1 Purpose
Lightweight, minimal direct messaging between users. Designed for **initial outreach and connection**, NOT for long-term communication. Think: "Hey, I saw you have experience with X — could we chat?" and then the real conversation moves to Teams or in-person.

### 8.2 Design Principles
- **Minimalistic.** No threads, no reactions, no file sharing, no read receipts, no typing indicators. Just plain text messages between two people.
- **Not a replacement for Teams.** This is a bridge to get two people connected, not a full messaging platform.
- **Accessible from profiles.** A "Message" button appears on other people's profiles (Section 6.1).

### 8.3 UI
- A simple chat view: two-person conversation, messages in chronological order, text input at the bottom.
- A **Messages** section accessible from... TODO: Decide where the messages inbox lives. Options: (a) a 5th icon in the top nav, (b) a notification badge on the Profile icon, (c) accessible from Settings. Add all three as comments and note this needs to be decided.
- Conversation list showing all active message threads.

### 8.4 Important Note
This feature may be removed if the team decides the app should only facilitate discovery, not conversation. Build it as a modular component that can be cleanly removed without breaking the rest of the app. Add a TODO comment at the top of the messaging module: "This feature is planned but may be cut. It should be removable without affecting other features."

---

## 9. SETTINGS PAGE

Accessed via the **Settings** icon in the top nav (4th icon).

### 9.1 Content
The specific settings are TBD. Create the page with the following placeholder sections, each with TODO comments:

- **Notification Preferences** — TODO: Define what notifications exist (e.g., new messages, system announcements)
- **Privacy Controls** — TODO: May duplicate or link to the Tier 2 toggles on the Profile page. Decide if privacy controls live here, on the profile, or both.
- **Appearance** — TODO: Light/dark mode toggle? Font size? Decide later.
- **Account** — TODO: Logout, delete account, linked accounts
- **About** — App version, terms of service, privacy policy links
- **Help / Feedback** — TODO: Link to support, feedback form

---

## 10. BACKEND ARCHITECTURE (Scaffolded, Not Implemented)

### 10.1 API Structure
Create a full REST API with all routes defined, controllers scaffolded, and mock data returned. The API should be organized around these resource groups:

**Users / Profiles**
- `GET /api/users` — list all users (with pagination, filtering by department/team/location/title)
- `GET /api/users/:id` — get a single user's full profile
- `PUT /api/users/:id` — update own profile (Tier B data, Tier 2 toggles)
- `GET /api/users/:id/reports` — get direct reports for a user
- `GET /api/users/:id/manager` — get manager for a user
- `GET /api/users/:id/teammates` — get teammates for a user

**AI Chat**
- `POST /api/chat` — send a message to the AI, receive a response
- `GET /api/chat/conversations` — list all conversations for the current user
- `GET /api/chat/conversations/:id` — get all messages in a conversation
- `POST /api/chat/conversations` — create a new conversation
- `DELETE /api/chat/conversations/:id` — delete a conversation

**Directory**
- `GET /api/directory` — list all users with filter support (department, team, location, job_title)
- `GET /api/directory/filters` — get available filter options (list of departments, teams, locations, titles)

**Messaging**
- `GET /api/messages` — list all message threads for the current user
- `GET /api/messages/:threadId` — get all messages in a thread
- `POST /api/messages/:userId` — send a message to a user (creates thread if none exists)

**Map / Location**
- `GET /api/users/:id/location` — get floor/seat data for a user (returns 403 if user hasn't opted in)
- `GET /api/floors/:floorId/map` — get floor plan data (returns SVG or coordinate data for rendering)

### 10.2 AI Mock Service
Create a mock AI service that:
- Accepts a user query string
- Parses it for keywords (names, skills, departments, etc.)
- Returns realistic mock responses including:
  - Text explanations
  - Arrays of user objects (for people-related queries) with rationale strings
- Handles the query patterns listed in Section 4.2
- Returns a gentle redirect message for completely off-topic queries

The mock service should have a library of **at least 15 pre-built query-response pairs** covering all the query patterns in Section 4.2, plus a fallback response for unrecognized queries.

### 10.3 Authentication (Mock)
Scaffold authentication middleware but use a mock implementation:
- A hardcoded "current user" (one of the 30 dummy employees) who is "logged in"
- Auth middleware that attaches the current user to every request
- A login page that lets you switch between 3-4 different dummy users to test different perspectives (e.g., a manager, a co-op student, a senior employee)
- TODO: In production, this would integrate with Microsoft Entra ID / Azure AD via MSAL

### 10.4 Data Layer (Mock)
- All data stored in-memory or in JSON files — no database required for the prototype
- Data should be structured as if it came from a real database (proper IDs, foreign keys for relationships, timestamps)
- TODO comments throughout noting where real database queries would go

---

## 11. DESIGN & UX REQUIREMENTS

### 11.1 Overall Aesthetic
- **Clean, simple, modern.** The app should feel lightweight and inviting, not enterprise-heavy.
- **Mobile-first.** Every screen must work beautifully on a phone. Desktop is secondary.
- **Minimal UI.** Avoid clutter. White space is good. Don't add elements that don't serve a clear purpose.
- **Consistent interaction patterns.** The mini card → preview card → full profile flow must feel identical whether triggered from the chat, the directory, or anywhere else.

### 11.2 Color Scheme
- Use a clean, professional color palette. Suggest: white/light gray backgrounds, a single accent color (blue or teal), dark text. Nothing flashy.
- TODO: Final brand colors to be decided. Use placeholder colors that look professional.

### 11.3 Typography
- Clean sans-serif font. System fonts are fine (San Francisco on iOS, Roboto on Android, Inter or similar on web).
- Clear hierarchy: page titles > section headers > body text > secondary text

### 11.4 Responsive Design
- **Mobile (< 768px):** Single column layout. Chat sidebar hidden behind hamburger/swipe. Top nav icons may collapse into a bottom tab bar if that works better on mobile (your call — but the icons and their order must remain the same).
- **Tablet (768px – 1024px):** Chat sidebar can be visible. Two-column layouts where appropriate.
- **Desktop (> 1024px):** Full layout with sidebar always visible. Directory can show more columns. Profiles can use wider layouts.

### 11.5 Animations & Transitions
- Subtle, fast transitions. Preview cards should slide up or fade in smoothly. Page transitions should feel snappy.
- No heavy animations. The app should feel fast and responsive, not flashy.

---

## 12. THINGS EXPLICITLY NOT IN THE APP

These were discussed and deliberately excluded. Do NOT build them:

1. **No building-wide map view.** No page or feature that shows all employees on a floor plan simultaneously. The map ONLY appears on individual profiles for users who opted in.
2. **No AI integration on profile cards.** No "Ask AI about this person" button anywhere. The AI chat and profile browsing are separate experiences.
3. **No matching/nudge system.** No "you matched with someone!" notifications. No mutual-interest alerts. No dating-app-style mechanics. The bulletin board model from the original concept has been deprioritized — the app is now primarily about organizational knowledge, not social matching.
4. **No role-based access restrictions.** Everyone sees the same features and the same data (except Tier 2 data which is controlled by the individual user's opt-in).
5. **No manager-visible activity metrics.** No dashboards showing who's using the app, who's messaging whom, or social activity scores. If any analytics exist, they are private to the individual user only.
6. **No long-form messaging features.** No threads, reactions, file sharing, read receipts, typing indicators, group chats, or channels. Messaging is bare-minimum text only.

---

## 13. DUMMY DATA EXAMPLES

Generate realistic dummy data. Here are some example employees to include (create 25+ more):

```json
[
  {
    "id": 1,
    "name": "Priya Sharma",
    "title": "Senior Data Analyst",
    "team": "Policy Research & Analytics",
    "branch": "Strategic Policy Division",
    "ministry": "Treasury Board Secretariat",
    "location": "777 Bay Street, Toronto",
    "floor": 14,
    "seat": "14-B22",
    "floorPublic": true,
    "email": "priya.sharma@ontario.ca",
    "phone": "416-555-0142",
    "workHours": "8:30 AM – 4:30 PM",
    "status": "Online",
    "managerId": 5,
    "directReports": [12, 18],
    "teammates": [3, 7, 12, 18],
    "skills": ["Python", "Tableau", "Statistical Analysis", "Policy Research"],
    "interests": ["Data visualization", "Machine learning", "Hiking"],
    "aspirations": ["Move into AI/ML engineering"],
    "coopInfo": null
  },
  {
    "id": 2,
    "name": "Marcus Chen",
    "title": "Co-op Student, Web Development",
    "team": "Enterprise Web Development",
    "branch": "Digital Services Branch",
    "ministry": "Treasury Board Secretariat",
    "location": "777 Bay Street, Toronto",
    "floor": null,
    "seat": null,
    "floorPublic": false,
    "email": "marcus.chen@ontario.ca",
    "phone": "416-555-0198",
    "workHours": "9:00 AM – 5:00 PM",
    "status": "Online",
    "managerId": 8,
    "directReports": [],
    "teammates": [4, 9, 15],
    "skills": ["JavaScript", "React", "Node.js"],
    "interests": ["DevOps", "Cloud computing", "Basketball"],
    "aspirations": ["Get backend development experience", "Learn about cybersecurity"],
    "coopInfo": {
      "school": "University of Waterloo",
      "program": "Computer Science",
      "term": "Summer 2026"
    }
  },
  {
    "id": 3,
    "name": "Angela Okafor",
    "title": "Manager, Infrastructure Services",
    "team": "Infrastructure & Cloud Operations",
    "branch": "I&IT Solutions Branch",
    "ministry": "Ministry of Health",
    "location": "56 Wellesley Street, Toronto",
    "floor": 8,
    "seat": "8-A15",
    "floorPublic": true,
    "email": "angela.okafor@ontario.ca",
    "phone": "416-555-0267",
    "workHours": "8:00 AM – 4:00 PM",
    "status": "Away",
    "managerId": 10,
    "directReports": [6, 11, 14, 22],
    "teammates": [6, 11, 14, 22],
    "skills": ["Azure", "DevOps", "Team Leadership", "Agile"],
    "interests": ["Mentoring", "Cloud architecture", "Running"],
    "aspirations": ["Director-level leadership"],
    "coopInfo": null
  }
]
```

Generate 27+ more employees following this pattern, ensuring diversity in:
- Ministries (TBS, MOH, MTO, MECP, MCCSS, OMAFRA, etc.)
- Locations (at least 3 different buildings)
- Roles (mix of managers, senior staff, regular employees, co-op students)
- Tier 2 opt-in status (some with floor/seat public, some without)
- Tier B completeness (some with full skills/interests, some with partial, some with none)
- Reporting chains that make organizational sense

---

## 14. FILE STRUCTURE SUGGESTION

Organize the project cleanly. Suggested structure (adapt as needed for your chosen stack):

```
connectops/
├── README.md
├── package.json (or equivalent)
├── /frontend
│   ├── /pages
│   │   ├── Chat.jsx (or .tsx)
│   │   ├── Directory.jsx
│   │   ├── Profile.jsx
│   │   ├── Settings.jsx
│   │   ├── UserProfile.jsx (viewing someone else)
│   │   └── Login.jsx (mock user switcher)
│   ├── /components
│   │   ├── TopNav.jsx
│   │   ├── ChatSidebar.jsx
│   │   ├── ChatMessage.jsx
│   │   ├── MiniProfileCard.jsx
│   │   ├── PreviewCard.jsx
│   │   ├── ProfileSection1.jsx
│   │   ├── ProfileSection2.jsx
│   │   ├── DirectoryList.jsx
│   │   ├── DirectoryFilters.jsx
│   │   ├── FloorMap.jsx
│   │   ├── MessageThread.jsx
│   │   ├── MessageInbox.jsx
│   │   └── ChatInput.jsx
│   ├── /data
│   │   └── dummyUsers.json
│   ├── /styles
│   │   └── (global styles, theme)
│   └── /utils
│       └── (helper functions)
├── /backend
│   ├── /routes
│   │   ├── users.js
│   │   ├── chat.js
│   │   ├── directory.js
│   │   ├── messages.js
│   │   └── location.js
│   ├── /controllers
│   │   ├── usersController.js
│   │   ├── chatController.js
│   │   ├── directoryController.js
│   │   ├── messagesController.js
│   │   └── locationController.js
│   ├── /services
│   │   └── mockAIService.js
│   ├── /middleware
│   │   └── mockAuth.js
│   ├── /data
│   │   ├── users.json
│   │   ├── conversations.json
│   │   └── messages.json
│   └── server.js
└── /mobile (if using React Native / Expo)
    └── (mirror frontend structure)
```

---

## 15. OPEN QUESTIONS & TODO ITEMS

These are unresolved design decisions. Scaffold placeholders for all of them with clear TODO comments in the code:

1. **Tier B profile fields** — exact fields, format (free-text vs preset list), and validation rules are TBD
2. **Interest tag list** — should interests come from a preset list (for professionalism) or be free-text? If preset, what's on the list?
3. **Messages inbox location** — where does the messaging inbox live in the nav? 5th icon? Badge on Profile? Inside Settings?
4. **Settings page content** — what specific settings should exist?
5. **Post-connection handoff** — after the AI suggests someone and you message them, does the conversation eventually move to Teams? Is there a "Continue in Teams" button?
6. **Section 2 visibility on other profiles** — should some Tier B data (skills, interests) be visible when viewing someone else's profile, or only Section 1?
7. **AI guardrail specifics** — exactly what topics should the AI refuse to answer? How strict?
8. **Additional directory filters** — what other filters beyond department, team, location, job title?
9. **Notification system** — what notifications does the app send? Push notifications on mobile? In-app only?
10. **Admin insights page** — should there be an analytics page for program coordinators showing macro trends? If so, what data?

---

## 16. WHAT SUCCESS LOOKS LIKE

When this prototype is running, a user should be able to:

1. Open the app and land on the AI chat interface
2. Ask "Who has experience with data analytics?" and see mini profile cards with rationales appear in the chat
3. Tap a mini card → see a preview card popup → tap "View Full Profile" → see the full profile page
4. Navigate to the Directory, scroll through employees, apply filters, tap someone → see the same preview card → full profile flow
5. View someone's profile and see their floor/seat info (if they opted in) → tap to see a map highlighting their seat
6. Go to their own Profile page and edit Section 1 and Section 2 data
7. Send a direct message to another user from their profile
8. Start a new chat conversation with the AI, and see previous conversations in the sidebar
9. Switch between different mock users (via the login page) to see the app from different perspectives
10. Use the app on both mobile and desktop with a responsive, clean experience

---

## END OF SPECIFICATION

Build this exactly as described. Every feature, every interaction, every data field. Use dummy data throughout. Scaffold the backend completely. Make the frontend fully functional and beautiful. Do not skip anything marked as a feature — only items marked "TBD" or "TODO" should have placeholders.

If you have questions about any part of this spec, add a comment in the code rather than making assumptions. When in doubt, build it simple and clean.
