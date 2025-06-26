import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatBubble from '../../components/chat/ChatBubble';
import { Message } from '../../types/chat';
import { ThemeProvider } from '../../components/ThemeProvider';

describe('ChatBubble', () => {
  const renderBubble = (message: Message) => {
    return render(
      <ThemeProvider>
        <ChatBubble message={message} />
      </ThemeProvider>
    );
  };

  it('renders user message correctly', () => {
    const message: Message = {
      id: '1',
      content: 'Hello, AI!',
      role: 'user',
      timestamp: new Date('2024-06-01T12:00:00Z'),
    };
    renderBubble(message);
    expect(screen.getByText('Hello, AI!')).toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    const message: Message = {
      id: '2',
      content: 'Hello, user!',
      role: 'assistant',
      timestamp: new Date('2024-06-01T12:01:00Z'),
    };
    renderBubble(message);
    expect(screen.getByText('Hello, user!')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('renders timestamp', () => {
    const message: Message = {
      id: '3',
      content: 'Test',
      role: 'user',
      timestamp: new Date('2024-06-01T15:30:00Z'),
    };
    renderBubble(message);
    // Should render hour:minute in local time
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });
}); 