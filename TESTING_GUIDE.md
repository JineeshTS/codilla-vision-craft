# Comprehensive Testing Guide - Codilla.ai

This guide covers all testing procedures for Codilla.ai before production deployment.

## Table of Contents
1. [Manual Testing Checklist](#manual-testing-checklist)
2. [Automated Testing Setup](#automated-testing-setup)
3. [Performance Testing](#performance-testing)
4. [Security Testing](#security-testing)
5. [Browser Compatibility](#browser-compatibility)
6. [Mobile Responsiveness](#mobile-responsiveness)
7. [API Testing](#api-testing)

---

## Manual Testing Checklist

### 🔐 Authentication Flow

#### Sign Up
- [ ] Sign up with valid email and password
- [ ] Sign up with existing email (should fail)
- [ ] Sign up with weak password (should show validation)
- [ ] Sign up with invalid email format (should fail)
- [ ] Verify password strength indicator works
- [ ] Verify 10,000 tokens are credited on signup
- [ ] Check email verification email is sent
- [ ] Click email verification link
- [ ] Verify user is redirected to dashboard after verification

#### Sign In
- [ ] Sign in with valid credentials
- [ ] Sign in with invalid email (should fail)
- [ ] Sign in with wrong password (should fail)
- [ ] Sign in with unverified email (should prompt verification)
- [ ] GitHub OAuth sign in (if enabled)
- [ ] Session persists after page refresh
- [ ] Sign out works correctly

#### Password Reset
- [ ] Request password reset with valid email
- [ ] Request password reset with invalid email
- [ ] Check password reset email received
- [ ] Click reset link and change password
- [ ] Verify password strength indicator works
- [ ] Confirm passwords must match
- [ ] Sign in with new password works
- [ ] Old password no longer works

### 💡 Idea Management

#### Create Idea
- [ ] Navigate to "New Idea" page
- [ ] Fill out Step 1 (Basics) - title, description, category
- [ ] Fill out Step 2 (Problem) - problem statement, target audience
- [ ] Fill out Step 3 (Solution) - unique value proposition
- [ ] Verify all required fields are validated
- [ ] Submit idea successfully
- [ ] Verify idea appears in ideas list
- [ ] Check idea status is "draft"

#### Validate Idea
- [ ] Click "Start Validation" on an idea
- [ ] Verify token deduction (150 tokens)
- [ ] Watch status change to "validating"
- [ ] Wait for validation to complete (3 AI agents)
- [ ] Verify consensus score is displayed
- [ ] Check individual agent scores (Claude, Gemini, Codex)
- [ ] Read detailed feedback from each agent
- [ ] Verify status changes to "validated"

#### Edit Idea
- [ ] Edit idea title and description
- [ ] Update problem statement
- [ ] Change category
- [ ] Save changes successfully
- [ ] Verify changes persist after page refresh

#### Delete Idea
- [ ] Click delete on an idea
- [ ] Confirm deletion dialog appears
- [ ] Cancel deletion (idea should remain)
- [ ] Delete again and confirm (idea should be removed)
- [ ] Verify idea no longer in list

### 🚀 Project Management

#### Create Project
- [ ] Create project from validated idea
- [ ] Verify project has all 10 phases
- [ ] Check phase 1 is marked as pending
- [ ] Verify project appears in projects list

#### Phase Navigation
- [ ] Navigate to project detail page
- [ ] View all 10 phases
- [ ] Click on Phase 1 (Idea Capture)
- [ ] Complete Phase 1 tasks
- [ ] Start validation for Phase 1
- [ ] Verify consensus from 3 AI agents
- [ ] Move to Phase 2 after validation passes
- [ ] Repeat for subsequent phases

#### Phase 2: Business Validation
- [ ] Fill out market research data
- [ ] Add competitive landscape info
- [ ] Define target audience demographics
- [ ] Submit for validation
- [ ] Verify validation score calculated correctly

#### Phase 3: Product Definition
- [ ] Generate PRD (Product Requirements Document)
- [ ] Create user stories
- [ ] Define feature specifications
- [ ] Review and edit generated content
- [ ] Save and proceed

#### Phase 7: AI-Assisted Development
- [ ] Generate code with AI
- [ ] Select AI model (Claude/Gemini/Codex)
- [ ] Provide context and requirements
- [ ] Verify streaming code generation works
- [ ] Copy generated code
- [ ] Run code review analysis
- [ ] Check for security issues
- [ ] Check for performance suggestions

### 💰 Token Management

#### View Token Balance
- [ ] Check token balance in navbar
- [ ] View total tokens
- [ ] View tokens used
- [ ] Check transaction history

#### Purchase Tokens
- [ ] Navigate to Tokens page
- [ ] Select a package (1K, 5K, or 10K tokens)
- [ ] Click "Purchase" button
- [ ] Razorpay modal opens
- [ ] Complete payment (test mode)
- [ ] Verify payment success message
- [ ] Check token balance updated
- [ ] Verify transaction in history
- [ ] Check payment transaction recorded

#### Token Consumption
- [ ] Validate idea (costs 150 tokens)
- [ ] Validate phase (costs ~100 tokens)
- [ ] Use phase task chat (variable cost)
- [ ] Generate code (variable cost)
- [ ] Verify token deduction for each action
- [ ] Check "tokens used" updates correctly

### 📋 Templates

#### Browse Templates
- [ ] Navigate to Templates page
- [ ] View all 6 templates
- [ ] Search for specific template
- [ ] Filter by category
- [ ] Click on template to view details

#### Apply Template
- [ ] Click "Use This Template"
- [ ] Verify pre-filled idea data
- [ ] Customize template data
- [ ] Create idea from template
- [ ] Check usage count incremented

### 👤 User Profile

- [ ] View profile information
- [ ] Update full name
- [ ] Update avatar (if implemented)
- [ ] Save profile changes
- [ ] Verify changes persist

### 🔧 Admin Features (Admin Users Only)

- [ ] Access admin dashboard
- [ ] View user analytics
- [ ] View system statistics
- [ ] Access admin settings
- [ ] Update configuration
- [ ] View all users' data

### 🎨 UI/UX

#### General
- [ ] All buttons have hover states
- [ ] Loading indicators display during async operations
- [ ] Toast notifications appear for user actions
- [ ] Error messages are clear and helpful
- [ ] Success messages are encouraging
- [ ] Cosmic theme is consistent throughout

#### Navigation
- [ ] Navbar displays correctly
- [ ] Active page is highlighted in navbar
- [ ] Logo links to homepage
- [ ] User menu works (dropdown)
- [ ] Sign out from navbar works
- [ ] Mobile hamburger menu works (if implemented)

#### Forms
- [ ] All form fields have labels
- [ ] Required fields are marked
- [ ] Validation errors display inline
- [ ] Form submission disabled during loading
- [ ] Success/error feedback after submission

---

## Automated Testing Setup

### Unit Tests (To Be Implemented)

Install testing dependencies:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Example Test Cases

#### Authentication Tests
```typescript
// src/__tests__/Auth.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Auth from '@/pages/Auth';

describe('Auth Component', () => {
  it('renders sign in form', () => {
    render(<Auth />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<Auth />);
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('shows password strength indicator', () => {
    render(<Auth />);
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    expect(screen.getByText(/password strength/i)).toBeInTheDocument();
  });
});
```

#### Idea Validation Tests
```typescript
// src/__tests__/IdeaValidation.test.tsx
import { describe, it, expect } from 'vitest';
import { calculateConsensusScore } from '@/lib/phaseUtils';

describe('Idea Validation', () => {
  it('calculates consensus score correctly', () => {
    const scores = { claude: 85, gemini: 90, codex: 80 };
    const consensus = calculateConsensusScore(scores);
    expect(consensus).toBe(85); // Average of 3 scores
  });

  it('handles missing agent scores', () => {
    const scores = { claude: 85, gemini: 0, codex: 80 };
    const consensus = calculateConsensusScore(scores);
    expect(consensus).toBeGreaterThanOrEqual(0);
  });
});
```

---

## Performance Testing

### Lighthouse Audit

Run Lighthouse in Chrome DevTools:
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select categories: Performance, Accessibility, Best Practices, SEO
4. Run audit
5. Aim for scores > 90 in all categories

### Target Metrics
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 95
- **SEO**: > 95
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

### Load Testing

Use Apache Bench for basic load testing:
```bash
# Test homepage
ab -n 1000 -c 10 https://codilla.ai/

# Test API endpoint
ab -n 500 -c 5 -H "Authorization: Bearer token" https://your-supabase-url/functions/v1/validate-idea
```

---

## Security Testing

### Manual Security Checks

#### XSS Protection
- [ ] Try injecting `<script>alert('XSS')</script>` in text fields
- [ ] Verify script tags are sanitized
- [ ] Check markdown rendering doesn't execute scripts

#### SQL Injection
- [ ] Try `'; DROP TABLE users; --` in search fields
- [ ] Verify Supabase RLS prevents unauthorized access
- [ ] Check parameterized queries in Edge Functions

#### CSRF Protection
- [ ] Verify all state-changing requests require authentication
- [ ] Check CORS headers are properly configured
- [ ] Ensure POST/PUT/DELETE requests validate tokens

#### Authentication
- [ ] Try accessing protected routes without authentication
- [ ] Verify token expiration works
- [ ] Check session timeout after 30 minutes inactivity
- [ ] Test email verification enforcement
- [ ] Verify password reset tokens expire

### Security Headers Check

Use [securityheaders.com](https://securityheaders.com):
- [ ] Content-Security-Policy
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Strict-Transport-Security
- [ ] Referrer-Policy
- [ ] Permissions-Policy

### Dependency Security Audit
```bash
npm audit
npm audit fix
```

---

## Browser Compatibility

Test in the following browsers:

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Opera (latest)

### Mobile
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet

### Features to Test
- [ ] CSS Grid layouts
- [ ] Flexbox layouts
- [ ] CSS Variables (custom properties)
- [ ] Backdrop filters (glass morphism effect)
- [ ] Web fonts load correctly
- [ ] SVG icons display
- [ ] Animations work smoothly

---

## Mobile Responsiveness

### Breakpoints to Test
- [ ] Mobile: 320px - 640px
- [ ] Tablet: 641px - 1024px
- [ ] Desktop: 1025px+

### Pages to Test on Mobile
- [ ] Homepage (landing)
- [ ] Sign in / Sign up
- [ ] Dashboard
- [ ] Ideas list
- [ ] New idea form
- [ ] Idea detail
- [ ] Project list
- [ ] Project detail with phases
- [ ] Token purchase
- [ ] Templates

### Mobile-Specific Checks
- [ ] Touch targets are at least 44x44px
- [ ] Text is readable (min 16px)
- [ ] Forms are easy to fill
- [ ] Buttons are easily tappable
- [ ] Horizontal scrolling doesn't occur
- [ ] Images scale appropriately
- [ ] Navigation menu collapses on mobile
- [ ] Cards stack vertically
- [ ] Tables are responsive or scrollable

---

## API Testing

### Edge Functions to Test

Use Postman or curl:

#### 1. Validate Idea
```bash
curl -X POST https://your-project.supabase.co/functions/v1/validate-idea \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ideaId": "uuid-here"}'
```

Expected: 200 OK with consensus score

#### 2. Validate Phase
```bash
curl -X POST https://your-project.supabase.co/functions/v1/validate-phase \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phaseId": "uuid-here", "userInput": "test input"}'
```

#### 3. Generate Code
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-code \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a React button component", "model": "claude"}'
```

Expected: SSE stream with code tokens

#### 4. Create Razorpay Order
```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-razorpay-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10, "tokens": 1000}'
```

Expected: Razorpay order ID

### Error Scenarios
- [ ] Test with invalid token (401 Unauthorized)
- [ ] Test with missing parameters (400 Bad Request)
- [ ] Test rate limiting (429 Too Many Requests)
- [ ] Test with malformed JSON (400 Bad Request)

---

## Database Testing

### RLS (Row Level Security) Testing

#### Test User Isolation
```sql
-- As user A, try to access user B's data
SELECT * FROM ideas WHERE user_id != auth.uid();
-- Should return empty set

-- Try to update another user's idea
UPDATE ideas SET title = 'Hacked' WHERE user_id != auth.uid();
-- Should affect 0 rows
```

#### Test Admin Access
```sql
-- Check admin can view all users' roles
SELECT * FROM user_roles;
-- Should return all roles (admin only)
```

### Performance Testing
```sql
-- Test indexes are used
EXPLAIN ANALYZE SELECT * FROM ideas WHERE user_id = 'uuid' AND status = 'validated';
-- Should use idx_ideas_user_id_status

-- Check slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Acceptance Criteria

### Must Pass Before Production
- [ ] All authentication flows work
- [ ] Email verification functional
- [ ] Password reset functional
- [ ] All AI validations return results
- [ ] Token economy works correctly
- [ ] Payment integration functional
- [ ] No console errors in browser
- [ ] All pages load < 3 seconds
- [ ] Mobile responsive on all pages
- [ ] Security headers present
- [ ] SSL certificate active
- [ ] All database queries use indexes
- [ ] RLS policies enforce user isolation
- [ ] Error boundaries catch all errors
- [ ] Session timeout works

### Nice to Have
- [ ] Unit test coverage > 70%
- [ ] E2E tests for critical paths
- [ ] Lighthouse score > 95
- [ ] Zero npm audit vulnerabilities
- [ ] All forms have loading states
- [ ] All lists have skeleton loaders
- [ ] Comprehensive error messages

---

## Regression Testing

After any code changes, re-test:
- [ ] Critical user flows (sign up → create idea → validate → create project)
- [ ] Payment flow
- [ ] Token deduction
- [ ] AI integrations
- [ ] Authentication

---

## Bug Reporting Template

```markdown
### Bug Description
[Clear description of the bug]

### Steps to Reproduce
1. Go to...
2. Click on...
3. See error

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots
[If applicable]

### Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Device: [e.g., Desktop]
- Screen size: [e.g., 1920x1080]

### Console Errors
[Any errors from browser console]

### Additional Context
[Any other relevant information]
```

---

## Sign-Off Checklist

Before deploying to production:

- [ ] All manual tests pass
- [ ] Performance targets met
- [ ] Security audit complete
- [ ] Browser compatibility verified
- [ ] Mobile responsiveness confirmed
- [ ] API tests pass
- [ ] Database tests pass
- [ ] No critical bugs remaining
- [ ] Stakeholder approval obtained
- [ ] Backup plan ready
- [ ] Monitoring configured
- [ ] Documentation updated

---

**Testing completed by:** _______________
**Date:** _______________
**Approved for production:** ☐ Yes ☐ No
