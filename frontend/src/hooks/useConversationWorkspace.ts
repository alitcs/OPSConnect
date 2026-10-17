import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, Conversation } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export interface ConversationOperations {
  list: () => Promise<Conversation[]>;
  get: (id: string) => Promise<{ messages: ChatMessage[] }>;
  send: (text: string, conversationId?: string) => Promise<{
    conversationId: string;
    message: ChatMessage;
  }>;
  remove: (id: string) => Promise<void>;
  loadError: string;
  openError: string;
  deleteError: string;
  sendError: string;
}

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useConversationWorkspace(operations: ConversationOperations) {
  const { currentUser } = useAuth();
  const { notify } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const streamTimer = useRef<number | null>(null);
  const selectionSequence = useRef(0);

  const stopStream = useCallback(() => {
    if (streamTimer.current !== null) {
      window.clearInterval(streamTimer.current);
      streamTimer.current = null;
    }
    setStreamingId(null);
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await operations.list());
    } catch {
      notify(operations.loadError, 'error');
    }
  }, [notify, operations]);

  useEffect(() => {
    void loadConversations();
  }, [currentUser?.id, loadConversations]);

  useEffect(() => () => {
    if (streamTimer.current !== null) window.clearInterval(streamTimer.current);
  }, []);

  const presentAssistant = useCallback((full: ChatMessage, onComplete?: (message: ChatMessage) => void) => {
    const tokens = full.text ? full.text.split(/(\s+)/) : [];
    if (prefersReducedMotion || tokens.length <= 1) {
      setMessages((current) => [...current, full]);
      onComplete?.(full);
      return;
    }

    setMessages((current) => [...current, { ...full, text: '', people: [], followUps: [] }]);
    setStreamingId(full.id);
    let index = 0;
    streamTimer.current = window.setInterval(() => {
      index += 1;
      const partial = tokens.slice(0, index).join('');
      setMessages((current) => current.map((message) =>
        message.id === full.id ? { ...message, text: partial } : message,
      ));
      if (index >= tokens.length) {
        if (streamTimer.current !== null) window.clearInterval(streamTimer.current);
        streamTimer.current = null;
        setMessages((current) => current.map((message) => message.id === full.id ? full : message));
        setStreamingId(null);
        onComplete?.(full);
      }
    }, 22);
  }, []);

  const selectConversation = useCallback(async (id: string) => {
    const sequence = ++selectionSequence.current;
    stopStream();
    setActiveId(id);
    setSidebarOpen(false);
    setLoadingThread(true);
    try {
      const { messages: threadMessages } = await operations.get(id);
      if (selectionSequence.current === sequence) setMessages(threadMessages);
    } catch {
      if (selectionSequence.current === sequence) {
        notify(operations.openError, 'error');
        setMessages([]);
      }
    } finally {
      if (selectionSequence.current === sequence) setLoadingThread(false);
    }
  }, [notify, operations, stopStream]);

  const newChat = useCallback(() => {
    selectionSequence.current += 1;
    stopStream();
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
    setLoadingThread(false);
  }, [stopStream]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await operations.remove(id);
      if (activeId === id) newChat();
      void loadConversations();
    } catch {
      notify(operations.deleteError, 'error');
    }
  }, [activeId, loadConversations, newChat, notify, operations]);

  const sendMessage = useCallback(async (
    text: string,
    onReplyComplete?: (message: ChatMessage) => void,
  ) => {
    if (sending || !text.trim()) return;
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeId ?? 'pending',
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setSending(true);
    try {
      const response = await operations.send(text, activeId ?? undefined);
      if (!activeId) {
        setActiveId(response.conversationId);
        void loadConversations();
      }
      presentAssistant(response.message, onReplyComplete);
    } catch {
      setMessages((current) => current.filter((message) => message.id !== optimistic.id));
      notify(operations.sendError, 'error');
    } finally {
      setSending(false);
    }
  }, [activeId, loadConversations, notify, operations, presentAssistant, sending]);

  return {
    conversations,
    activeId,
    messages,
    sending,
    loadingThread,
    sidebarOpen,
    setSidebarOpen,
    streamingId,
    selectConversation,
    newChat,
    deleteConversation,
    sendMessage,
  };
}