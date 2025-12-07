import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CookieConsentBanner } from '../shared/CookieConsentBanner';

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderBanner = () => {
    return render(
      <BrowserRouter>
        <CookieConsentBanner />
      </BrowserRouter>
    );
  };

  it('should show banner when no consent is stored', () => {
    const { getByText } = renderBanner();
    
    expect(getByText(/We use cookies/i)).toBeInTheDocument();
  });

  it('should hide banner when consent was previously accepted', () => {
    localStorage.setItem('cookie-consent', 'accepted');
    const { queryByText } = renderBanner();
    
    expect(queryByText(/We use cookies/i)).not.toBeInTheDocument();
  });

  it('should hide banner when consent was previously declined', () => {
    localStorage.setItem('cookie-consent', 'declined');
    const { queryByText } = renderBanner();
    
    expect(queryByText(/We use cookies/i)).not.toBeInTheDocument();
  });

  it('should have Accept and Decline buttons', () => {
    const { getByText } = renderBanner();
    
    expect(getByText('Accept')).toBeInTheDocument();
    expect(getByText('Decline')).toBeInTheDocument();
  });

  it('should have a link to cookie policy', () => {
    const { getByText } = renderBanner();
    
    const link = getByText('cookie policy');
    expect(link).toHaveAttribute('href', '/cookie-policy');
  });
});
