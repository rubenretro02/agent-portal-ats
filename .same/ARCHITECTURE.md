# AgentHub - Architecture Documentation

## System Overview

AgentHub is a unified platform combining an **Agent Portal** (for 1099 contractors) with an **Applicant Tracking System (ATS)** for recruiters. The system is designed for high-volume call center operations with remote agents.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AGENTHUB PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │    AGENT PORTAL     │◄───────►│      ATS ADMIN      │                │
│  │  (Client-Facing)    │   Sync  │   (Recruiter UI)    │                │
│  └──────────┬──────────┘         └──────────┬──────────┘                │
│             │                               │                            │
│             └───────────┬───────────────────┘                            │
│                         │                                                │
│                         ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                       SHARED API LAYER                            │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  │   │
│  │  │  Auth   │  │ Agents  │  │Campaign │  │  Docs   │  │ Notify │  │   │
│  │  │   API   │  │   API   │  │   API   │  │   API   │  │   API  │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                         │                                                │
│                         ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    CORE SERVICES                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │ Pipeline │  │ Document │  │  Webhook │  │   Notification   │  │   │
│  │  │  Engine  │  │  Store   │  │  Events  │  │     Service      │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                         │                                                │
│                         ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    DATA LAYER                                     │   │
│  │  ┌─────────────────────────┐  ┌────────────────────────────────┐ │   │
│  │  │   PostgreSQL Database   │  │   Document Storage (S3/R2)     │ │   │
│  │  │   - Agents              │  │   - W-9 Forms                  │ │   │
│  │  │   - Campaigns           │  │   - Contracts                  │ │   │
│  │  │   - Applications        │  │   - ID Documents               │ │   │
│  │  │   - Documents (meta)    │  │   - Signed Agreements          │ │   │
│  │  └─────────────────────────┘  └────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Portal ↔ ATS Synchronization

```
┌────────────┐                  ┌────────────┐                  ┌────────────┐
│   AGENT    │                  │    API     │                  │    ATS     │
│   PORTAL   │                  │   LAYER    │                  │   ADMIN    │
└─────┬──────┘                  └─────┬──────┘                  └─────┬──────┘
      │                               │                               │
      │ 1. Agent applies to campaign  │                               │
      │──────────────────────────────►│                               │
      │                               │ 2. Create application record  │
      │                               │──────────────────────────────►│
      │                               │                               │
      │                               │ 3. Webhook: agent.applied     │
      │                               │◄──────────────────────────────│
      │                               │                               │
      │ 4. Update UI with status      │                               │
      │◄──────────────────────────────│                               │
      │                               │                               │
      │                               │ 5. Recruiter reviews app      │
      │                               │◄──────────────────────────────│
      │                               │                               │
      │                               │ 6. Status changed: screening  │
      │                               │──────────────────────────────►│
      │                               │                               │
      │ 7. Webhook: status_changed    │                               │
      │◄──────────────────────────────│                               │
      │                               │                               │
      │ 8. Notification to agent      │                               │
      │◄──────────────────────────────│                               │
      │                               │                               │
```

## Component Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── login/page.tsx            # Agent login
│   ├── register/page.tsx         # Agent registration
│   ├── dashboard/page.tsx        # Agent dashboard
│   ├── campaigns/page.tsx        # Campaign listings
│   ├── onboarding/page.tsx       # Onboarding steps
│   ├── documents/page.tsx        # Document management
│   ├── messages/page.tsx         # Messages/notifications
│   ├── profile/page.tsx          # Agent profile
│   ├── settings/page.tsx         # Settings
│   └── admin/                    # ATS Admin section
│       ├── page.tsx              # Admin dashboard
│       ├── agents/page.tsx       # Agent management
│       ├── campaigns/page.tsx    # Campaign management
│       └── pipelines/page.tsx    # Pipeline configuration
├── components/
│   ├── layout/                   # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PortalLayout.tsx
│   └── ui/                       # shadcn/ui components
├── hooks/
│   └── useTranslation.ts         # i18n hook
├── lib/
│   ├── utils.ts                  # Utility functions
│   └── constants.ts              # App constants & translations
├── store/
│   └── index.ts                  # Zustand stores
└── types/
    └── index.ts                  # TypeScript definitions
```

## API Endpoints (Proposed)

### Authentication
```
POST   /api/auth/login           # Agent login
POST   /api/auth/register        # Agent registration
POST   /api/auth/logout          # Logout
GET    /api/auth/me              # Get current user
POST   /api/auth/refresh         # Refresh token
```

### Agents
```
GET    /api/agents               # List agents (admin)
GET    /api/agents/:id           # Get agent details
PUT    /api/agents/:id           # Update agent
GET    /api/agents/:id/documents # Get agent documents
POST   /api/agents/:id/documents # Upload document
```

### Pipeline
```
GET    /api/pipeline/stages      # Get pipeline stages
PUT    /api/agents/:id/status    # Update agent status
GET    /api/pipeline/metrics     # Get pipeline metrics
```

### Campaigns
```
GET    /api/campaigns            # List campaigns
GET    /api/campaigns/:id        # Get campaign details
POST   /api/campaigns/:id/apply  # Apply to campaign
GET    /api/campaigns/:id/agents # Get campaign agents
```

### Documents
```
POST   /api/documents/upload     # Upload document
GET    /api/documents/:id        # Get document
PUT    /api/documents/:id/status # Update document status
POST   /api/documents/:id/sign   # Sign document
```

### Webhooks (Outgoing)
```
POST   [configured_url]          # agent.created
POST   [configured_url]          # agent.status_changed
POST   [configured_url]          # document.uploaded
POST   [configured_url]          # document.approved
POST   [configured_url]          # campaign.assigned
```

## Database Schema (Proposed)

```sql
-- Users table (shared authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'agent', 'admin', 'recruiter'
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  ats_id VARCHAR(50) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address JSONB,
  pipeline_status VARCHAR(50),
  pipeline_stage INT,
  application_date TIMESTAMP,
  equipment JSONB,
  availability JSONB,
  scores JSONB,
  languages TEXT[],
  skills TEXT[],
  preferred_language VARCHAR(10),
  timezone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  client VARCHAR(255),
  status VARCHAR(50),
  requirements JSONB,
  compensation JSONB,
  schedule JSONB,
  capacity JSONB,
  training JSONB,
  tags TEXT[],
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  campaign_id UUID REFERENCES campaigns(id),
  status VARCHAR(50),
  applied_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id)
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  type VARCHAR(50),
  name VARCHAR(255),
  url VARCHAR(500),
  status VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  expires_at TIMESTAMP
);

-- Pipeline stages table
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  status VARCHAR(50),
  order_index INT,
  color VARCHAR(20),
  automations JSONB
);

-- Webhook events table
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  type VARCHAR(100),
  agent_id UUID REFERENCES agents(id),
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

1. **Authentication**: JWT tokens with refresh mechanism
2. **Authorization**: Role-based access control (RBAC)
3. **Data Encryption**: All sensitive data encrypted at rest
4. **Document Security**: Signed URLs for document access
5. **SSN Handling**: PCI-compliant storage for W-9 data
6. **Audit Logging**: All actions logged for compliance

## Scalability

- Stateless API design for horizontal scaling
- Redis for session management and caching
- Message queue for async operations (webhooks, emails)
- CDN for static assets
- Database read replicas for high-read workloads

## Integration Points

1. **SSO Providers**: OAuth2/OIDC integration
2. **Background Check**: API integration with verification services
3. **E-Sign**: DocuSign/HelloSign integration
4. **SMS/Email**: Twilio/SendGrid integration
5. **Payment**: Stripe/Payoneer for contractor payments
