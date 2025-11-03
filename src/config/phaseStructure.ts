// Define the structure of each phase with its sub-phases and tasks
export interface PhaseTask {
  id: string;
  title: string;
  description: string;
  estimatedTokens: number;
  aiPromptContext: string;
  artifactType?: string; // Type of artifact this task produces
  dependencies?: string[]; // IDs of tasks that must be completed first
}

export interface PhaseStructure {
  phaseNumber: number;
  phaseName: string;
  duration: string;
  totalTokens: string;
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
    duration: "30-60 min",
    totalTokens: "500-1,500",
    description: "Quick validation to determine if the idea is worth pursuing",
    decisionGate: "Go/No-Go/Parking Lot",
    tasks: [
      {
        id: "problem-validation",
        title: "Problem Validation",
        description: "Validate that this is a real, painful problem",
        estimatedTokens: 300,
        aiPromptContext: "Help the user articulate the problem clearly. Ask: Who experiences this problem? How often? What's the current pain level? What happens if it's not solved?"
      },
      {
        id: "personal-fit",
        title: "Personal Fit Assessment",
        description: "Assess founder-market fit and passion",
        estimatedTokens: 300,
        aiPromptContext: "Explore why this founder cares about this problem. Ask about their domain knowledge, personal experience, passion level, and unfair advantages."
      },
      {
        id: "market-sizing",
        title: "Quick Market Sizing",
        description: "Rough estimate of market potential",
        estimatedTokens: 400,
        aiPromptContext: "Help estimate the total addressable market. Ask about target audience size, willingness to pay, and competitive landscape."
      },
      {
        id: "mvp-clarity",
        title: "MVP Clarity",
        description: "Define what can be built and validated quickly",
        estimatedTokens: 500,
        aiPromptContext: "Help define the simplest version that solves the core problem. What's the one feature that delivers 80% of the value? What can be validated in 30-60 days?"
      }
    ]
  },
  {
    phaseNumber: 2,
    phaseName: "Validation & Research",
    duration: "1-2 weeks",
    totalTokens: "60,000",
    description: "Deep market research and validation",
    decisionGate: "Go/Pivot/Kill",
    tasks: [
      {
        id: "market-research",
        title: "Market Research",
        description: "Comprehensive market analysis",
        estimatedTokens: 15000,
        aiPromptContext: "Guide comprehensive market research covering market size, trends, growth rate, and market dynamics.",
        artifactType: "market_research"
      },
      {
        id: "competitive-analysis",
        title: "Competitive Analysis",
        description: "Deep dive into existing solutions",
        estimatedTokens: 15000,
        aiPromptContext: "Analyze direct and indirect competitors, their strengths, weaknesses, pricing, and market positioning.",
        artifactType: "competitive_analysis"
      },
      {
        id: "customer-interviews",
        title: "Customer Interview Analysis",
        description: "Synthesize insights from target customers",
        estimatedTokens: 15000,
        aiPromptContext: "Help structure and analyze customer interview findings. Extract pain points, willingness to pay, and buying criteria.",
        artifactType: "customer_interviews"
      },
      {
        id: "business-model",
        title: "Business Model Canvas",
        description: "Define the business model",
        estimatedTokens: 15000,
        aiPromptContext: "Work through the Business Model Canvas: value proposition, customer segments, channels, revenue streams, cost structure, key resources, and partnerships.",
        artifactType: "business_model_canvas"
      }
    ]
  },
  {
    phaseNumber: 3,
    phaseName: "Product Definition",
    duration: "3-5 days",
    totalTokens: "40,000",
    description: "Define product requirements and specifications",
    decisionGate: "Build/Refine/Stop",
    tasks: [
      {
        id: "user-personas",
        title: "User Personas",
        description: "Create detailed user personas",
        estimatedTokens: 10000,
        aiPromptContext: "Develop 2-3 detailed user personas with demographics, goals, pain points, and behaviors.",
        artifactType: "user_personas"
      },
      {
        id: "user-stories",
        title: "User Stories",
        description: "Write comprehensive user stories",
        estimatedTokens: 10000,
        aiPromptContext: "Create user stories in the format: As a [user], I want to [action], so that [benefit]. Prioritize by value and effort.",
        artifactType: "user_stories"
      },
      {
        id: "feature-specification",
        title: "Feature Specification",
        description: "Detail all MVP features",
        estimatedTokens: 10000,
        aiPromptContext: "Specify each feature with acceptance criteria, edge cases, and success metrics.",
        artifactType: "feature_specification"
      },
      {
        id: "prd-generation",
        title: "PRD Generation",
        description: "Generate comprehensive Product Requirements Document",
        estimatedTokens: 10000,
        aiPromptContext: "Compile all information into a structured PRD covering product vision, features, requirements, and success metrics.",
        artifactType: "prd"
      }
    ]
  },
  {
    phaseNumber: 4,
    phaseName: "Technical Planning",
    duration: "2-3 days",
    totalTokens: "30,000",
    description: "Plan the technical architecture and stack",
    decisionGate: "Ready/Need More Info",
    tasks: [
      {
        id: "tech-stack",
        title: "Technology Stack Selection",
        description: "Choose appropriate technologies",
        estimatedTokens: 8000,
        aiPromptContext: "Recommend tech stack based on requirements, team skills, scalability needs, and timeline.",
        artifactType: "tech_stack"
      },
      {
        id: "architecture",
        title: "System Architecture",
        description: "Design system architecture",
        estimatedTokens: 10000,
        aiPromptContext: "Design the system architecture including frontend, backend, database, and third-party integrations.",
        artifactType: "architecture"
      },
      {
        id: "data-model",
        title: "Data Model Design",
        description: "Design database schema",
        estimatedTokens: 7000,
        aiPromptContext: "Design the data model with entities, relationships, and key attributes.",
        artifactType: "database_schema"
      },
      {
        id: "integration-plan",
        title: "Integration Planning",
        description: "Plan third-party integrations",
        estimatedTokens: 5000,
        aiPromptContext: "Identify and plan all necessary third-party integrations, APIs, and services.",
        artifactType: "api_design"
      }
    ]
  },
  {
    phaseNumber: 5,
    phaseName: "Design & Prototype",
    duration: "1 week",
    totalTokens: "50,000",
    description: "Create designs and interactive prototype",
    decisionGate: "Approve/Revise",
    tasks: [
      {
        id: "wireframes",
        title: "Wireframes",
        description: "Create low-fidelity wireframes",
        estimatedTokens: 12000,
        aiPromptContext: "Guide the creation of wireframes for all key screens and user flows.",
        artifactType: "wireframes"
      },
      {
        id: "ui-design",
        title: "UI Design",
        description: "Design high-fidelity mockups",
        estimatedTokens: 15000,
        aiPromptContext: "Help create detailed UI designs with color schemes, typography, and component libraries.",
        artifactType: "design_system"
      },
      {
        id: "user-flows",
        title: "User Flow Mapping",
        description: "Map all user journeys",
        estimatedTokens: 8000,
        aiPromptContext: "Map out complete user flows from entry points to goal completion.",
        artifactType: "user_flows"
      },
      {
        id: "prototype",
        title: "Interactive Prototype",
        description: "Build clickable prototype",
        estimatedTokens: 15000,
        aiPromptContext: "Guide the creation of an interactive prototype for user testing.",
        artifactType: "prototype"
      }
    ]
  },
  {
    phaseNumber: 6,
    phaseName: "Development Preparation",
    duration: "1-2 days",
    totalTokens: "20,000",
    description: "Prepare for development phase",
    decisionGate: "Start Development",
    tasks: [
      {
        id: "dev-environment",
        title: "Development Environment",
        description: "Set up development environment",
        estimatedTokens: 5000,
        aiPromptContext: "Guide setup of development environment, version control, and CI/CD pipeline."
      },
      {
        id: "task-breakdown",
        title: "Task Breakdown",
        description: "Break work into development tasks",
        estimatedTokens: 8000,
        aiPromptContext: "Break down features into specific, actionable development tasks with estimates."
      },
      {
        id: "prompt-generation",
        title: "AI Prompt Generation",
        description: "Generate prompts for AI-assisted development",
        estimatedTokens: 7000,
        aiPromptContext: "Create detailed prompts for AI to assist with code generation, organized by feature and priority."
      }
    ]
  },
  {
    phaseNumber: 7,
    phaseName: "AI-Assisted Development",
    duration: "2-4 weeks",
    totalTokens: "200,000+",
    description: "Build the product with AI assistance",
    decisionGate: "Feature Complete",
    tasks: [
      {
        id: "core-features",
        title: "Core Features Development",
        description: "Build essential features",
        estimatedTokens: 80000,
        aiPromptContext: "Guide implementation of core features with code generation and problem-solving assistance."
      },
      {
        id: "ui-implementation",
        title: "UI Implementation",
        description: "Build user interface",
        estimatedTokens: 60000,
        aiPromptContext: "Assist with frontend implementation, ensuring responsive design and user experience."
      },
      {
        id: "backend-api",
        title: "Backend & API",
        description: "Implement backend logic and APIs",
        estimatedTokens: 40000,
        aiPromptContext: "Help build backend services, database operations, and API endpoints."
      },
      {
        id: "testing-qa",
        title: "Testing & QA",
        description: "Test and fix issues",
        estimatedTokens: 20000,
        aiPromptContext: "Assist with writing tests, identifying bugs, and implementing fixes."
      }
    ]
  },
  {
    phaseNumber: 8,
    phaseName: "Launch Preparation",
    duration: "3-5 days",
    totalTokens: "30,000",
    description: "Prepare for product launch",
    decisionGate: "Ready to Deploy",
    tasks: [
      {
        id: "launch-strategy",
        title: "Launch Strategy",
        description: "Plan launch approach and channels",
        estimatedTokens: 8000,
        aiPromptContext: "Develop a comprehensive launch strategy including target channels, messaging, and timeline.",
        artifactType: "launch-strategy"
      },
      {
        id: "marketing-materials",
        title: "Marketing Materials",
        description: "Create launch materials",
        estimatedTokens: 10000,
        aiPromptContext: "Help create landing pages, social media content, email campaigns, and press materials."
      },
      {
        id: "analytics-setup",
        title: "Analytics Setup",
        description: "Set up tracking and analytics",
        estimatedTokens: 7000,
        aiPromptContext: "Guide setup of analytics, event tracking, and key metrics monitoring."
      },
      {
        id: "launch-checklist",
        title: "Launch Checklist",
        description: "Complete pre-launch checklist",
        estimatedTokens: 5000,
        aiPromptContext: "Work through final checklist: performance testing, security review, documentation, support setup.",
        artifactType: "launch-checklist"
      }
    ]
  },
  {
    phaseNumber: 9,
    phaseName: "Deployment & Go-Live",
    duration: "1-2 days",
    totalTokens: "15,000",
    description: "Deploy to production and launch",
    decisionGate: "Live/Rollback",
    tasks: [
      {
        id: "production-deployment",
        title: "Production Deployment",
        description: "Deploy to production environment",
        estimatedTokens: 5000,
        aiPromptContext: "Guide production deployment, DNS setup, SSL configuration, and environment variables.",
        artifactType: "deployment"
      },
      {
        id: "smoke-testing",
        title: "Smoke Testing",
        description: "Verify critical functionality in production",
        estimatedTokens: 4000,
        aiPromptContext: "Help create and execute smoke tests to verify all critical paths work in production."
      },
      {
        id: "launch-execution",
        title: "Launch Execution",
        description: "Execute launch plan",
        estimatedTokens: 4000,
        aiPromptContext: "Guide through launch execution: announcements, monitoring, and initial user onboarding."
      },
      {
        id: "monitoring-setup",
        title: "Monitoring & Alerts",
        description: "Set up production monitoring",
        estimatedTokens: 2000,
        aiPromptContext: "Configure monitoring, error tracking, and alerting for production environment."
      }
    ]
  },
  {
    phaseNumber: 10,
    phaseName: "Post-Launch Operations",
    duration: "Ongoing",
    totalTokens: "Variable",
    description: "Monitor, iterate, and scale",
    decisionGate: "Iterate/Scale",
    tasks: [
      {
        id: "user-feedback",
        title: "User Feedback Collection",
        description: "Gather and analyze user feedback",
        estimatedTokens: 0,
        aiPromptContext: "Help set up feedback channels and analyze user responses for insights."
      },
      {
        id: "metrics-analysis",
        title: "Metrics Analysis",
        description: "Analyze performance metrics",
        estimatedTokens: 0,
        aiPromptContext: "Guide analysis of key metrics: user acquisition, activation, retention, revenue.",
        artifactType: "metrics-analysis"
      },
      {
        id: "iteration-planning",
        title: "Iteration Planning",
        description: "Plan product iterations based on data",
        estimatedTokens: 0,
        aiPromptContext: "Help prioritize improvements and new features based on user feedback and metrics."
      },
      {
        id: "scaling-strategy",
        title: "Scaling Strategy",
        description: "Plan for growth and scale",
        estimatedTokens: 0,
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
