# Testing Guide

This project uses Vitest and React Testing Library for testing.

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are located next to the files they test in `__tests__` directories:

- `src/components/__tests__/` - Component tests
- `src/hooks/__tests__/` - Hook tests
- `src/lib/__tests__/` - Utility function tests

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('returns expected value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBeDefined();
  });
});
```

### Validation Tests

```typescript
import { describe, it, expect } from 'vitest';
import { mySchema } from '../validation';

describe('mySchema', () => {
  it('validates correct data', () => {
    const result = mySchema.safeParse({ field: 'value' });
    expect(result.success).toBe(true);
  });
});
```

## Test Coverage Goals

- Critical paths: 80%+ coverage
- UI components: 60%+ coverage
- Utility functions: 90%+ coverage
- Edge functions: Manual testing via Postman/curl

## Mocking

### Supabase Client

```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));
```

### React Router

```typescript
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: 'test-id' }),
}));
```

## Best Practices

1. **Test user behavior, not implementation details**
2. **Use semantic queries** (getByRole, getByLabelText)
3. **Avoid testing internal state** unless necessary
4. **Mock external dependencies** (API calls, browser APIs)
5. **Keep tests isolated** - each test should be independent
6. **Use descriptive test names** - describe what the test validates

## Continuous Integration

Tests run automatically on:
- Every push to main branch
- Every pull request
- Before deployment

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
