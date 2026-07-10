import type { ProjectTicket } from '../types.js';

// Mock project / ticket data for ConnectOPS.
//
// Stands in for a future integration layer that would sync from each team's ticketing tool
// (Atlassian Jira, Azure DevOps, Trello, ServiceNow…). The `source` field records where an
// item came from; everything else is normalized into one neutral shape so the AI can reason
// about work across teams regardless of which tool a team happens to use.
//
// TODO (production): replace this file with a connector service that pulls live tickets and
// maps each provider's fields onto `ProjectTicket`. Keep this shape stable so chat doesn't
// change.

export const projects: ProjectTicket[] = [
  {
    id: 'HDP-482',
    title: 'Provincial Health Analytics Dashboard',
    source: 'Atlassian Jira',
    type: 'Epic',
    status: 'In Progress',
    priority: 'High',
    team: 'Data Platform Engineering',
    ministry: 'Ministry of Health',
    summary:
      'A self-serve dashboard giving program leads near-real-time views of wait times, capacity, and demand across health regions.',
    requiredSkills: ['Python', 'Tableau', 'SQL', 'Data visualization'],
    startDate: '2026-05-04',
    dueDate: '2026-09-15',
    progress: 60,
    milestones: [
      { label: 'Data model & pipeline', date: '2026-05-30', done: true },
      { label: 'Core dashboards', date: '2026-07-18', done: true },
      { label: 'Accessibility & UAT', date: '2026-08-22', done: false },
      { label: 'Rollout to program leads', date: '2026-09-15', done: false },
    ],
  },
  {
    id: 'TRN-1187',
    title: 'Real-Time Traffic Incident API',
    source: 'Azure DevOps',
    type: 'Story',
    status: 'In Progress',
    priority: 'Critical',
    team: 'Traffic Systems',
    ministry: 'Ministry of Transportation',
    summary:
      'A resilient, cloud-native API that streams highway incident data to partner apps and the 511 service within seconds of an event.',
    requiredSkills: ['Azure', 'Kubernetes', 'DevOps', 'Cloud'],
    startDate: '2026-06-01',
    dueDate: '2026-08-01',
    progress: 35,
    milestones: [
      { label: 'Event ingestion pipeline', date: '2026-06-20', done: true },
      { label: 'Autoscaling & failover', date: '2026-07-10', done: false },
      { label: 'Partner integration & launch', date: '2026-08-01', done: false },
    ],
  },
  {
    id: 'TBS-204',
    title: 'Digital Service Accessibility Uplift',
    source: 'Atlassian Jira',
    type: 'Project',
    status: 'To Do',
    priority: 'Medium',
    team: 'Design & Research',
    ministry: 'Treasury Board Secretariat',
    summary:
      'Bring the flagship citizen-facing services up to WCAG 2.2 AA, with an audit, remediation backlog, and a reusable accessible component set.',
    requiredSkills: ['Accessibility', 'React', 'Frontend', 'User Research'],
    startDate: '2026-07-14',
    dueDate: '2026-10-30',
    progress: 10,
    milestones: [
      { label: 'Accessibility audit', date: '2026-08-01', done: false },
      { label: 'Component remediation', date: '2026-09-19', done: false },
      { label: 'Verification & sign-off', date: '2026-10-30', done: false },
    ],
  },
  {
    id: 'FIN-77',
    title: 'Revenue Fraud Detection Model',
    source: 'Azure DevOps',
    type: 'Epic',
    status: 'In Progress',
    priority: 'High',
    team: 'Revenue Systems',
    ministry: 'Ministry of Finance',
    summary:
      'A machine-learning model that flags anomalous filings for review, cutting manual triage time while keeping a clear, auditable rationale.',
    requiredSkills: ['Python', 'Machine learning', 'SQL', 'Data analytics'],
    startDate: '2026-04-20',
    dueDate: '2026-11-20',
    progress: 45,
    milestones: [
      { label: 'Feature engineering', date: '2026-06-15', done: true },
      { label: 'Model training & evaluation', date: '2026-08-30', done: false },
      { label: 'Explainability & review workflow', date: '2026-10-10', done: false },
      { label: 'Pilot with review team', date: '2026-11-20', done: false },
    ],
  },
  {
    id: 'SEC-330',
    title: 'Cloud Security Posture Review',
    source: 'ServiceNow',
    type: 'Task',
    status: 'Blocked',
    priority: 'Critical',
    team: 'Cybersecurity Operations',
    ministry: 'Ministry of Transportation',
    summary:
      'A full posture review of the transportation cloud estate — identity, network segmentation, and logging — ahead of the annual security attestation.',
    requiredSkills: ['Cybersecurity', 'Security', 'Azure', 'Cloud'],
    startDate: '2026-06-09',
    dueDate: '2026-07-28',
    progress: 20,
    milestones: [
      { label: 'Scope & access provisioning', date: '2026-06-16', done: true },
      { label: 'Control assessment', date: '2026-07-07', done: false },
      { label: 'Remediation plan & attestation', date: '2026-07-28', done: false },
    ],
  },
  {
    id: 'EDU-159',
    title: 'Student Data Reporting Portal',
    source: 'Trello',
    type: 'Story',
    status: 'In Review',
    priority: 'Medium',
    team: 'Student Data Services',
    ministry: 'Ministry of Education',
    summary:
      'A board-facing portal that turns student enrolment and outcome data into clear, exportable reports without spreadsheets flying around by email.',
    requiredSkills: ['SQL', 'Data analytics', 'React', 'Frontend'],
    startDate: '2026-05-19',
    dueDate: '2026-08-12',
    progress: 80,
    milestones: [
      { label: 'Reporting schema', date: '2026-06-06', done: true },
      { label: 'Portal build', date: '2026-07-15', done: true },
      { label: 'Board review & launch', date: '2026-08-12', done: false },
    ],
  },
  {
    id: 'JUS-91',
    title: 'Court Records Modernization',
    source: 'Atlassian Jira',
    type: 'Project',
    status: 'Backlog',
    priority: 'Low',
    team: 'Court Modernization',
    ministry: 'Ministry of the Attorney General',
    summary:
      'Migrate legacy court records off aging infrastructure onto a modern, searchable platform with a phased, low-risk cutover.',
    requiredSkills: ['DevOps', 'Cloud', 'SQL', 'Java'],
    startDate: '2026-09-01',
    dueDate: '2027-01-15',
    progress: 5,
    milestones: [
      { label: 'Discovery & data mapping', date: '2026-10-01', done: false },
      { label: 'Migration tooling', date: '2026-11-30', done: false },
      { label: 'Phased cutover', date: '2027-01-15', done: false },
    ],
  },
];
