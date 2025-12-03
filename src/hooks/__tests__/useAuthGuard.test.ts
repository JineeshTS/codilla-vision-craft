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
  useLocation: () => ({ pathname: '/dashboard' }),
}));

describe('useAuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null authentication state', () => {
    const { result } = renderHook(() => useAuthGuard());
    
    expect(result.current.isAuthenticated).toBeNull();
    expect(result.current.isEmailVerified).toBeNull();
  });

  it('should return object with authentication and email verification state', () => {
    const { result } = renderHook(() => useAuthGuard());
    
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('isEmailVerified');
  });
});
