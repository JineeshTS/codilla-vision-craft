import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccountLockout } from '../useAccountLockout';

describe('useAccountLockout', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with no lockout', () => {
    const { result } = renderHook(() => useAccountLockout());
    
    expect(result.current.isLockedOut()).toBe(false);
    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.attempts).toBe(0);
  });

  it('should track failed attempts', () => {
    const { result } = renderHook(() => useAccountLockout());
    
    act(() => {
      result.current.recordFailedAttempt();
    });
    
    expect(result.current.attempts).toBe(1);
    expect(result.current.isLockedOut()).toBe(false);
  });

  it('should lock out after max attempts (5)', () => {
    const { result } = renderHook(() => useAccountLockout());
    
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.recordFailedAttempt();
      }
    });
    
    expect(result.current.isLockedOut()).toBe(true);
    expect(result.current.timeRemaining).toBeGreaterThan(0);
  });

  it('should reset lockout on resetAttempts', () => {
    const { result } = renderHook(() => useAccountLockout());
    
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.recordFailedAttempt();
      }
    });
    
    expect(result.current.isLockedOut()).toBe(true);
    
    act(() => {
      result.current.resetAttempts();
    });
    
    expect(result.current.isLockedOut()).toBe(false);
    expect(result.current.attempts).toBe(0);
  });

  it('should return remaining attempts', () => {
    const { result } = renderHook(() => useAccountLockout());
    
    expect(result.current.getRemainingAttempts()).toBe(5);
    
    act(() => {
      result.current.recordFailedAttempt();
      result.current.recordFailedAttempt();
    });
    
    expect(result.current.getRemainingAttempts()).toBe(3);
  });

  it('should format time remaining correctly', () => {
    const { result } = renderHook(() => useAccountLockout());
    
    expect(typeof result.current.formatTimeRemaining()).toBe('string');
  });
});
