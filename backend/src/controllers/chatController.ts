import type { Request, Response } from 'express';
import {
  addChatMessage,
  createConversation,
  deleteConversation,
  getConversationById,
  getConversationsForUser,
  getMessagesForConversation,
} from '../data/store.js';
import { generateReply } from '../services/mockAIService.js';

/** GET /api/chat/conversations — list conversations for the current user. */
export function listConversations(req: Request, res: Response): void {
  res.json(getConversationsForUser(req.currentUser.id));
}

/** GET /api/chat/conversations/:id — messages in a conversation. */
export function getConversation(req: Request, res: Response): void {
  const conversation = getConversationById(req.params.id);
  if (!conversation || conversation.userId !== req.currentUser.id) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json({
    conversation,
    messages: getMessagesForConversation(conversation.id),
  });
}

/** POST /api/chat/conversations — create an empty conversation. */
export function newConversation(req: Request, res: Response): void {
  const title = (req.body?.title as string) || 'New chat';
  const conversation = createConversation(req.currentUser.id, title);
  res.status(201).json(conversation);
}

/** DELETE /api/chat/conversations/:id — delete a conversation. */
export function removeConversation(req: Request, res: Response): void {
  const conversation = getConversationById(req.params.id);
  if (!conversation || conversation.userId !== req.currentUser.id) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  deleteConversation(conversation.id);
  res.status(204).end();
}

/**
 * POST /api/chat — send a message to the AI.
 * Body: { message: string, conversationId?: string }
 * Creates a conversation on the fly if none is provided.
 */
export function sendMessage(req: Request, res: Response): void {
  const text = (req.body?.message as string)?.trim();
  if (!text) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  let conversationId = req.body?.conversationId as string | undefined;
  if (conversationId) {
    const existing = getConversationById(conversationId);
    if (!existing || existing.userId !== req.currentUser.id) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
  } else {
    // Title the new conversation after the first user message.
    const title = text.length > 40 ? `${text.slice(0, 40)}…` : text;
    conversationId = createConversation(req.currentUser.id, title).id;
  }

  // Store the user's message.
  addChatMessage({ conversationId, role: 'user', text });

  // Generate and store the AI reply.
  const reply = generateReply(text);
  const assistantMessage = addChatMessage({
    conversationId,
    role: 'assistant',
    text: reply.text,
    people: reply.people,
    followUps: reply.followUps,
  });

  res.json({ conversationId, message: assistantMessage });
}
