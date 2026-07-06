// Curated, pre-set interest list for ConnectOPS profiles.
//
// Interests are chosen from this list (not free text) to keep the tone professional while
// still enabling meaningful discovery. Grouped for the picker UI; the flat list is what the
// data model stores. Keeping this centralized means the AI, Connect board, and profile editor
// all reason over the same vocabulary.

export interface InterestGroup {
  label: string;
  options: string[];
}

export const INTEREST_GROUPS: InterestGroup[] = [
  {
    label: 'Technology & data',
    options: [
      'Data analytics',
      'Data visualization',
      'Machine learning',
      'Artificial intelligence',
      'Cybersecurity',
      'Cloud computing',
      'DevOps',
      'Software development',
      'GIS & mapping',
      'Automation',
    ],
  },
  {
    label: 'Public service & policy',
    options: [
      'Policy research',
      'Digital government',
      'Accessibility',
      'Service design',
      'Sustainability',
      'Data privacy',
    ],
  },
  {
    label: 'Growth & collaboration',
    options: [
      'Mentoring',
      'Career development',
      'Leadership',
      'Public speaking',
      'Project management',
      'Product management',
      'UX research',
      'Innovation',
    ],
  },
  {
    label: 'Beyond work',
    options: [
      'Reading',
      'Hiking',
      'Running',
      'Cycling',
      'Photography',
      'Cooking',
      'Board games',
      'Chess',
      'Music',
      'Fitness',
      'Basketball',
      'Volunteering',
      'Travel',
    ],
  },
];

/** Flat list of every allowed interest. */
export const INTEREST_OPTIONS: string[] = INTEREST_GROUPS.flatMap((g) => g.options);
