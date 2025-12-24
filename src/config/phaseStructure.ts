// Define the structure of each phase with its sub-phases and tasks
export interface PhaseTask {
  id: string;
  title: string;
  description: string;
  aiPromptContext: string;
  artifactType?: string; // Type of artifact this task produces
  dependencies?: string[]; // IDs of tasks that must be completed first
}

export interface PhaseStructure {
  phaseNumber: number;
  phaseName: string;
  description: string;
  tasks: PhaseTask[];
  decisionGate: string;
  completionCriteria?: string; // What defines phase completion
  requiredArtifacts?: string[]; // Required artifacts to complete phase
}

export const PHASE_STRUCTURES: PhaseStructure[] = [
  {
    phaseNumber: 1,
    phaseName: "Idea Capture & Screening",
    description: "Quick validation to determine if the idea is worth pursuing",
    decisionGate: "Go/No-Go/Parking Lot",
    tasks: [
      {
        id: "problem-validation",
        title: "Problem Validation",
        description: "Validate that this is a real, painful problem",
        aiPromptContext: "Help the user articulate the problem clearly. Ask: Who experiences this problem? How often? What's the current pain level? What happens if it's not solved?"
      },
      {
        id: "personal-fit",
        title: "Personal Fit Assessment",
        description: "Assess founder-market fit and passion",
        aiPromptContext: "Explore why this founder cares about this problem. Ask about their domain knowledge, personal experience, passion level, and unfair advantages."
      },
      {
        id: "market-sizing",
        title: "Quick Market Sizing",
        description: "Rough estimate of market potential",
        aiPromptContext: "Help estimate the total addressable market. Ask about target audience size, willingness to pay, and competitive landscape."
      },
      {
        id: "solution-hypothesis",
        title: "Solution Hypothesis",
        description: "Define the proposed solution approach",
        aiPromptContext: "Help articulate the solution hypothesis. What is the core idea? How does it solve the problem differently from existing solutions?"
      },
      {
        id: "mvp-clarity",
        title: "MVP Clarity",
        description: "Define what can be built and validated quickly",
        aiPromptContext: "Help define the simplest version that solves the core problem. What's the one feature that delivers most of the value? What can be validated quickly?"
      },
      {
        id: "risk-assessment",
        title: "Initial Risk Assessment",
        description: "Identify key risks and assumptions",
        aiPromptContext: "Help identify the biggest risks and assumptions. What could kill this idea? What must be true for this to succeed?"
      }
    ]
  },
  {
    phaseNumber: 2,
    phaseName: "Validation & Research",
    description: "Deep market research and validation",
    decisionGate: "Go/Pivot/Kill",
    tasks: [
      {
        id: "market-research",
        title: "Market Research",
        description: "Comprehensive market analysis",
        aiPromptContext: "Guide comprehensive market research covering market size, trends, growth rate, and market dynamics.",
        artifactType: "market_research"
      },
      {
        id: "competitive-analysis",
        title: "Competitive Analysis",
        description: "Deep dive into existing solutions",
        aiPromptContext: "Analyze direct and indirect competitors, their strengths, weaknesses, pricing, and market positioning.",
        artifactType: "competitive_analysis"
      },
      {
        id: "customer-interviews",
        title: "Customer Interview Analysis",
        description: "Synthesize insights from target customers",
        aiPromptContext: "Help structure and analyze customer interview findings. Extract pain points, willingness to pay, and buying criteria.",
        artifactType: "customer_interviews"
      },
      {
        id: "value-proposition",
        title: "Value Proposition Canvas",
        description: "Define clear value proposition",
        aiPromptContext: "Work through the Value Proposition Canvas: customer jobs, pains, gains, and how your product addresses each.",
        artifactType: "value_proposition"
      },
      {
        id: "swot-analysis",
        title: "SWOT Analysis",
        description: "Analyze strengths, weaknesses, opportunities, threats",
        aiPromptContext: "Conduct a thorough SWOT analysis considering internal capabilities and external market factors.",
        artifactType: "swot_analysis"
      },
      {
        id: "business-model",
        title: "Business Model Canvas",
        description: "Define the business model",
        aiPromptContext: "Work through the Business Model Canvas: value proposition, customer segments, channels, revenue streams, cost structure, key resources, and partnerships.",
        artifactType: "business_model_canvas"
      },
      {
        id: "unit-economics",
        title: "Unit Economics",
        description: "Calculate key financial metrics",
        aiPromptContext: "Help calculate unit economics: customer acquisition cost (CAC), lifetime value (LTV), payback period, and gross margins.",
        artifactType: "unit_economics"
      },
      {
        id: "go-to-market",
        title: "Go-to-Market Strategy",
        description: "Plan initial market entry approach",
        aiPromptContext: "Develop go-to-market strategy: target segment, positioning, channels, pricing strategy, and launch approach.",
        artifactType: "gtm_strategy"
      }
    ]
  },
  {
    phaseNumber: 3,
    phaseName: "Product Definition",
    description: "Define product requirements and specifications",
    decisionGate: "Build/Refine/Stop",
    tasks: [
      {
        id: "user-personas",
        title: "User Personas",
        description: "Create detailed user personas",
        aiPromptContext: "Develop 2-3 detailed user personas with demographics, goals, pain points, and behaviors.",
        artifactType: "user_personas"
      },
      {
        id: "jobs-to-be-done",
        title: "Jobs-to-be-Done Analysis",
        description: "Define what jobs users are hiring your product for",
        aiPromptContext: "Identify the functional, emotional, and social jobs users need to accomplish and how your product helps.",
        artifactType: "jobs_to_be_done"
      },
      {
        id: "user-journey",
        title: "User Journey Mapping",
        description: "Map the complete user experience",
        aiPromptContext: "Create user journey maps showing touchpoints, emotions, pain points, and opportunities across the entire experience.",
        artifactType: "user_journey"
      },
      {
        id: "user-stories",
        title: "User Stories",
        description: "Write comprehensive user stories",
        aiPromptContext: "Create user stories in the format: As a [user], I want to [action], so that [benefit]. Prioritize by value and effort.",
        artifactType: "user_stories"
      },
      {
        id: "feature-specification",
        title: "Feature Specification",
        description: "Detail all MVP features",
        aiPromptContext: "Specify each feature with acceptance criteria, edge cases, and success metrics.",
        artifactType: "feature_specification"
      },
      {
        id: "information-architecture",
        title: "Information Architecture",
        description: "Structure content and navigation",
        aiPromptContext: "Design the information architecture: content hierarchy, navigation structure, and labeling system.",
        artifactType: "information_architecture"
      },
      {
        id: "prd-generation",
        title: "PRD Generation",
        description: "Generate comprehensive Product Requirements Document",
        aiPromptContext: "Compile all information into a structured PRD covering product vision, features, requirements, and success metrics.",
        artifactType: "prd"
      }
    ]
  },
  {
    phaseNumber: 4,
    phaseName: "Technical Planning",
    description: "Plan the technical architecture and stack",
    decisionGate: "Ready/Need More Info",
    tasks: [
      {
        id: "tech-stack",
        title: "Technology Stack Selection",
        description: "Choose appropriate technologies",
        aiPromptContext: "Recommend tech stack based on requirements, team skills, scalability needs, and timeline.",
        artifactType: "tech_stack"
      },
      {
        id: "architecture",
        title: "System Architecture",
        description: "Design system architecture",
        aiPromptContext: "Design the system architecture including frontend, backend, database, and third-party integrations.",
        artifactType: "architecture"
      },
      {
        id: "data-model",
        title: "Data Model Design",
        description: "Design database schema",
        aiPromptContext: "Design the data model with entities, relationships, and key attributes.",
        artifactType: "database_schema"
      },
      {
        id: "api-design",
        title: "API Design",
        description: "Design API endpoints and contracts",
        aiPromptContext: "Design RESTful or GraphQL APIs with endpoints, request/response schemas, and authentication.",
        artifactType: "api_design"
      },
      {
        id: "security-planning",
        title: "Security Planning",
        description: "Plan security measures and compliance",
        aiPromptContext: "Define security requirements: authentication, authorization, data encryption, GDPR/privacy compliance, and security best practices.",
        artifactType: "security_plan"
      },
      {
        id: "integration-plan",
        title: "Integration Planning",
        description: "Plan third-party integrations",
        aiPromptContext: "Identify and plan all necessary third-party integrations, APIs, and services.",
        artifactType: "integration_plan"
      },
      {
        id: "scalability-plan",
        title: "Scalability Planning",
        description: "Plan for growth and performance",
        aiPromptContext: "Design for scalability: caching strategies, database optimization, CDN, and load balancing considerations.",
        artifactType: "scalability_plan"
      },
      {
        id: "deployment-strategy",
        title: "Deployment Strategy",
        description: "Plan deployment and DevOps approach",
        aiPromptContext: "Define deployment strategy: environments, CI/CD pipeline, containerization, and infrastructure as code.",
        artifactType: "deployment_strategy"
      }
    ]
  },
  {
    phaseNumber: 5,
    phaseName: "Design & Prototype",
    description: "Create designs and interactive prototype",
    decisionGate: "Approve/Revise",
    tasks: [
      {
        id: "design-system",
        title: "Design System",
        description: "Establish design foundations and components",
        aiPromptContext: "Create a design system with color palette, typography, spacing, and core UI components.",
        artifactType: "design_system"
      },
      {
        id: "wireframes",
        title: "Wireframes",
        description: "Create low-fidelity wireframes",
        aiPromptContext: "Guide the creation of wireframes for all key screens and user flows.",
        artifactType: "wireframes"
      },
      {
        id: "user-flows",
        title: "User Flow Mapping",
        description: "Map all user journeys",
        aiPromptContext: "Map out complete user flows from entry points to goal completion.",
        artifactType: "user_flows"
      },
      {
        id: "ui-design",
        title: "UI Design",
        description: "Design high-fidelity mockups",
        aiPromptContext: "Help create detailed UI designs with color schemes, typography, and component libraries.",
        artifactType: "ui_design"
      },
      {
        id: "responsive-design",
        title: "Responsive Design",
        description: "Design for all screen sizes",
        aiPromptContext: "Create responsive designs for mobile, tablet, and desktop breakpoints.",
        artifactType: "responsive_design"
      },
      {
        id: "accessibility",
        title: "Accessibility Planning",
        description: "Ensure inclusive design",
        aiPromptContext: "Plan for accessibility: WCAG compliance, screen reader support, keyboard navigation, and color contrast.",
        artifactType: "accessibility_plan"
      },
      {
        id: "prototype",
        title: "Interactive Prototype",
        description: "Build clickable prototype",
        aiPromptContext: "Guide the creation of an interactive prototype for user testing.",
        artifactType: "prototype"
      },
      {
        id: "usability-testing",
        title: "Usability Testing Plan",
        description: "Plan user testing sessions",
        aiPromptContext: "Design usability test plan: test scenarios, participant criteria, metrics to measure, and feedback collection.",
        artifactType: "usability_testing"
      }
    ]
  },
  {
    phaseNumber: 6,
    phaseName: "Development Preparation",
    description: "Prepare for development phase",
    decisionGate: "Start Development",
    tasks: [
      {
        id: "repository-setup",
        title: "Repository Setup",
        description: "Initialize code repository and structure",
        aiPromptContext: "Guide repository setup: folder structure, branching strategy, and initial project scaffolding."
      },
      {
        id: "dev-environment",
        title: "Development Environment",
        description: "Set up development environment",
        aiPromptContext: "Guide setup of development environment, local databases, and development tools."
      },
      {
        id: "coding-standards",
        title: "Coding Standards",
        description: "Define code quality guidelines",
        aiPromptContext: "Establish coding standards: linting rules, formatting, naming conventions, and documentation requirements."
      },
      {
        id: "cicd-pipeline",
        title: "CI/CD Pipeline Setup",
        description: "Set up continuous integration and deployment",
        aiPromptContext: "Configure CI/CD pipeline: automated testing, code quality checks, and deployment automation."
      },
      {
        id: "task-breakdown",
        title: "Task Breakdown",
        description: "Break work into development tasks",
        aiPromptContext: "Break down features into specific, actionable development tasks organized by priority."
      },
      {
        id: "sprint-planning",
        title: "Sprint Planning",
        description: "Plan development sprints",
        aiPromptContext: "Organize tasks into sprints with clear goals, dependencies, and milestones."
      },
      {
        id: "prompt-generation",
        title: "AI Prompt Generation",
        description: "Generate prompts for AI-assisted development",
        aiPromptContext: "Create detailed prompts for AI to assist with code generation, organized by feature and priority."
      }
    ]
  },
  {
    phaseNumber: 7,
    phaseName: "AI-Assisted Development",
    description: "Build the product with AI assistance",
    decisionGate: "Feature Complete",
    tasks: [
      {
        id: "project-scaffolding",
        title: "Project Scaffolding",
        description: "Set up project foundation and configuration",
        aiPromptContext: "Generate initial project structure, configuration files, and base components."
      },
      {
        id: "authentication",
        title: "Authentication System",
        description: "Implement user authentication",
        aiPromptContext: "Build authentication: signup, login, password reset, session management, and OAuth integrations."
      },
      {
        id: "core-features",
        title: "Core Features Development",
        description: "Build essential features",
        aiPromptContext: "Guide implementation of core features with code generation and problem-solving assistance."
      },
      {
        id: "ui-implementation",
        title: "UI Implementation",
        description: "Build user interface",
        aiPromptContext: "Assist with frontend implementation, ensuring responsive design and user experience."
      },
      {
        id: "backend-api",
        title: "Backend & API",
        description: "Implement backend logic and APIs",
        aiPromptContext: "Help build backend services, database operations, and API endpoints."
      },
      {
        id: "integrations",
        title: "Third-Party Integrations",
        description: "Connect external services",
        aiPromptContext: "Implement integrations with payment processors, analytics, email services, and other third-party APIs."
      },
      {
        id: "performance-optimization",
        title: "Performance Optimization",
        description: "Optimize for speed and efficiency",
        aiPromptContext: "Optimize performance: lazy loading, caching, code splitting, and database query optimization."
      },
      {
        id: "testing-qa",
        title: "Testing & QA",
        description: "Test and fix issues",
        aiPromptContext: "Assist with writing tests, identifying bugs, and implementing fixes."
      }
    ]
  },
  {
    phaseNumber: 8,
    phaseName: "Launch Preparation",
    description: "Prepare for product launch",
    decisionGate: "Ready to Deploy",
    tasks: [
      {
        id: "launch-strategy",
        title: "Launch Strategy",
        description: "Plan launch approach and channels",
        aiPromptContext: "Develop a comprehensive launch strategy including target channels, messaging, and timeline.",
        artifactType: "launch-strategy"
      },
      {
        id: "marketing-materials",
        title: "Marketing Materials",
        description: "Create launch materials",
        aiPromptContext: "Help create landing pages, social media content, email campaigns, and press materials."
      },
      {
        id: "seo-setup",
        title: "SEO Setup",
        description: "Optimize for search engines",
        aiPromptContext: "Configure SEO: meta tags, structured data, sitemap, robots.txt, and content optimization."
      },
      {
        id: "analytics-setup",
        title: "Analytics Setup",
        description: "Set up tracking and analytics",
        aiPromptContext: "Guide setup of analytics, event tracking, conversion funnels, and key metrics monitoring."
      },
      {
        id: "legal-compliance",
        title: "Legal & Compliance",
        description: "Ensure legal requirements are met",
        aiPromptContext: "Review legal requirements: terms of service, privacy policy, cookie consent, and regulatory compliance."
      },
      {
        id: "support-setup",
        title: "Customer Support Setup",
        description: "Prepare customer support infrastructure",
        aiPromptContext: "Set up support channels: help center, FAQ, contact forms, and support ticketing system."
      },
      {
        id: "launch-checklist",
        title: "Launch Checklist",
        description: "Complete pre-launch checklist",
        aiPromptContext: "Work through final checklist: performance testing, security review, documentation, support setup.",
        artifactType: "launch-checklist"
      }
    ]
  },
  {
    phaseNumber: 9,
    phaseName: "Deployment & Go-Live",
    description: "Deploy to production and launch",
    decisionGate: "Live/Rollback",
    tasks: [
      {
        id: "infrastructure-setup",
        title: "Infrastructure Setup",
        description: "Configure production infrastructure",
        aiPromptContext: "Set up production infrastructure: servers, databases, CDN, and domain configuration."
      },
      {
        id: "production-deployment",
        title: "Production Deployment",
        description: "Deploy to production environment",
        aiPromptContext: "Guide production deployment, DNS setup, SSL configuration, and environment variables.",
        artifactType: "deployment"
      },
      {
        id: "backup-recovery",
        title: "Backup & Recovery",
        description: "Set up data backup and recovery procedures",
        aiPromptContext: "Configure automated backups, disaster recovery procedures, and data retention policies."
      },
      {
        id: "smoke-testing",
        title: "Smoke Testing",
        description: "Verify critical functionality in production",
        aiPromptContext: "Help create and execute smoke tests to verify all critical paths work in production."
      },
      {
        id: "security-audit",
        title: "Security Audit",
        description: "Final security review before launch",
        aiPromptContext: "Conduct security audit: vulnerability scanning, penetration testing considerations, and security checklist."
      },
      {
        id: "monitoring-setup",
        title: "Monitoring & Alerts",
        description: "Set up production monitoring",
        aiPromptContext: "Configure monitoring, error tracking, uptime monitoring, and alerting for production environment."
      },
      {
        id: "documentation",
        title: "Documentation",
        description: "Complete technical and user documentation",
        aiPromptContext: "Create documentation: API docs, user guides, admin manuals, and runbooks."
      },
      {
        id: "launch-execution",
        title: "Launch Execution",
        description: "Execute launch plan",
        aiPromptContext: "Guide through launch execution: announcements, monitoring, and initial user onboarding."
      }
    ]
  },
  {
    phaseNumber: 10,
    phaseName: "Post-Launch Operations",
    description: "Monitor, iterate, and scale",
    decisionGate: "Iterate/Scale",
    tasks: [
      {
        id: "user-feedback",
        title: "User Feedback Collection",
        description: "Gather and analyze user feedback",
        aiPromptContext: "Help set up feedback channels and analyze user responses for insights."
      },
      {
        id: "metrics-analysis",
        title: "Metrics Analysis",
        description: "Analyze performance metrics",
        aiPromptContext: "Guide analysis of key metrics: user acquisition, activation, retention, revenue.",
        artifactType: "metrics-analysis"
      },
      {
        id: "ab-testing",
        title: "A/B Testing Framework",
        description: "Set up experimentation infrastructure",
        aiPromptContext: "Implement A/B testing: experiment framework, hypothesis testing, and result analysis."
      },
      {
        id: "bug-triage",
        title: "Bug Triage & Fixes",
        description: "Address reported issues",
        aiPromptContext: "Help prioritize and fix bugs based on severity and user impact."
      },
      {
        id: "performance-monitoring",
        title: "Performance Monitoring",
        description: "Monitor and optimize performance",
        aiPromptContext: "Track performance metrics, identify bottlenecks, and implement optimizations."
      },
      {
        id: "iteration-planning",
        title: "Iteration Planning",
        description: "Plan product iterations based on data",
        aiPromptContext: "Help prioritize improvements and new features based on user feedback and metrics."
      },
      {
        id: "customer-success",
        title: "Customer Success",
        description: "Ensure customer satisfaction and retention",
        aiPromptContext: "Develop customer success strategies: onboarding optimization, churn prevention, and engagement campaigns."
      },
      {
        id: "scaling-strategy",
        title: "Scaling Strategy",
        description: "Plan for growth and scale",
        aiPromptContext: "Develop strategies for scaling infrastructure, team, and operations."
      }
    ]
  }
];

export const getPhaseStructure = (phaseNumber: number): PhaseStructure | undefined => {
  return PHASE_STRUCTURES.find(p => p.phaseNumber === phaseNumber);
};

export const getPhaseTask = (phaseNumber: number, taskId: string): PhaseTask | undefined => {
  const phase = getPhaseStructure(phaseNumber);
  return phase?.tasks.find(t => t.id === taskId);
};