import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../../stores/chatStore';
import { Message } from '../../types/chat';

describe('ChatStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.setState({
      messages: [],
      isLoading: false,
      error: null,
    });
  });

  it('should add a message', () => {
    const { addMessage } = useChatStore.getState();
    const messageData = {
      content: 'Hello, AI!',
      role: 'user' as const,
      timestamp: new Date('2024-06-01T12:00:00Z'),
    };
    
    addMessage(messageData);
    
    const { messages } = useChatStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Hello, AI!');
    expect(messages[0].role).toBe('user');
    expect(messages[0].id).toBeDefined();
  });

  it('should clear messages', () => {
    const { addMessage, clearMessages } = useChatStore.getState();
    
    // Add a message first
    addMessage({
      content: 'Test message',
      role: 'user',
      timestamp: new Date(),
    });
    
    expect(useChatStore.getState().messages).toHaveLength(1);
    
    // Clear messages
    clearMessages();
    
    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it('should set loading state', () => {
    const { setLoading } = useChatStore.getState();
    
    setLoading(true);
    expect(useChatStore.getState().isLoading).toBe(true);
    
    setLoading(false);
    expect(useChatStore.getState().isLoading).toBe(false);
  });

  it('should set error state', () => {
    const { setError } = useChatStore.getState();
    
    setError('Test error');
    expect(useChatStore.getState().error).toBe('Test error');
    
    setError(null);
    expect(useChatStore.getState().error).toBe(null);
  });
}); 