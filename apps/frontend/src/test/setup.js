import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Socket.IO
const mockSocket = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connected: true,
  id: 'mock-socket-id'
};

vi.mock('../lib/socket', () => ({
  default: mockSocket
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
});

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Helper functions for tests
export const mockSocketEvents = (events) => {
  mockSocket.on.mockImplementation((event, callback) => {
    if (events[event]) {
      setTimeout(() => callback(events[event]), 0);
    }
  });
};

export const triggerSocketEvent = (event, data) => {
  const callback = mockSocket.on.mock.calls.find(call => call[0] === event)?.[1];
  if (callback) {
    callback(data);
  }
};

export { mockSocket };