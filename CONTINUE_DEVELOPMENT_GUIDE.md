# Continue Development Guide

This guide outlines what has been completed and what comes next in the development roadmap.

---

## ✅ Phase 1 Week 1 - COMPLETED

### Implemented Features

#### 1. **Session Timeout & Security** ✅
- [x] Session timeout after 30 minutes of inactivity
- [x] 2-minute warning before auto-logout  
- [x] Automatic activity tracking
- [x] Database function security hardening (`set search_path = public`)

**Files Modified**:
- `src/App.tsx` - Added session timeout and activity tracking hooks
- `src/hooks/useActivityTracking.ts` - NEW: Auto-updates last_active_at
- Database migration - Security fixes

#### 2. **Active Users Tracking** ✅
- [x] Database schema: `last_active_at` column in profiles
- [x] Auto-update trigger (every 5 minutes max)
- [x] Admin dashboard shows active users (last 24 hours)
- [x] Frontend activity tracking hook

**Files Modified**:
- `src/pages/Admin.tsx` - Active users query
- `src/hooks/useActivityTracking.ts` - NEW: Frontend tracking
- Database migration - Added column, trigger, index

#### 3. **Enhanced Error Handling** ✅
- [x] 429 Rate Limit errors with retry timing
- [x] 402 Insufficient Tokens with balance info
- [x] 401 Authentication with auto-redirect
- [x] User-friendly error descriptions

**Files Modified**:
- `src/components/shared/UniversalAIChat.tsx` - Improved error handling

---

## ⚠️ CRITICAL: Manual Configuration Required

### Leaked Password Protection
**Status**: ❌ NOT ENABLED (Requires Dashboard Access)

**Action Required**:
1. Open Supabase Dashboard
2. Go to: **Authentication → Providers → Email**
3. Enable **"Check for leaked passwords"**
4. Configure minimum password strength

**Documentation**: See `SECURITY_CONFIGURATION_GUIDE.md`

**Why Critical**: Users can currently set compromised passwords from data breaches.

---

## 🔄 Phase 1 Week 1 - REMAINING TASKS

### P0: Critical Fixes (Do Next)

#### 1. **Fix AI Streaming Response** 
**Priority**: 🔴 CRITICAL  
**Estimated Time**: 2-3 hours  
**Complexity**: Medium

**Issue**: SSE streaming may have incomplete responses or parsing errors  
**Location**: `supabase/functions/ai-requirements-chat/index.ts` (lines 170-253)

**Action Items**:
- [ ] Review stream transformation logic for all 3 AI models:
  - Claude (Anthropic) streaming format
  - Gemini (Google) streaming format  
  - GPT-5 (OpenAI) streaming format
- [ ] Add comprehensive error logging for debugging
- [ ] Test with actual AI calls (all 3 models)
- [ ] Handle edge cases:
  - Incomplete JSON chunks
  - Network interruptions mid-stream
  - Rate limits during streaming
- [ ] Add timeout handling (max stream duration)

**Testing Checklist**:
```bash
# Test each model separately
1. Test Claude streaming with long response
2. Test Gemini streaming with code blocks
3. Test GPT-5 streaming with markdown
4. Test network interruption handling
5. Test rate limit mid-stream
```

**Success Criteria**:
- No cut-off responses
- All formatting preserved (code blocks, markdown)
- Proper error handling for stream failures
- Clean stream closure (no memory leaks)

---

#### 2. **Improve Token Estimation Accuracy**
**Priority**: 🟡 HIGH  
**Estimated Time**: 3-4 hours  
**Complexity**: Medium-High

**Current Issue**: Using rough estimation (`text.length / 4`) causes:
- Over-charging or under-charging users
- Inaccurate token balance predictions
- Revenue leakage

**Solution**: Implement actual tokenizers

**Action Items**:
- [ ] Research tokenizer libraries:
  - `tiktoken` for OpenAI models
  - Anthropic tokenizer API
  - Google tokenizer (if available)
- [ ] Create unified token counting service
- [ ] Update all edge functions that estimate tokens:
  - `universal-ai-chat/index.ts`
  - `ai-requirements-chat/index.ts`
  - `validate-idea/index.ts`
  - `validate-phase/index.ts`
  - `generate-code/index.ts`
  - `generate-prd/index.ts`
- [ ] Add token cost preview before expensive operations
- [ ] Create token usage analytics dashboard

**Files to Modify**:
1. Create: `supabase/functions/_shared/tokenizer.ts`
2. Update: All edge functions using `estimateTokens()`
3. Create: `src/components/tokens/TokenCostPreview.tsx`
4. Update: `src/pages/Tokens.tsx` - Add usage analytics

**Example Implementation**:
```typescript
// supabase/functions/_shared/tokenizer.ts
import { encoding_for_model } from "npm:tiktoken";

export async function countTokens(text: string, model: AIModel): Promise<number> {
  switch (model) {
    case 'gpt-5':
    case 'codex':
      const enc = encoding_for_model("gpt-4");
      return enc.encode(text).length;
    
    case 'claude':
      // Use Anthropic's token counting API
      return await countClaudeTokens(text);
    
    case 'gemini':
      // Use Google's token counting API
      return await countGeminiTokens(text);
  }
}
```

---

## 📋 Phase 1 Week 2-4 - SHORT TERM PRIORITIES

### UX Enhancements

#### 3. **AI Model Selection UX**
**Priority**: 🟢 MEDIUM  
**Estimated Time**: 2 hours

**Action Items**:
- [ ] Add tooltips explaining each model:
  - Gemini: "Fast, cost-effective (default)"
  - Claude: "Best for reasoning, long context"
  - GPT-5: "Most accurate, higher cost"
- [ ] Show real-time token cost estimate
- [ ] Add model recommendation based on task type
- [ ] Display remaining token balance

**Files to Create**:
- `src/components/shared/AIModelSelector.tsx`

---

#### 4. **Better Loading States**
**Priority**: 🟢 MEDIUM  
**Estimated Time**: 3 hours

**Action Items**:
- [ ] Standardize loading skeletons across app
- [ ] Add progress indicators for long operations:
  - AI validation (multi-agent consensus)
  - Code generation
  - PRD generation
- [ ] Show estimated completion time
- [ ] Add cancelation option for long operations

**Files to Update**:
- `src/components/shared/LoadingSkeletons.tsx` - Add more variants
- Update all pages with standardized loading states

---

#### 5. **Error Boundaries Everywhere**
**Priority**: 🟢 MEDIUM  
**Estimated Time**: 2 hours

**Current**: Only Index.tsx has error boundary

**Action Items**:
- [ ] Wrap all major routes with error boundaries
- [ ] Create route-specific error fallback UIs
- [ ] Log errors to monitoring service (future: Sentry)
- [ ] Add "Report Error" button

**Files to Create**:
- `src/components/ErrorBoundary.tsx` - Enhance existing
- `src/components/shared/ErrorFallback.tsx` - Reusable fallback UI

---

### Feature Completions

#### 6. **Version History for Artifacts**
**Priority**: 🟡 HIGH  
**Estimated Time**: 6-8 hours

**Action Items**:
- [ ] Add versioning to `phase_artifacts` table
- [ ] Create version history UI component
- [ ] Add "Restore Previous Version" functionality
- [ ] Show diff between versions
- [ ] Auto-save drafts every 30 seconds

**Database Migration**:
```sql
ALTER TABLE phase_artifacts
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN previous_versions JSONB DEFAULT '[]'::jsonb;

CREATE INDEX idx_phase_artifacts_version 
ON phase_artifacts(artifact_id, version DESC);
```

**Files to Create**:
- `src/components/shared/VersionHistory.tsx`
- `src/hooks/useVersionControl.ts`

---

#### 7. **Enhanced GitHub Integration**
**Priority**: 🟢 MEDIUM  
**Estimated Time**: 8-10 hours

**Current**: Basic commit tracking

**Enhancements**:
- [ ] Branch management UI
- [ ] Pull request creation
- [ ] Code review integration
- [ ] Auto-deployment triggers (GitHub Actions)
- [ ] Sync project structure with repo

**Files to Create**:
- `src/components/github/BranchManager.tsx`
- `src/components/github/PullRequestCreator.tsx`
- New edge functions for GitHub API calls

---

#### 8. **Token Usage Analytics**
**Priority**: 🟡 HIGH  
**Estimated Time**: 4-5 hours

**Action Items**:
- [ ] Create analytics dashboard showing:
  - Usage by feature (chat, validation, code gen)
  - Usage trends over time
  - Cost breakdown
  - Optimization recommendations
- [ ] Add export to CSV
- [ ] Predict when tokens will run out
- [ ] Suggest top-up timing

**Files to Create**:
- `src/components/tokens/TokenUsageAnalytics.tsx`
- `src/components/tokens/UsageByFeature.tsx`
- Update: `src/pages/Tokens.tsx`

---

## 🧪 Testing Strategy

### Unit Tests (Not Yet Implemented)
**Priority**: 🟡 HIGH  
**Estimated Time**: 2 days

**Setup**:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

**Test Coverage Targets**:
- Utility functions: 80%+
- Custom hooks: 70%+
- Edge functions: 60%+
- Components: 50%+

**Files to Create**:
```
src/__tests__/
  ├── lib/
  │   ├── utils.test.ts
  │   ├── validation.test.ts
  │   └── security.test.ts
  ├── hooks/
  │   ├── useSessionTimeout.test.ts
  │   └── useActivityTracking.test.ts
  └── components/
      └── shared/
          └── UniversalAIChat.test.tsx
```

---

### Integration Tests
**Priority**: 🟢 MEDIUM  
**Estimated Time**: 3 days

**Test Scenarios**:
1. User signup → idea creation → validation flow
2. Token purchase → usage → balance update
3. Project creation → phase progression → GitHub commit
4. Admin access → user management → system config

---

### E2E Tests (Playwright/Cypress)
**Priority**: 🟢 MEDIUM  
**Estimated Time**: 3 days

**Critical User Journeys**:
- [ ] New user onboarding
- [ ] Idea validation with 3 AI agents
- [ ] Code generation workflow
- [ ] Token purchase flow
- [ ] Admin dashboard access

---

## 📊 Performance Optimization

### Immediate Wins (Week 2-3)

#### Query Optimization
- [ ] Add indexes for frequently queried columns
- [ ] Review slow queries in Supabase dashboard
- [ ] Implement pagination for large lists
- [ ] Add database query caching

#### Frontend Performance
- [ ] Analyze bundle size (use `vite-bundle-visualizer`)
- [ ] Lazy load heavy components (Monaco editor, charts)
- [ ] Optimize images (WebP format, lazy loading)
- [ ] Implement virtual scrolling for long lists

#### Edge Function Performance
- [ ] Add response caching for expensive operations
- [ ] Optimize token estimation (faster algorithms)
- [ ] Reduce database round trips (batch queries)
- [ ] Add edge function timeout handling

---

## 🔒 Security Hardening

### Remaining Items

#### Database
- [x] Add `set search_path = public` to all functions
- [ ] Review all RLS policies for correctness
- [ ] Add audit logging for admin actions
- [ ] Implement row-level encryption for sensitive data

#### Authentication
- [ ] Enable leaked password protection (MANUAL - see guide)
- [ ] Add 2FA for admin users
- [ ] Implement session fingerprinting
- [ ] Add suspicious login detection

#### API Security
- [ ] Add request signing for webhook endpoints
- [ ] Implement API key rotation policy
- [ ] Add CORS whitelisting for production
- [ ] Rate limit all public endpoints

---

## 📚 Documentation Needed

### User Documentation
- [ ] Getting Started Guide
- [ ] Feature Walkthroughs
- [ ] FAQ Section
- [ ] Video Tutorials

### Developer Documentation
- [ ] Architecture Overview
- [ ] Database Schema Documentation
- [ ] API Documentation (edge functions)
- [ ] Deployment Guide
- [ ] Contributing Guide

### Admin Documentation
- [ ] Admin Panel User Guide
- [ ] Security Best Practices
- [ ] Incident Response Playbook
- [ ] Monitoring & Alerting Setup

---

## 🎯 Success Metrics to Track

### Technical KPIs
- [ ] Edge function error rate < 0.1%
- [ ] P95 response time < 2s
- [ ] AI streaming success rate > 99%
- [ ] Zero security vulnerabilities
- [ ] Test coverage > 70%

### Product KPIs
- [ ] User activation rate (complete Phase 1)
- [ ] Idea → Project conversion rate
- [ ] Token purchase rate
- [ ] Phase completion rates
- [ ] User retention (D7, D30, D90)

### Business KPIs
- [ ] Monthly Active Users (MAU)
- [ ] Revenue per user
- [ ] Customer acquisition cost (CAC)
- [ ] Lifetime value (LTV)
- [ ] Net Promoter Score (NPS)

---

## 🚀 Quick Start for Next Session

### To Continue Development:

1. **Review Completed Work**:
   ```bash
   cat PHASE1_IMPLEMENTATION_COMPLETE.md
   cat SECURITY_CONFIGURATION_GUIDE.md
   ```

2. **Configure Security** (5 minutes):
   - Enable leaked password protection in Supabase dashboard
   - Follow steps in `SECURITY_CONFIGURATION_GUIDE.md`

3. **Choose Next Priority**:
   - **Option A**: Fix AI Streaming (Critical UX issue)
   - **Option B**: Improve Token Accuracy (Financial impact)
   - **Option C**: Add Version History (User request)

4. **Test Current Changes**:
   ```bash
   # Test session timeout
   # Test active user tracking in admin dashboard
   # Test AI chat error handling (try with 0 tokens)
   ```

5. **Deploy & Monitor**:
   - Deploy changes to production
   - Monitor error logs for any issues
   - Check admin dashboard for active users metric

---

## 📞 Need Help?

### Common Issues

**Issue: Session timeout not working**
- Check: Are you using `AppContent` component properly?
- Verify: Activity events are being tracked
- Test: Try with 1-minute timeout for quick testing

**Issue: Active users showing 0**
- Check: Is `last_active_at` updating in database?
- Verify: Activity tracking hook is loaded
- Test: Update your profile manually and check count

**Issue: AI chat errors**
- Check: Token balance > 0
- Verify: AI provider API keys are set
- Test: Check edge function logs

---

**Last Updated**: 2025-11-05  
**Phase**: 1 Week 1 (Partial Complete)  
**Next Review**: After fixing AI streaming + token accuracy
