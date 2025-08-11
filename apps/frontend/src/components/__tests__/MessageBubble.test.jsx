import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MessageBubble from '../MessageBubble';

describe('MessageBubble', () => {
  const mockMessage = {
    id: '1',
    text: 'Hello world',
    createdAt: '2024-01-01T10:00:00Z'
  };

  it('renders message content correctly', () => {
    render(<MessageBubble message={mockMessage} isOwn={false} />);
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('renders own message with correct styling', () => {
    render(<MessageBubble message={mockMessage} isOwn={true} />);
    
    const messageContainer = screen.getByText('Hello world').parentElement;
    expect(messageContainer).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-blue-400', 'text-white');
  });

  it('renders other user message with correct styling', () => {
    render(<MessageBubble message={mockMessage} isOwn={false} />);
    
    const messageContainer = screen.getByText('Hello world').parentElement;
    expect(messageContainer).toHaveClass('bg-slate-100', 'text-slate-800');
    
    // Should show user avatar
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('displays time in correct format', () => {
    const messageWithTime = {
      ...mockMessage,
      createdAt: '2024-01-01T15:30:00Z'
    };
    
    render(<MessageBubble message={messageWithTime} isOwn={false} />);
    expect(screen.getByText('15:30')).toBeInTheDocument();
  });

  it('handles empty message gracefully', () => {
    const emptyMessage = {
      ...mockMessage,
      text: ''
    };
    
    render(<MessageBubble message={emptyMessage} isOwn={false} />);
    
    // Should not crash and should still show timestamp
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });
});