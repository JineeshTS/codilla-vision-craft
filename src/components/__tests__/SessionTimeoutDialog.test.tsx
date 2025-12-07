import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { SessionTimeoutDialog } from '../shared/SessionTimeoutDialog';

describe('SessionTimeoutDialog', () => {
  const mockOnExtend = vi.fn();
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render content when not open', () => {
    const { queryByText } = render(
      <SessionTimeoutDialog 
        open={false} 
        secondsRemaining={300}
        onExtend={mockOnExtend} 
        onLogout={mockOnLogout} 
      />
    );
    
    expect(queryByText(/Session Timeout Warning/i)).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    const { getByText } = render(
      <SessionTimeoutDialog 
        open={true} 
        secondsRemaining={300}
        onExtend={mockOnExtend} 
        onLogout={mockOnLogout} 
      />
    );
    
    expect(getByText(/Session Timeout Warning/i)).toBeInTheDocument();
  });

  it('should display formatted time remaining', () => {
    const { getByText } = render(
      <SessionTimeoutDialog 
        open={true} 
        secondsRemaining={65}
        onExtend={mockOnExtend} 
        onLogout={mockOnLogout} 
      />
    );
    
    expect(getByText(/1:05/)).toBeInTheDocument();
  });

  it('should have Stay Logged In button', () => {
    const { getByText } = render(
      <SessionTimeoutDialog 
        open={true} 
        secondsRemaining={300}
        onExtend={mockOnExtend} 
        onLogout={mockOnLogout} 
      />
    );
    
    expect(getByText('Stay Logged In')).toBeInTheDocument();
  });

  it('should have Log Out button', () => {
    const { getByText } = render(
      <SessionTimeoutDialog 
        open={true} 
        secondsRemaining={300}
        onExtend={mockOnExtend} 
        onLogout={mockOnLogout} 
      />
    );
    
    expect(getByText('Log Out Now')).toBeInTheDocument();
  });
});
