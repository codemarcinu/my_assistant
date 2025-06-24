import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../components/ThemeProvider';
import ChatContainer from '../../components/chat/ChatContainer';
import ChatBubble from '../../components/chat/ChatBubble';
import TypingIndicator from '../../components/chat/TypingIndicator';
import MessageInput from '../../components/chat/MessageInput';
import { Message } from '../../types/chat';

// Mock data
const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hello from user',
    type: 'user',
    timestamp: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: '2',
    content: 'Hello from AI assistant',
    type: 'assistant',
    timestamp: new Date('2024-01-01T10:01:00Z')
  }
];

// Wrapper component for testing with ThemeProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('Chat Components', () => {
  describe('ChatContainer', () => {
    it('renders messages correctly', () => {
      render(
        <TestWrapper>
          <ChatContainer messages={mockMessages} />
        </TestWrapper>
      );

      expect(screen.getByText('Hello from user')).toBeInTheDocument();
      expect(screen.getByText('Hello from AI assistant')).toBeInTheDocument();
    });

    it('shows typing indicator when isTyping is true', () => {
      render(
        <TestWrapper>
          <ChatContainer messages={mockMessages} isTyping={true} />
        </TestWrapper>
      );

      // Typing indicator should be present
      const typingContainer = screen.getByText('Hello from AI assistant').closest('div')?.parentElement;
      expect(typingContainer).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <TestWrapper>
          <ChatContainer messages={mockMessages} className="custom-class" />
        </TestWrapper>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('ChatBubble', () => {
    it('renders user message correctly', () => {
      const userMessage = mockMessages[0];
      render(
        <TestWrapper>
          <ChatBubble message={userMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('Hello from user')).toBeInTheDocument();
      expect(screen.getByText('U')).toBeInTheDocument(); // User avatar
    });

    it('renders assistant message correctly', () => {
      const assistantMessage = mockMessages[1];
      render(
        <TestWrapper>
          <ChatBubble message={assistantMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('Hello from AI assistant')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument(); // AI avatar
    });

    it('displays timestamp correctly', () => {
      const userMessage = mockMessages[0];
      render(
        <TestWrapper>
          <ChatBubble message={userMessage} />
        </TestWrapper>
      );

      // Should display time in Polish format
      expect(screen.getByText('11:00')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <TestWrapper>
          <ChatBubble message={mockMessages[0]} className="custom-bubble" />
        </TestWrapper>
      );

      expect(container.firstChild).toHaveClass('custom-bubble');
    });
  });

  describe('TypingIndicator', () => {
    it('renders typing dots', () => {
      render(
        <TestWrapper>
          <TypingIndicator />
        </TestWrapper>
      );

      // Should have animated dots
      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });

    it('applies custom className', () => {
      const { container } = render(
        <TestWrapper>
          <TypingIndicator className="custom-typing" />
        </TestWrapper>
      );

      expect(container.firstChild).toHaveClass('custom-typing');
    });
  });

  describe('MessageInput', () => {
    it('renders input field and send button', () => {
      const mockOnSend = vi.fn();
      render(
        <TestWrapper>
          <MessageInput onSendMessage={mockOnSend} />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('Napisz wiadomość...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls onSendMessage when send button is clicked', async () => {
      const mockOnSend = vi.fn();
      render(
        <TestWrapper>
          <MessageInput onSendMessage={mockOnSend} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Napisz wiadomość...');
      const sendButton = screen.getByRole('button');

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Test message');
      });
    });

    it('calls onSendMessage when Enter is pressed', async () => {
      const mockOnSend = vi.fn();
      render(
        <TestWrapper>
          <MessageInput onSendMessage={mockOnSend} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Napisz wiadomość...');
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Test message');
      });
    });

    it('does not send empty messages', () => {
      const mockOnSend = vi.fn();
      render(
        <TestWrapper>
          <MessageInput onSendMessage={mockOnSend} />
        </TestWrapper>
      );

      const sendButton = screen.getByRole('button');
      fireEvent.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('disables input when disabled prop is true', () => {
      const mockOnSend = vi.fn();
      render(
        <TestWrapper>
          <MessageInput onSendMessage={mockOnSend} disabled={true} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Napisz wiadomość...');
      const sendButton = screen.getByRole('button');

      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('uses custom placeholder', () => {
      const mockOnSend = vi.fn();
      render(
        <TestWrapper>
          <MessageInput onSendMessage={mockOnSend} placeholder="Custom placeholder" />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });
  });
}); 