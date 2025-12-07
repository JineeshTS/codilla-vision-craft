import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from '../Navbar';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

describe('Navbar', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderNavbar = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render navbar', () => {
    const { getByRole } = renderNavbar();
    
    expect(getByRole('navigation')).toBeInTheDocument();
  });

  it('should have navigation links', () => {
    const { container } = renderNavbar();
    
    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
  });
});
