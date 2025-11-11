import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthGuard } from '../useAuthGuard';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('useAuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null authentication state', () => {
    const { result } = renderHook(() => useAuthGuard());
    
    expect(result.current).toBeNull();
  });

  it('should return boolean authentication state', () => {
    const { result } = renderHook(() => useAuthGuard());
    
    // Should eventually return a boolean or null
    expect(typeof result.current === 'boolean' || result.current === null).toBe(true);
  });
});
