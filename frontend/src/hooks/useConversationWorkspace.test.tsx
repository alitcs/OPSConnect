// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import type { ChatMessage } from '../types';
import { useConversationWorkspace, type ConversationOperations } from './useConversationWorkspace';

const assistantMessage: ChatMessage = {
  id: 'reply-1',
  conversationId: 'conversation-1',
  role: 'assistant',
  text: 'Hello',
  createdAt: '2026-10-16T12:00:00.000Z',
};

function withProviders({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}

describe('useConversationWorkspace', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('sends a message and appends the assistant response', async () => {
    const operations: ConversationOperations = {
      list: vi.fn(async () => []),
      get: vi.fn(async () => ({ messages: [] })),
      send: vi.fn(async () => ({ conversationId: 'conversation-1', message: assistantMessage })),
      remove: vi.fn(async () => undefined),
      loadError: 'Could not load conversations.',
      openError: 'Could not open the conversation.',
      deleteError: 'Could not delete the conversation.',
      sendError: 'Could not send the message.',
    };

    const { result } = renderHook(() => useConversationWorkspace(operations), { wrapper: withProviders });
    await act(async () => result.current.sendMessage('Find a colleague'));

    expect(result.current.activeId).toBe('conversation-1');
    expect(result.current.messages.map((message) => message.role)).toEqual(['user', 'assistant']);
    expect(result.current.sending).toBe(false);
  });

  it('removes an optimistic message when sending fails', async () => {
    const operations: ConversationOperations = {
      list: vi.fn(async () => []),
      get: vi.fn(async () => ({ messages: [] })),
      send: vi.fn(() => Promise.reject(new Error('offline'))),
      remove: vi.fn(async () => undefined),
      loadError: 'Could not load conversations.',
      openError: 'Could not open the conversation.',
      deleteError: 'Could not delete the conversation.',
      sendError: 'Could not send the message.',
    };

    const { result } = renderHook(() => useConversationWorkspace(operations), { wrapper: withProviders });
    await act(async () => result.current.sendMessage('Find a colleague'));
    await waitFor(() => expect(result.current.sending).toBe(false));
    expect(result.current.messages).toEqual([]);
  });
});