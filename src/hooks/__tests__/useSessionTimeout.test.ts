import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionTimeout } from '../useSessionTimeout';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: '123' } } } })),
      signOut: vi.fn(() => Promise.resolve({})),
    },
  },
}));

describe('useSessionTimeout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with dialog closed', () => {
    const { result } = renderHook(() => useSessionTimeout());
    
    expect(result.current.showWarning).toBe(false);
  });

  it('should provide extendSession function', () => {
    const { result } = renderHook(() => useSessionTimeout());
    
    expect(typeof result.current.extendSession).toBe('function');
  });

  it('should provide logout function', () => {
    const { result } = renderHook(() => useSessionTimeout());
    
    expect(typeof result.current.logout).toBe('function');
  });
});
