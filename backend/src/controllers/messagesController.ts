import type { Request, Response } from 'express';
import {
  canMessage,
  getMessagesForThread,
  getThreadById,
  getThreadsForUser,
  getUserById,
  sendDirectMessage,
} from '../data/store.js';
import { toSummary } from '../services/userService.js';

/** GET /api/messages — list message threads for the current user, with the other participant. */
export function listThreads(req: Request, res: Response): void {
  const me = req.currentUser.id;
  const threads = getThreadsForUser(me).map((thread) => {
    const otherId = thread.participantIds.find((id) => id !== me)!;
    const other = getUserById(otherId);
    const messages = getMessagesForThread(thread.id);
    const last = messages[messages.length - 1];
    return {
      ...thread,
      participant: other ? toSummary(other) : null,
      lastMessage: last ? last.text : null,
      lastMessageFromMe: last ? last.fromUserId === me : false,
      needsReply: last ? last.fromUserId !== me : false,
    };
  });
  res.json(threads);
}

/** GET /api/messages/:threadId — messages in a thread. */
export function getThread(req: Request, res: Response): void {
  const thread = getThreadById(req.params.threadId);
  if (!thread || !thread.participantIds.includes(req.currentUser.id)) {
    res.status(404).json({ error: 'Thread not found' });
    return;
  }
  const me = req.currentUser.id;
  const otherId = thread.participantIds.find((id) => id !== me)!;
  const other = getUserById(otherId);
  const messages = getMessagesForThread(thread.id);
  const last = messages[messages.length - 1];
  res.json({
    thread: {
      ...thread,
      participant: other ? toSummary(other) : null,
      lastMessage: last ? last.text : null,
      lastMessageFromMe: last ? last.fromUserId === me : false,
      needsReply: last ? last.fromUserId !== me : false,
    },
    participant: other ? toSummary(other) : null,
    messages,
  });
}

/** POST /api/messages/:userId — send a message to a user (creates the thread if needed). */
export function postMessage(req: Request, res: Response): void {
  const toUserId = Number(req.params.userId);
  const text = (req.body?.text as string)?.trim();
  if (!text) {
    res.status(400).json({ error: 'text is required' });
    return;
  }
  if (!getUserById(toUserId)) {
    res.status(404).json({ error: 'Recipient not found' });
    return;
  }
  if (toUserId === req.currentUser.id) {
    res.status(400).json({ error: 'You cannot message yourself.' });
    return;
  }
  const gate = canMessage(req.currentUser.id, toUserId);
  if (!gate.ok) {
    res.status(403).json({ error: gate.reason ?? 'You cannot message this person.' });
    return;
  }
  const { thread, message } = sendDirectMessage(req.currentUser.id, toUserId, text);
  res.status(201).json({ thread, message });
}
