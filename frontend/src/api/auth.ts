// Client-side authentication for the ConnectOPS prototype.
//
// Access is restricted to Ontario Public Service accounts: only "@ontario.ca"
// email addresses may sign up or log in. This is a mock, browser-only auth layer
// (accounts + sessions live in localStorage) intended to demonstrate the flow.
//
// SECURITY NOTE: passwords are only lightly hashed for this prototype and stored
// in the browser — this is NOT secure and must be replaced with a real identity
// provider (e.g. Microsoft Entra ID / Azure AD via MSAL) before production.

import type { User } from '../types';
import { backend } from './mockBackend';

/** The only email domain permitted to access the app. */
export const ALLOWED_DOMAIN = 'ontario.ca';

const ACCOUNTS_KEY = 'connectops.accounts';
const SESSION_KEY = 'connectops.sessionUserId';

/**
 * Built-in demo accounts. Each maps a login email/password to a real seeded directory
 * profile (resolved via `mapsToEmail` against users.json), so reviewers can sign in with a
 * friendly address like admin@ontario.ca while landing on a full seeded profile. The mapped
 * profile determines admin access. Demo-only passwords; replace with a real identity
 * provider before production.
 */
export const DEMO_ACCOUNTS: Array<{
  email: string;
  password: string;
  label: string;
  /** The seeded profile (by its real users.json email) this demo account signs in as. */
  mapsToEmail: string;
}> = [
  {
    email: 'admin@ontario.ca',
    password: 'admin',
    label: 'Program coordinator (admin)',
    mapsToEmail: 'john.paul@ontario.ca',
  },
];

/** The one-click "demo admin" account surfaced on the login screen. */
export const DEMO_ADMIN = DEMO_ACCOUNTS[0];

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

interface Account {
  email: string;
  name: string;
  passwordHash: string;
  /** Full user profile, persisted so ids resolve after an in-memory reset. */
  user: User;
}

/** True only for a well-formed address ending in exactly "@ontario.ca". */
export function isOntarioEmail(email: string): boolean {
  return new RegExp(`^[^\\s@]+@${ALLOWED_DOMAIN.replace('.', '\\.')}$`, 'i').test(
    email.trim(),
  );
}

// Lightweight, non-cryptographic hash — sufficient to avoid storing raw
// passwords in this prototype, but NOT a substitute for real password hashing.
function hashPassword(password: string): string {
  let hash = 5381;
  for (let i = 0; i < password.length; i += 1) {
    hash = (hash * 33) ^ password.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Account[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: Account[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function findAccount(email: string): Account | undefined {
  const target = email.trim().toLowerCase();
  return loadAccounts().find((a) => a.email.toLowerCase() === target);
}

// Re-register any persisted accounts into the (in-memory, reset-on-reload)
// mock backend so their profiles are available on startup.
loadAccounts().forEach((account) => backend.registerUser(account.user));

export function getSessionUserId(): number | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function setSessionUserId(id: number): void {
  localStorage.setItem(SESSION_KEY, String(id));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return getSessionUserId() !== null;
}

function buildNewUserProfile(name: string, email: string): Omit<User, 'id'> {
  return {
    name,
    title: 'Ontario Public Service Employee',
    team: 'Unassigned',
    branch: 'Unassigned',
    division: 'Unassigned',
    ministry: 'Ontario Public Service',
    cluster: 'Unassigned',
    location: 'Remote',
    workHours: '9:00 AM – 5:00 PM',
    status: 'Online',
    email: email.trim().toLowerCase(),
    phone: '',
    managerId: null,
    directReports: [],
    teammates: [],
    floor: null,
    seat: null,
    floorPublic: false,
    seatPublic: false,
    skills: [],
    certifications: [],
    interests: [],
    aspirations: [],
    mentoringAreas: [],
    coopInfo: null,
    availableForCoffee: false,
    availabilityNote: null,
    availabilitySetAt: null,
    connectIntents: [],
    isActiveUser: true,
    isAdmin: false,
    messagePrivacy: 'everyone',
  };
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

/** A single password-policy rule, surfaced live in the sign-up form and enforced on submit. */
export interface PasswordRequirement {
  label: string;
  test: (pw: string) => boolean;
}

/** Minimum password requirements for new accounts. Kept sensible, not annoying. */
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'An uppercase and a lowercase letter', test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: 'At least one number', test: (pw) => /\d/.test(pw) },
];

/** The requirement labels a password fails, in order. Empty means the password is valid. */
export function passwordIssues(password: string): string[] {
  return PASSWORD_REQUIREMENTS.filter((r) => !r.test(password)).map((r) => r.label);
}

/** Register a new @ontario.ca account, creating a directory profile for them. */
export function signup({ name, email, password }: SignupInput): { userId: number } {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) throw new AuthError('Please enter your full name.');
  if (!isOntarioEmail(cleanEmail)) {
    throw new AuthError(`Only @${ALLOWED_DOMAIN} email addresses can access ConnectOPS.`);
  }
  if (passwordIssues(password).length > 0) {
    throw new AuthError('Password does not meet the minimum requirements.');
  }
  if (findAccount(cleanEmail) || backend.findUserByEmail(cleanEmail)) {
    throw new AuthError('An account with this email already exists. Try logging in.');
  }

  const user = backend.createUser(buildNewUserProfile(cleanName, cleanEmail));
  const accounts = loadAccounts();
  accounts.push({
    email: cleanEmail,
    name: cleanName,
    passwordHash: hashPassword(password),
    user,
  });
  saveAccounts(accounts);
  setSessionUserId(user.id);
  return { userId: user.id };
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Authenticate an existing @ontario.ca account. */
export function login({ email, password }: LoginInput): { userId: number } {
  const cleanEmail = email.trim().toLowerCase();

  if (!isOntarioEmail(cleanEmail)) {
    throw new AuthError(`Only @${ALLOWED_DOMAIN} email addresses can access ConnectOPS.`);
  }

  // 1) A locally-registered account created via sign up.
  const account = findAccount(cleanEmail);
  if (account) {
    if (account.passwordHash !== hashPassword(password)) {
      throw new AuthError('Incorrect email or password.');
    }
    backend.registerUser(account.user);
    setSessionUserId(account.user.id);
    return { userId: account.user.id };
  }

  // 2) A built-in demo account mapped to a seeded directory profile (e.g. the admin).
  const demo = DEMO_ACCOUNTS.find((d) => d.email === cleanEmail);
  if (demo && demo.password === password) {
    const user = backend.findUserByEmail(demo.mapsToEmail);
    if (user) {
      setSessionUserId(user.id);
      return { userId: user.id };
    }
  }

  throw new AuthError('Incorrect email or password.');
}

export function logout(): void {
  clearSession();
}

// --- Mock Microsoft Teams single sign-on -------------------------------------
//
// In production, access is exclusively via Microsoft Teams / Entra ID SSO — there
// is no separate email+password sign-up. The functions below fake that flow: a
// "Sign in with Microsoft Teams" button surfaces a mock account picker, and
// selecting an account signs the reviewer straight into a seeded profile.
// TODO (production): replace with the real MSAL / Entra ID token exchange.

/** A single entry in the mock Teams "Pick an account" picker. */
export interface TeamsAccount {
  email: string;
  name: string;
  title: string;
  initials: string;
  /** Marks the account with admin/coordinator access. */
  isAdmin: boolean;
}

/** Seeded @ontario.ca profiles surfaced in the mock Teams account picker. */
const TEAMS_ACCOUNT_EMAILS: Array<{ email: string; isAdmin: boolean }> = [
  { email: 'john.paul@ontario.ca', isAdmin: true },
  { email: 'angela.okafor@ontario.ca', isAdmin: false },
  { email: 'marcus.chen@ontario.ca', isAdmin: false },
  { email: 'fatima.alrashid@ontario.ca', isAdmin: false },
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

/** The list of accounts to show in the mock Teams account picker. */
export function getTeamsAccounts(): TeamsAccount[] {
  return TEAMS_ACCOUNT_EMAILS.flatMap(({ email, isAdmin }) => {
    const user = backend.findUserByEmail(email);
    if (!user) return [];
    return [
      {
        email: user.email,
        name: user.name,
        title: user.title,
        initials: initialsFromName(user.name),
        isAdmin,
      },
    ];
  });
}

/**
 * Sign in via the mock Teams SSO flow. Any @ontario.ca account is accepted:
 * seeded/existing profiles sign straight in, and any other address gets a fresh
 * directory profile created on the fly (mirroring first-time SSO provisioning).
 */
export function loginWithTeams(email: string): { userId: number } {
  const cleanEmail = email.trim().toLowerCase();

  if (!isOntarioEmail(cleanEmail)) {
    throw new AuthError(`Only @${ALLOWED_DOMAIN} accounts can access ConnectOPS.`);
  }

  // 1) A locally-registered account from a previous session.
  const account = findAccount(cleanEmail);
  if (account) {
    backend.registerUser(account.user);
    setSessionUserId(account.user.id);
    return { userId: account.user.id };
  }

  // 2) A seeded directory profile — sign straight in.
  const existing = backend.findUserByEmail(cleanEmail);
  if (existing) {
    setSessionUserId(existing.id);
    return { userId: existing.id };
  }

  // 3) First-time sign-in — provision a fresh profile from the email.
  const derivedName = cleanEmail
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const user = backend.createUser(buildNewUserProfile(derivedName || 'OPS Employee', cleanEmail));
  const accounts = loadAccounts();
  accounts.push({
    email: cleanEmail,
    name: user.name,
    passwordHash: '',
    user,
  });
  saveAccounts(accounts);
  setSessionUserId(user.id);
  return { userId: user.id };
}
