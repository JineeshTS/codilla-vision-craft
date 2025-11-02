# Codilla.ai - Complete Technical Architecture

## 📋 Table of Contents
1. [Application Sitemap](#application-sitemap)
2. [Page Specifications](#page-specifications)
3. [Component Architecture](#component-architecture)
4. [User Flows](#user-flows)
5. [Data Flow Architecture](#data-flow-architecture)
6. [API Design](#api-design)

---

## 1. Application Sitemap

```
/ (Landing Page)
├── /auth (Authentication)
│   ├── Sign In
│   └── Sign Up
│
├── /dashboard (Main Dashboard) [AUTH REQUIRED]
│   ├── Quick Stats
│   ├── Quick Actions
│   └── Recent Activity
│
├── /ideas (Ideas Hub) [AUTH REQUIRED]
│   ├── /ideas (List View)
│   ├── /ideas/new (Capture Form)
│   └── /ideas/:id (Detail View)
│       ├── View Mode
│       ├── Edit Mode
│       ├── Validation Trigger
│       └── Create Project Action
│
├── /projects (Projects Hub) [AUTH REQUIRED]
│   ├── /projects (List View)
│   └── /projects/:id (Detail View)
│       ├── Phase Progress
│       ├── Phase Actions
│       ├── Repository Link
│       └── Deployment Link
│
├── /templates (Templates Marketplace) [AUTH REQUIRED]
│   ├── Browse Templates
│   ├── Search/Filter
│   └── Apply Template
│
├── /tokens (Token Management) [AUTH REQUIRED]
│   ├── Balance Display
│   ├── Purchase Options
│   └── Transaction History
│
├── /analytics (Analytics Dashboard) [AUTH REQUIRED]
│   ├── Success Metrics
│   ├── Token Usage
│   └── Performance Charts
│
├── /code-ide (AI Code IDE) [AUTH REQUIRED]
│   ├── Code Generator
│   ├── Model Selection
│   └── Code Examples
│
└── /404 (Not Found)
```

---

## 2. Page Specifications

### 2.1 Landing Page (`/`)

**Purpose**: Marketing page to convert visitors into users

**Components Required**:
- `Navbar` (public version)
- `Hero` - Main value proposition
- `Features` - 3 key features showcase
- `PhaseTimeline` - 10-phase framework visualization
- `Footer` (optional)

**Features**:
- Clear value proposition
- AI agent showcase (Claude, Gemini, Codex)
- Statistics (success rate, templates, phases)
- CTA buttons → /auth
- Animated cosmic background
- Glassmorphic design elements

**User Actions**:
- Click "Get Started Free" → Navigate to /auth
- Click "See How It Works" → Scroll to features
- Navigation menu → Various sections

**State Management**: None (static marketing page)

---

### 2.2 Authentication Page (`/auth`)

**Purpose**: User registration and login

**Components Required**:
- `Tabs` (Sign In / Sign Up)
- `Input` (email, password, full name)
- `Button` (submit)
- `Label`
- Form validation

**Features**:
- **Sign Up Tab**:
  - Full name input
  - Email input with validation
  - Password input (min 6 chars)
  - "Create Account" button
  - Welcome bonus notification (100 tokens)
  
- **Sign In Tab**:
  - Email input
  - Password input
  - "Sign In" button
  
- Auto-redirect if already authenticated
- Error handling for:
  - Invalid credentials
  - User already exists
  - Network errors

**User Actions**:
- Switch between Sign In/Sign Up tabs
- Submit credentials
- Auto-navigate to /dashboard on success

**State Management**:
- `loading` - form submission state
- `email`, `password`, `fullName` - form fields
- Supabase auth state listener

**Database Operations**:
- `auth.users` - Supabase Auth
- `profiles` - Auto-created via trigger
- `user_roles` - Auto-assigned 'user' role
- `token_transactions` - Welcome bonus record

---

### 2.3 Dashboard Page (`/dashboard`)

**Purpose**: Central hub showing user's activity overview

**Components Required**:
- `Navbar` (authenticated version)
- `Card` (4x stat cards)
- `Card` (3x quick action cards)
- Icons from `lucide-react`

**Features**:

**Stats Grid** (4 cards):
1. Active Ideas count
2. In Development projects count
3. Completed projects count
4. Available Tokens balance

**Quick Actions Grid** (3 cards):
1. Capture New Idea → /ideas/new
2. View Projects → /projects
3. View All Ideas → /ideas

**User Actions**:
- Click stat cards → Navigate to relevant section
- Click quick action cards → Navigate to page
- View real-time data

**State Management**:
- `stats` object with counts
- `loading` state for data fetch

**Database Operations**:
- `SELECT COUNT(*) FROM ideas WHERE user_id = ?`
- `SELECT COUNT(*) FROM projects WHERE user_id = ?`
- `SELECT total_tokens, tokens_used FROM profiles WHERE id = ?`

---

### 2.4 Ideas List Page (`/ideas`)

**Purpose**: Display all user's ideas with status

**Components Required**:
- `Navbar`
- `Button` (New Idea CTA)
- `Card` (idea cards in grid)
- `Badge` (status indicators)

**Features**:
- Grid layout of idea cards
- Each card shows:
  - Title
  - Description (truncated)
  - Status badge
  - Consensus score (if validated)
  - Tokens spent
  - Created date
- Empty state with CTA
- Loading state
- Click card → Navigate to /ideas/:id

**User Actions**:
- Click "New Idea" → /ideas/new
- Click idea card → /ideas/:id
- View status at a glance

**State Management**:
- `ideas[]` - Array of idea objects
- `loading` - Boolean

**Database Operations**:
- `SELECT * FROM ideas WHERE user_id = ? ORDER BY created_at DESC`

---

### 2.5 New Idea Page (`/ideas/new`)

**Purpose**: Multi-step form to capture idea details

**Components Required**:
- `Navbar`
- `Card` (form container)
- `Input`, `Textarea`, `Label`
- `Button` (navigation, save)
- Progress indicator (3 steps)

**Features**:

**Step 1: Basic Info** (REQUIRED)
- Title input
- Description textarea
- Next button (validates required fields)

**Step 2: Problem & Audience**
- Problem statement textarea
- Target audience textarea
- Previous/Next buttons

**Step 3: Value Proposition**
- Unique value proposition textarea
- Previous button
- Save Draft button
- Complete button

**Form Actions**:
- Save Draft (any step) → Creates draft in DB
- Navigate between steps
- Form validation
- Auto-save on draft

**User Actions**:
- Fill multi-step form
- Save draft at any point
- Complete and save
- Navigate to /ideas/:id after save

**State Management**:
- `step` (1-3)
- `formData` object with all fields
- `loading` - save state

**Database Operations**:
```sql
INSERT INTO ideas (
  user_id, title, description, 
  problem_statement, target_audience, 
  unique_value_proposition, status
) VALUES (?, ?, ?, ?, ?, ?, 'draft')
```

---

### 2.6 Idea Detail Page (`/ideas/:id`)

**Purpose**: View, edit, validate, and manage individual ideas

**Components Required**:
- `Navbar`
- `Card` (multiple sections)
- `Badge` (status)
- `Button` (actions)
- `Textarea` (edit mode)
- `Progress` (validation progress)
- AI Agent indicators

**Features**:

**View Mode** (Draft Status):
- Display all idea details
- Status badge
- Created date
- Edit button
- "Start AI Validation" CTA
- Token cost display

**Edit Mode**:
- All fields editable
- Save/Cancel buttons
- Real-time updates

**Validating Status**:
- Loading spinner
- Progress bar
- Status message
- Real-time updates

**Validated Status**:
- Consensus score (large)
- Individual agent scores (Claude, Gemini, Codex)
- Strengths list
- Concerns list
- Recommendations list
- "Create Project" CTA

**User Actions**:
- Edit idea details
- Start validation (calls edge function)
- Create project from validated idea
- View validation results

**State Management**:
- `idea` object
- `editing` boolean
- `validating` boolean
- `formData` (edit mode)

**Database Operations**:
```sql
-- Update idea
UPDATE ideas SET ... WHERE id = ? AND user_id = ?

-- Start validation (via edge function)
-- Edge function handles:
-- - Calling 3 AI agents
-- - Calculating consensus
-- - Updating idea with results
-- - Deducting tokens
-- - Creating transaction record
```

**Edge Function**: `validate-idea`
- Input: `ideaId`
- Process:
  1. Fetch idea details
  2. Call 3 AI agents in parallel
  3. Calculate consensus score
  4. Aggregate feedback
  5. Update idea record
  6. Deduct 150 tokens
  7. Create transaction
- Output: Validation summary

---

### 2.7 Projects List Page (`/projects`)

**Purpose**: Display all user's projects

**Components Required**:
- `Navbar`
- `Card` (project cards)
- `Badge` (phase indicators)
- `Progress` (progress bars)
- `Button` (external links)

**Features**:
- Grid of project cards
- Each card shows:
  - Project name
  - Current phase (X/10)
  - Progress percentage
  - Progress bar
  - Repository link (if exists)
  - Deployment link (if exists)
  - Started date
- Empty state
- Click card → /projects/:id

**User Actions**:
- Click project card → /projects/:id
- Click repository link → External GitHub
- Click deployment link → Live app

**State Management**:
- `projects[]` - Array
- `loading` - Boolean

**Database Operations**:
```sql
SELECT * FROM projects 
WHERE user_id = ? 
ORDER BY created_at DESC
```

---

### 2.8 Project Detail Page (`/projects/:id`)

**Purpose**: Detailed project view with phase tracking

**Components Required**:
- `Navbar`
- `Card` (stats, phases, actions)
- `Progress` (overall & phase)
- `Badge` (status, consensus)
- Icons (status indicators)
- `Button` (actions)

**Features**:

**Stats Grid** (3 cards):
1. Current Phase (X/10)
2. Overall Progress (%)
3. Phases Completed count

**Project Links** (if exist):
- Repository button → GitHub
- Deployment button → Live URL

**Phase List** (10 phases):
Each phase shows:
- Phase number and name
- Status (pending/in_progress/completed/failed)
- Status icon
- Consensus badge (if reached)
- Started date
- Completed date
- Tokens spent
- Progress bar (if in progress)

**Phase Names**:
1. Requirements Analysis
2. Architecture Design
3. Database Schema
4. API Design
5. UI/UX Design
6. Frontend Development
7. Backend Development
8. Integration & Testing
9. Deployment Setup
10. Final Review & Launch

**Actions**:
- Start Next Phase button
- Back to Projects button

**User Actions**:
- View phase progress
- Start next phase
- Open external links
- Monitor consensus

**State Management**:
- `project` object
- `phases[]` array (10 items)
- `loading` boolean

**Database Operations**:
```sql
-- Fetch project
SELECT * FROM projects WHERE id = ? AND user_id = ?

-- Fetch phases
SELECT * FROM phases 
WHERE project_id = ? 
ORDER BY phase_number
```

---

### 2.9 Templates Page (`/templates`)

**Purpose**: Browse and apply idea templates

**Components Required**:
- `Navbar`
- `Input` (search)
- `Button` (category filters)
- `Card` (template cards)
- `Badge` (category, usage)

**Features**:

**Search & Filter Bar**:
- Search input (filters by name/description)
- Category buttons (All, SaaS, E-commerce, Social, AI/ML, Mobile, Analytics)

**Template Grid**:
Each card shows:
- Category badge
- Template name
- Description
- Usage count
- "Use Template" button

**Pre-loaded Templates** (6):
1. SaaS Startup
2. E-commerce Platform
3. Social Media App
4. AI-Powered Tool
5. Mobile App Backend
6. Analytics Dashboard

**Create Custom Template Section**:
- Call-to-action card
- "Create Template" button (future feature)

**User Actions**:
- Search templates
- Filter by category
- Click "Use Template" → Navigate to /ideas/new with template data
- Increment usage count on use

**State Management**:
- `templates[]` - All templates
- `filteredTemplates[]` - After search/filter
- `searchQuery` - String
- `selectedCategory` - String or null
- `loading` - Boolean

**Database Operations**:
```sql
-- Fetch templates
SELECT * FROM templates 
WHERE is_public = true 
ORDER BY usage_count DESC

-- Increment usage
UPDATE templates 
SET usage_count = usage_count + 1 
WHERE id = ?
```

---

### 2.10 Tokens Page (`/tokens`)

**Purpose**: Manage tokens and view transaction history

**Components Required**:
- `Navbar`
- `Card` (balance, packages, transactions)
- `Progress` (usage visualization)
- `Button` (purchase)
- `Badge` (transaction types)
- Icons (transaction icons)

**Features**:

**Balance Cards** (3 cards):
1. Available Tokens (total - used)
2. Total Earned
3. Tokens Used

**Purchase Packages** (3 cards):
- 1,000 tokens - $10
- 5,000 tokens - $45 (Popular badge)
- 10,000 tokens - $80
Each with "Purchase" button

**Transaction History**:
- List of all transactions
- Each row shows:
  - Type icon (purchase/consumption/bonus/refund)
  - Description
  - Timestamp
  - Amount (+/-)
  - Balance after
- Color-coded (green for credit, red for debit)
- Sorted by date (newest first)

**User Actions**:
- View balance
- Click purchase (shows coming soon toast)
- Scroll transaction history

**State Management**:
- `profile` object (tokens)
- `transactions[]` array
- `loading` boolean

**Database Operations**:
```sql
-- Fetch profile
SELECT total_tokens, tokens_used 
FROM profiles 
WHERE id = ?

-- Fetch transactions
SELECT * FROM token_transactions 
WHERE user_id = ? 
ORDER BY created_at DESC 
LIMIT 50
```

---

### 2.11 Analytics Page (`/analytics`)

**Purpose**: Display user's success metrics

**Components Required**:
- `Navbar`
- `Card` (metric cards, charts)
- `Progress` (visual metrics)
- Icons (metric icons)

**Features**:

**Stats Grid** (4 cards):
1. Total Ideas (with validated count)
2. Active Projects (with completed count)
3. Success Rate (%)
4. Tokens Spent (total)

**Validation Performance Card**:
- Average consensus score
- Validation success rate
- Average time to validation
- Progress bars

**Project Progress Card**:
- Projects started
- Projects completed
- Completion rate
- Visual bars

**Motivational Message**:
- Dynamic based on metrics
- Encouragement to continue

**User Actions**:
- View metrics
- Analyze performance
- Track progress

**State Management**:
- `stats` object with all metrics
- `loading` boolean

**Database Operations**:
```sql
-- Fetch ideas
SELECT id, status, consensus_score, tokens_spent 
FROM ideas 
WHERE user_id = ?

-- Fetch projects
SELECT id, progress_percentage 
FROM projects 
WHERE user_id = ?

-- Fetch profile
SELECT total_tokens, tokens_used 
FROM profiles 
WHERE id = ?

-- Calculate aggregations in frontend
```

---

### 2.12 Code IDE Page (`/code-ide`)

**Purpose**: AI-powered code generation interface

**Components Required**:
- `Navbar`
- `CodeGenerator` (custom component)
- `Card` (examples, models info)
- `Textarea` (prompt input)
- `Button` (generate)
- `Code` block (output)

**Features**:

**Code Generator Section**:
- Prompt textarea
- Context input
- "Generate Code" button
- Loading state
- Streaming output display
- Copy button
- Generated code display

**AI Models Info Card**:
Lists 3 models with descriptions:
- Claude (Gemini 2.5 Pro) - Complex reasoning
- Gemini (Gemini 2.5 Flash) - Balanced
- Codex (Gemini 2.5 Flash Lite) - Fast

**Code Examples Card**:
4 example prompts:
- React Component
- API Endpoint
- Database Schema
- UI Component

**User Actions**:
- Type prompt
- Generate code (streams response)
- Copy code
- View examples
- Learn about models

**State Management**:
- `prompt` - String
- `generatedCode` - String
- `generating` - Boolean
- `copied` - Boolean (temp for UI feedback)

**Edge Function**: `generate-code`
- Input: `prompt`, `context`
- Process:
  1. Call Lovable AI Gateway
  2. Stream response via SSE
  3. Handle rate limits
- Output: Streaming code

**Streaming Implementation**:
- SSE (Server-Sent Events)
- Token-by-token display
- Line-by-line parsing
- Handle partial JSON
- Handle [DONE] signal

---

### 2.13 Not Found Page (`/404`)

**Purpose**: Handle invalid routes gracefully

**Components Required**:
- `Button`
- Icons

**Features**:
- Large "404" text
- Error message
- "Go Back" button (history.back)
- "Home" button → /

**User Actions**:
- Click Go Back → Previous page
- Click Home → /

**State Management**: None

---

## 3. Component Architecture

### 3.1 Layout Components

**Navbar Component**
- Location: `src/components/Navbar.tsx`
- Used in: All authenticated pages
- Props: None
- Features:
  - Logo with link to /
  - Navigation links (Dashboard, Ideas, Projects, Templates, Analytics, Code IDE)
  - Token balance display → /tokens
  - Logout button
  - Conditional rendering (public vs authenticated)
- State:
  - `user` - Current user object
  - `tokens` - Available token count
- Effects:
  - Auth state listener
  - Fetch tokens on mount

---

### 3.2 Feature Components

**Hero Component**
- Location: `src/components/Hero.tsx`
- Used in: Landing page
- Props: None
- Features:
  - Main headline
  - Subheadline
  - CTA buttons
  - AI agents showcase (3 cards)
  - Statistics (3 metrics)
  - Animated background

**Features Component**
- Location: `src/components/Features.tsx`
- Used in: Landing page
- Props: None
- Features:
  - 3 feature cards
  - Icons
  - Descriptions

**PhaseTimeline Component**
- Location: `src/components/PhaseTimeline.tsx`
- Used in: Landing page
- Props: None
- Features:
  - Visual timeline of 10 phases
  - Phase names
  - Descriptions

**CodeGenerator Component**
- Location: `src/components/CodeGenerator.tsx`
- Used in: Code IDE page
- Props:
  - `context` (optional string)
  - `onCodeGenerated` (optional callback)
- Features:
  - Prompt input
  - Generate button
  - Streaming output
  - Copy functionality
- State:
  - `prompt`, `generatedCode`, `generating`, `copied`

**AIAgentIndicator Component**
- Location: `src/components/AIAgentIndicator.tsx`
- Used in: Various pages showing AI agents
- Props:
  - `agent`: "claude" | "gemini" | "codex"
  - `score`: number (optional)
  - `size`: "sm" | "md" | "lg"
  - `showIcon`: boolean
- Features:
  - Agent-specific colors
  - Icon display
  - Score display
  - Size variants

**PhaseProgressTracker Component**
- Location: `src/components/PhaseProgressTracker.tsx`
- Used in: Project detail page
- Props:
  - `phases`: Phase[]
  - `currentPhase`: number
- Features:
  - Overall progress bar
  - Phase grid (2x5 or responsive)
  - Status indicators
  - Current phase highlight

---

### 3.3 UI Components (shadcn/ui)

All located in `src/components/ui/`:
- `button.tsx` - Buttons with variants
- `card.tsx` - Cards with header/content/footer
- `input.tsx` - Text inputs
- `textarea.tsx` - Multi-line text inputs
- `label.tsx` - Form labels
- `badge.tsx` - Status badges
- `progress.tsx` - Progress bars
- `tabs.tsx` - Tab navigation
- `dialog.tsx` - Modal dialogs
- `toast.tsx` - Toast notifications
- `form.tsx` - Form components (react-hook-form integration)

---

## 4. User Flows

### 4.1 New User Onboarding Flow

```
1. Land on / (Landing Page)
   ↓ Click "Get Started Free"
2. /auth (Sign Up Tab)
   ↓ Fill form (name, email, password)
3. Submit → Backend:
   - Create auth.users record
   - Trigger creates profiles record
   - Trigger assigns 'user' role
   - Trigger creates welcome transaction (100 tokens)
   ↓ Success
4. Auto-redirect to /dashboard
   ↓ User sees welcome dashboard
5. Click "Capture New Idea"
   ↓ Navigate to /ideas/new
6. Fill 3-step form
   ↓ Save
7. Navigate to /ideas/:id
   ↓ Click "Start AI Validation"
8. Edge function validate-idea:
   - Fetch idea
   - Call 3 AI agents in parallel
   - Calculate consensus
   - Update idea with results
   - Deduct 150 tokens
   - Create transaction
   ↓ Validation complete
9. View results with consensus score
   ↓ Click "Create Project"
10. Navigate to /projects/:id
    - See 10 phases
    - Phase 1 is pending
```

### 4.2 Idea Validation Flow

```
/ideas/:id (Draft Status)
   ↓ User reviews idea
   ↓ Clicks "Start AI Validation" (150 tokens)
   
Frontend:
   - Update status to 'validating'
   - Show loading state
   - Call edge function

Edge Function (validate-idea):
   ┌─ Call Claude (Gemini 2.5 Pro)
   ├─ Call Gemini (Gemini 2.5 Flash)  (Parallel)
   └─ Call Codex (Gemini 2.5 Flash Lite)
   ↓ All responses received
   - Calculate average score
   - Aggregate feedback
   - Update idea:
     * status = 'validated'
     * consensus_score = avg
     * validation_summary = {...}
     * tokens_spent += 150
   - Update profile:
     * tokens_used += 150
   - Create transaction record
   ↓ Return success

Frontend:
   - Fetch updated idea
   - Show results:
     * Large consensus score
     * Individual agent scores
     * Strengths (green)
     * Concerns (yellow)
     * Recommendations (blue)
   - Show "Create Project" button
```

### 4.3 Project Creation Flow

```
/ideas/:id (Validated Status)
   ↓ Click "Create Project"
   
Frontend:
   1. Call supabase.from('projects').insert({
        idea_id: id,
        user_id: user.id,
        name: idea.title,
        current_phase: 1,
        progress_percentage: 0
      })
   
   2. Get project.id from response
   
   3. Create 10 phases:
      for (i = 1; i <= 10; i++) {
        supabase.from('phases').insert({
          project_id: project.id,
          phase_number: i,
          phase_name: `Phase ${i}`,
          status: 'pending'
        })
      }
   
   4. Navigate to /projects/:id
   
View:
   - See project overview
   - 10 phases listed
   - Phase 1 is pending
   - Ready to start development
```

### 4.4 Template Application Flow

```
/templates
   ↓ Browse templates
   ↓ Click "Use Template" on a template
   
Frontend:
   1. Increment template usage count
   2. Extract template_data JSON
   3. Navigate to /ideas/new with state
   4. Pre-fill form with template data:
      - title from template
      - description
      - problem_statement
      - target_audience
      - unique_value_proposition
   
/ideas/new (Pre-filled)
   ↓ User reviews/edits
   ↓ Saves as draft
   ↓ Navigate to /ideas/:id
   ↓ Can proceed with validation
```

---

## 5. Data Flow Architecture

### 5.1 Authentication Flow

```
Client (Browser)
   ↓ signUp(email, password, metadata)
Supabase Auth
   ↓ Creates auth.users record
Database Trigger (on_auth_user_created)
   ↓ Executes handle_new_user() function
   ├─ INSERT INTO profiles (id, email, full_name, total_tokens)
   ├─ INSERT INTO user_roles (user_id, role = 'user')
   └─ INSERT INTO token_transactions (type='bonus', amount=100)
   ↓ Success
Client
   - onAuthStateChange fires
   - User object available
   - Redirect to /dashboard
```

### 5.2 Idea Validation Data Flow

```
Client (/ideas/:id)
   ↓ POST to edge function validate-idea
   
Edge Function
   ↓ Fetch idea from DB
   ┌────────────────────────────────┐
   │  Parallel AI Agent Calls       │
   ├─ Claude   → Tool Call Response │
   ├─ Gemini   → Tool Call Response │
   └─ Codex    → Tool Call Response │
   └────────────────────────────────┘
   ↓ Process responses
   ↓ Calculate consensus = avg(scores)
   ↓ Aggregate feedback
   
   Database Updates:
   ├─ UPDATE ideas SET 
   │     status = 'validated',
   │     consensus_score = X,
   │     validation_summary = {...},
   │     tokens_spent = tokens_spent + 150
   │
   ├─ UPDATE profiles SET 
   │     tokens_used = tokens_used + 150
   │
   └─ INSERT INTO token_transactions
         (type='consumption', amount=-150, ...)
   
   ↓ Return results to client
   
Client
   ↓ Fetch updated idea
   ↓ Display results
```

### 5.3 Code Generation Data Flow

```
Client (/code-ide)
   ↓ User enters prompt
   ↓ Click "Generate Code"
   ↓ POST to edge function generate-code
   
Edge Function
   ↓ Receive prompt + context
   ↓ Call Lovable AI Gateway (streaming=true)
   
AI Gateway
   ↓ Process with Gemini 2.5 Flash
   ↓ Stream tokens via SSE
   
Edge Function
   ↓ Pass-through stream to client
   
Client (SSE Handling)
   ├─ Read stream
   ├─ Parse SSE events
   ├─ Extract delta content
   ├─ Append to accumulated code
   └─ Update UI (token by token)
   
   ↓ Stream complete
   ↓ Display full code
   ↓ Enable copy button
```

---

## 6. API Design

### 6.1 Edge Functions

**validate-idea**
```typescript
Endpoint: /functions/v1/validate-idea
Method: POST
Auth: Optional (verify_jwt = false)

Request Body:
{
  ideaId: string (UUID)
}

Response:
{
  success: boolean
  consensus_score: number (0-100)
  validation_summary: {
    claude_score: number
    gemini_score: number
    codex_score: number
    strengths: string[]
    concerns: string[]
    recommendations: string[]
  }
  tokens_spent: number
}

Error Response:
{
  error: string
}
```

**validate-phase**
```typescript
Endpoint: /functions/v1/validate-phase
Method: POST
Auth: Optional (verify_jwt = false)

Request Body:
{
  phaseId: string (UUID)
  userInput: string
}

Response:
{
  success: boolean
  consensus_reached: boolean
  average_score: number
  validations: Array<{
    agent: string
    score: number
    approved: boolean
    issues: string[]
    recommendations: string[]
  }>
  tokens_spent: number
}

Error Response:
{
  error: string
}
```

**generate-code**
```typescript
Endpoint: /functions/v1/generate-code
Method: POST
Auth: Optional (verify_jwt = false)

Request Body:
{
  prompt: string
  context?: string
}

Response: SSE Stream
data: {"choices":[{"delta":{"content":"token"}}]}
data: {"choices":[{"delta":{"content":"next_token"}}]}
...
data: [DONE]

Error Response:
{
  error: string
}
```

### 6.2 Database Queries

**Common Patterns**:

```sql
-- Fetch user ideas
SELECT * FROM ideas 
WHERE user_id = $1 
ORDER BY created_at DESC;

-- Fetch single idea with ownership check
SELECT * FROM ideas 
WHERE id = $1 AND user_id = $2;

-- Create new idea
INSERT INTO ideas (
  user_id, title, description, 
  problem_statement, target_audience,
  unique_value_proposition, status
) VALUES ($1, $2, $3, $4, $5, $6, 'draft')
RETURNING *;

-- Update idea validation results
UPDATE ideas SET
  status = 'validated',
  consensus_score = $1,
  validation_summary = $2,
  tokens_spent = tokens_spent + $3
WHERE id = $4 AND user_id = $5;

-- Fetch user projects with idea titles
SELECT p.*, i.title as idea_title
FROM projects p
JOIN ideas i ON p.idea_id = i.id
WHERE p.user_id = $1
ORDER BY p.created_at DESC;

-- Fetch project phases
SELECT * FROM phases
WHERE project_id = $1
ORDER BY phase_number;

-- Fetch token balance
SELECT total_tokens, tokens_used
FROM profiles
WHERE id = $1;

-- Record token transaction
INSERT INTO token_transactions (
  user_id, transaction_type, amount,
  balance_after, description, metadata
) VALUES ($1, $2, $3, $4, $5, $6);

-- Fetch templates
SELECT * FROM templates
WHERE is_public = true
ORDER BY usage_count DESC;
```

---

## 7. Security Architecture

### 7.1 Row Level Security Policies

**profiles table**:
- Users can SELECT own profile
- Users can UPDATE own profile

**user_roles table**:
- Users can SELECT own roles
- Only admins can INSERT/UPDATE/DELETE

**ideas table**:
- Users can SELECT own ideas
- Users can INSERT with own user_id
- Users can UPDATE own ideas
- Users can DELETE own ideas

**projects table**:
- Users can SELECT own projects
- Users can INSERT with own user_id
- Users can UPDATE own projects

**phases table**:
- Users can SELECT phases of own projects
- Users can UPDATE/DELETE phases of own projects

**token_transactions table**:
- Users can SELECT own transactions
- Users can INSERT own transactions

**templates table**:
- Everyone can SELECT public templates
- Users can INSERT with own created_by
- Users can UPDATE own templates

### 7.2 Security Definer Function

```sql
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

This prevents recursive RLS policy issues.

---

## 8. Performance Optimization

### 8.1 Database Indexes

```sql
-- Ideas queries
CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_ideas_status ON ideas(status);

-- Projects queries
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_idea_id ON projects(idea_id);

-- Phases queries
CREATE INDEX idx_phases_project_id ON phases(project_id);

-- Token transactions queries
CREATE INDEX idx_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_transactions_created_at ON token_transactions(created_at DESC);
```

### 8.2 Frontend Optimizations

- React Query for caching
- Lazy loading for routes
- Debounced search inputs
- Optimistic UI updates
- SSE streaming for real-time updates

---

## 9. Future Enhancements

### Phase 2 Features:
1. Real-time collaboration
2. Advanced code IDE with syntax highlighting
3. GitHub repository integration
4. Automated deployment pipelines
5. Team workspaces
6. Custom AI model training
7. Template marketplace
8. Mobile app support

### Technical Debt:
1. Add comprehensive error boundaries
2. Implement retry logic for failed AI calls
3. Add rate limiting on frontend
4. Implement proper loading states everywhere
5. Add E2E tests
6. Performance monitoring
7. Analytics tracking

---

This architecture document provides a complete blueprint of Codilla.ai's structure, showing every page, component, user flow, and technical detail.