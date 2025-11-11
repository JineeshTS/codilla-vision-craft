import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Hero } from '../Hero';

describe('Hero Component', () => {
  it('renders hero component', () => {
    const { container } = render(
      <BrowserRouter>
        <Hero />
      </BrowserRouter>
    );
    
    expect(container.querySelector('.cosmic-bg')).toBeInTheDocument();
  });

  it('renders hero with main heading', () => {
    const { container } = render(
      <BrowserRouter>
        <Hero />
      </BrowserRouter>
    );
    
    const heading = container.querySelector('h1');
    expect(heading).toBeInTheDocument();
  });
});
