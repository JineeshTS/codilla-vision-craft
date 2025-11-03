# Complete User Journeys - Codilla.ai

## Overview
This document maps ALL user journeys from signup to app deployment, identifying gaps and required implementations.

---

## Journey 1: NEW USER ONBOARDING

### Flow:
```
Landing Page → Sign Up → Email Verification → Welcome Email → Dashboard (First Time)
```

### Detailed Steps:

**1.1 Landing on Index Page** (`/`)
- User sees hero section with value proposition
- Views 10-Phase Framework timeline
- Sees features, pricing, testimonials
- **ACTION:** Clicks "Get Started" or "Sign Up"

**1.2 Sign Up Process** (`/auth`)
- User enters: Full Name, Email, Password
- Password strength indicator shows
- Client-side validation (Zod schema)
- Submits form
- **BACKEND:** Creates user in Supabase Auth
- **BACKEND:** Creates profile with 100 welcome tokens
- **BACKEND:** Sends welcome email (if enabled)
- **UI:** Shows "Check your email to verify" message

**1.3 Email Verification**
- User receives email from Supabase
- Clicks verification link
- Redirects to `/dashboard`

**1.4 First Dashboard Visit**
- User sees:
  - Welcome message
  - Token balance: 100 tokens
  - Empty states for ideas/projects
  - Call to action: "Create Your First Idea"

**GAPS IDENTIFIED:**
- ❌ No onboarding tour/tutorial
- ❌ No "How to use tokens" explanation
- ❌ No sample idea templates
- ❌ No video walkthrough
- ❌ No achievement system for first actions

---

## Journey 2: IDEA CREATION & VALIDATION

### Flow:
```
Dashboard → New Idea → Fill Form → Submit → AI Validation (3 agents) → View Results → Decision
```

### Detailed Steps:

**2.1 Navigate to New Idea** (`/ideas/new`)
- From Dashboard: Click "Create Your First Idea"
- From Ideas page: Click "New Idea" button
- Arrives at idea creation form

**2.2 Fill Idea Form**
- **Required Fields:**
  - Title (min 5 chars)
  - Description (min 20 chars)
- **Optional Fields:**
  - Problem Statement
  - Target Audience
  - Unique Value Proposition
- Form validation shows errors in real-time
- Character counters displayed

**2.3 Save as Draft**
- User can save without validation
- Idea status: "draft"
- Tokens: 0 spent
- Can edit later

**2.4 Submit for Validation**
- User clicks "Validate Idea" button
- **UI:** Shows loading state
- **CHECK:** User has ≥150 tokens
- **BACKEND:** Calls `validate-idea` edge function
- **AI PROCESSING:**
  - Claude 3.5 Sonnet analyzes → score, feedback, approved
  - Gemini 2.0 Flash analyzes → score, feedback, approved
  - GPT-4o analyzes → score, feedback, approved
  - Consensus calculation (2/3 must approve)
- **BACKEND:** Deducts 150 tokens
- **BACKEND:** Updates idea with results

**2.5 View Validation Results** (`/ideas/:id`)
- **IF CONSENSUS REACHED:**
  - ✅ Green banner: "Consensus Reached!"
  - Average score displayed (e.g., 87/100)
  - Individual agent feedback cards:
    - Claude's verdict (score, strengths, concerns, recommendations)
    - Gemini's verdict
    - Codex's verdict
  - **ACTION:** "Convert to Project" button enabled

- **IF CONSENSUS NOT REACHED:**
  - ⚠️ Yellow/red banner: "Consensus Not Reached"
  - Average score displayed (e.g., 52/100)
  - Agent feedback showing issues
  - **ACTION:** "Edit & Revalidate" button

**GAPS IDENTIFIED:**
- ❌ No side-by-side comparison of 3 agents
- ❌ No explanation of why consensus failed
- ❌ No guided improvement suggestions
- ❌ No historical validation attempts tracking
- ❌ No export/share validation report

---

## Journey 3: PROJECT CREATION & PHASE PROGRESSION

### Flow:
```
Validated Idea → Create Project → Phase 1 Start → Submit Deliverable → AI Validation →
Phase Complete → Phase 2 Start → ... → Phase 10 Complete → App Deployed
```

### Detailed Steps:

**3.1 Create Project from Validated Idea** (`/ideas/:id`)
- User clicks "Convert to Project" button
- **UI:** Modal appears: "Create Project"
  - Project name (pre-filled with idea title)
  - Optional: Repository URL
  - Optional: Deployment URL
- User confirms
- **BACKEND:** Creates project record
- **BACKEND:** Creates 10 phase records (all status: "pending")
- **BACKEND:** Sets current_phase = 1, progress = 0%
- **UI:** Redirects to `/projects/:id`

**3.2 Project Dashboard** (`/projects/:id`)
- **Top Section:**
  - Project name
  - Current phase: 1/10
  - Progress bar: 10%
  - Repository link (if provided)
  - Deployment link (if provided)

- **Phase List:**
  - All 10 phases displayed
  - Phase 1: Status "pending", "Start Phase" button enabled
  - Phases 2-10: Status "pending", buttons disabled (locked)

**3.3 Start Phase 1** (Idea Capture & Screening)
- User clicks "Start Phase" button on Phase 1 card
- **UI:** Dialog opens:
  - Title: "Submit Phase 1: Idea Capture & Screening"
  - Description: "Describe your deliverables..."
  - Large textarea with placeholder examples
  - Character counter (min 50 chars)
- User types deliverables
- Clicks "Submit for Validation"

**3.4 Phase Validation Process**
- **UI:** Button shows "Validating with AI..."
- **BACKEND:** Phase status → "in_progress"
- **BACKEND:** Calls `validate-phase` edge function
- **AI PROCESSING:**
  - Claude validates deliverable → score, feedback
  - Gemini validates deliverable → score, feedback
  - GPT-4o validates deliverable → score, feedback
  - Consensus calculation (2/3 must approve)
- **BACKEND:** Deducts 100 tokens
- **BACKEND:** Updates phase record

**3.5 Phase Validation Results**
- **IF CONSENSUS REACHED:**
  - ✅ Toast: "Consensus Reached! 🎉 Average score: 85/100"
  - Phase status → "completed"
  - Phase card shows green checkmark
  - Current phase → 2
  - Progress → 10%
  - Phase 2 "Start Phase" button enabled

- **IF CONSENSUS NOT REACHED:**
  - ⚠️ Toast: "Consensus Not Reached. Score: 45/100"
  - Phase status → "failed"
  - Phase card shows retry button
  - User can view detailed feedback
  - Can retry unlimited times (costs 100 tokens each)

**3.6 Repeat for Phases 2-10**
- User progresses through each phase:
  - Phase 2: Validation & Research
  - Phase 3: Product Definition
  - Phase 4: Technical Planning
  - Phase 5: Design & Prototype
  - Phase 6: Development Preparation
  - Phase 7: AI-Assisted Development
  - Phase 8: Launch Preparation
  - Phase 9: Deployment & Go-Live
  - Phase 10: Post-Launch Operations

**3.7 Project Completion**
- All 10 phases completed
- Progress: 100%
- **UI:** Celebration animation
- Project status: "completed"
- User can:
  - View deployment
  - Download project summary
  - Share success story
  - Start new project

**GAPS IDENTIFIED:**
- ❌ No phase deliverable templates/examples per phase
- ❌ No AI assistant to help write deliverables
- ❌ No file upload for phases (screenshots, code, docs)
- ❌ No phase validation details modal (to see all 3 agents)
- ❌ No phase timeline visualization
- ❌ No phase collaboration (team members)
- ❌ No phase rollback/undo
- ❌ No export project report
- ❌ No celebration/completion screen
- ❌ No certificate of completion

---

## Journey 4: TOKEN MANAGEMENT

### Flow:
```
Dashboard → Check Balance → Low Balance Warning → Purchase Tokens →
Payment → Tokens Credited → Continue Using
```

### Detailed Steps:

**4.1 Check Token Balance**
- Visible on:
  - Navbar (all pages)
  - Dashboard
  - `/tokens` page (detailed view)

**4.2 Token Usage**
- **Idea Validation:** -150 tokens
- **Phase Validation:** -100 tokens per phase
- **Code Generation:** -50 tokens (if feature exists)
- Transaction history shows all usage

**4.3 Low Balance Warning**
- When tokens < 200:
  - Warning badge on navbar
  - Toast notification: "Running low on tokens"
  - Suggestion to purchase more

**4.4 Purchase Tokens** (`/tokens`)
- User sees 3 packages:
  - Starter: 1,000 tokens for ₹999
  - Pro: 5,000 tokens for ₹4,499 ⭐ Popular
  - Enterprise: 10,000 tokens for ₹7,999
- User clicks "Purchase" button
- **IF PAYMENTS NOT CONFIGURED:**
  - Toast: "Payments not configured"
- **IF PAYMENTS CONFIGURED:**
  - Razorpay checkout modal opens
  - User completes payment
  - **BACKEND:** `create-payment-order` creates order
  - **BACKEND:** `verify-payment` verifies signature
  - **BACKEND:** Credits tokens to user
  - **BACKEND:** Creates transaction record
  - **UI:** Toast: "Successfully added 1,000 tokens!"
  - Balance updates in real-time

**4.5 Transaction History** (`/tokens`)
- Shows all transactions:
  - Purchases (green, +tokens)
  - Consumption (red, -tokens)
  - Bonuses (blue, +tokens)
  - Refunds (if any)
- Each entry shows:
  - Date/time
  - Type
  - Amount
  - Balance after
  - Description

**GAPS IDENTIFIED:**
- ❌ No token subscription plans
- ❌ No bulk discount notifications
- ❌ No referral program (earn tokens)
- ❌ No token expiry warnings
- ❌ No spending insights/analytics
- ❌ No budget limits or alerts
- ❌ No invoice generation
- ❌ No refund request UI

---

## Journey 5: ADMIN MANAGEMENT

### Flow:
```
Admin Login → Admin Dashboard → Manage Users → Manage Content →
View Analytics → Moderate → Take Actions
```

### Detailed Steps:

**5.1 Admin Access**
- Admin logs in (normal auth)
- **BACKEND:** Checks `user_roles` table for role="admin"
- **UI:** Navbar shows "Admin" dropdown
- Admin pages accessible:
  - `/admin/dashboard`
  - `/admin/users`
  - `/admin/content`

**5.2 Admin Dashboard** (`/admin/dashboard`)
- **Metrics Cards:**
  - Total Users
  - Total Ideas
  - Total Projects
  - Token Usage
- **Charts:**
  - User growth over time
  - Idea validation success rate
  - Token consumption trends
  - Phase completion rates
- **Recent Activity:**
  - Latest signups
  - Latest idea validations
  - Latest phase completions

**5.3 User Management** (`/admin/users`)
- **User List:**
  - All users with: name, email, role, tokens, join date
  - Search/filter users
  - Sort by various fields
- **Actions:**
  - View user details
  - Grant/revoke admin role
  - Add bonus tokens
  - Suspend/ban user
  - View user's ideas/projects

**5.4 Content Management** (`/admin/content`)
- **Ideas Tab:**
  - All ideas with: title, status, consensus score, user
  - Filter by status
  - View idea details
  - Delete inappropriate ideas
- **Templates Tab:**
  - Idea templates for users
  - Add/edit/delete templates
  - Mark as featured

**GAPS IDENTIFIED:**
- ❌ No admin notifications/alerts
- ❌ No audit log of admin actions
- ❌ No user impersonation (for support)
- ❌ No bulk operations (bulk token grant, etc.)
- ❌ No email blast to users
- ❌ No content moderation queue
- ❌ No reports/flags from users
- ❌ No system health monitoring
- ❌ No AI usage cost tracking

---

## Journey 6: PROFILE & SETTINGS

### Flow:
```
Any Page → Profile → Update Info → Save → Settings → Configure → Logout
```

**GAPS IDENTIFIED:**
- ❌ Profile page exists but limited
- ❌ No avatar upload
- ❌ No bio/description
- ❌ No social links
- ❌ No notification preferences
- ❌ No email preferences
- ❌ No 2FA setup
- ❌ No API key generation
- ❌ No theme selection (dark/light)
- ❌ No timezone settings
- ❌ No language selection
- ❌ No account deletion

---

## Journey 7: SUPPORT & HELP

### Flow:
```
Any Page → Help/FAQ → Search → View Article → Contact Support → Ticket
```

**GAPS IDENTIFIED:**
- ✅ Privacy page exists
- ✅ Terms page exists
- ❌ No FAQ page
- ❌ No help center/docs
- ❌ No contact form
- ❌ No live chat
- ❌ No support tickets system
- ❌ No video tutorials
- ❌ No API documentation
- ❌ No community forum

---

## CRITICAL MISSING FEATURES

### High Priority:
1. **Phase Validation Details Modal** - Show all 3 AI agent responses side-by-side
2. **Phase Deliverable Examples** - Per-phase templates and examples
3. **Token Low Balance Warning System** - Proactive alerts
4. **File Upload for Phases** - Allow users to upload screenshots, docs, code
5. **Project Completion Celebration** - Celebratory screen when all phases done
6. **Better Error Handling** - What happens when AI fails, timeouts, etc.

### Medium Priority:
7. **Onboarding Tour** - First-time user walkthrough
8. **Idea Templates Library** - Pre-made idea templates
9. **Phase Timeline Visualization** - Gantt chart or timeline view
10. **Export Project Report** - PDF/HTML export of entire project
11. **Admin Analytics Dashboard** - Deeper insights for admins
12. **Notification System** - Email + in-app notifications

### Low Priority:
13. **Team Collaboration** - Invite team members to projects
14. **API Access** - Public API for integrations
15. **Referral Program** - Earn tokens by referring friends
16. **Achievement Badges** - Gamification
17. **Community Forum** - User discussions
18. **Help Center** - Documentation and FAQs

---

## UI/UX ISSUES TO FIX

### Navigation Issues:
- ❌ No breadcrumbs on deep pages
- ❌ Mobile menu may have issues
- ❌ No keyboard shortcuts
- ❌ No search functionality (global search)

### Feedback Issues:
- ❌ Loading states inconsistent
- ❌ Error messages not always helpful
- ❌ Success animations missing in places
- ❌ No undo functionality anywhere

### Accessibility Issues:
- ⚠️ Some ARIA labels missing
- ⚠️ Keyboard navigation not fully tested
- ⚠️ Color contrast may need checking
- ⚠️ Screen reader support unknown

---

## IMPLEMENTATION PRIORITY

### MUST HAVE (Before Launch):
1. ✅ Complete 10-phase validation (DONE)
2. ✅ Token deduction working (DONE)
3. ✅ Phase submission UI (DONE)
4. 🔲 Phase validation details modal
5. 🔲 Phase deliverable examples/templates
6. 🔲 File upload for phases
7. 🔲 Better error handling throughout
8. 🔲 Token low balance warnings
9. 🔲 Project completion screen

### SHOULD HAVE (Post-Launch v1.1):
10. 🔲 Onboarding tour
11. 🔲 Idea templates library
12. 🔲 Export project reports
13. 🔲 Email notifications
14. 🔲 Admin analytics improvements
15. 🔲 Help center/FAQ

### NICE TO HAVE (Future):
16. 🔲 Team collaboration
17. 🔲 API access
18. 🔲 Referral program
19. 🔲 Achievement system
20. 🔲 Community features

---

## NEXT STEPS

Based on this analysis, we need to implement the "MUST HAVE" items immediately:

1. Create Phase Validation Details Modal component
2. Add phase-specific deliverable templates
3. Implement file upload functionality
4. Create comprehensive error handling
5. Add token warning system
6. Build project completion celebration screen

These will complete the core user journeys and make the product truly production-ready.
