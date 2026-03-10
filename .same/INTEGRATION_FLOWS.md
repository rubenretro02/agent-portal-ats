# Integration Flows: Portal ↔ ATS

## 1. Agent Registration Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Portal
    participant API
    participant ATS
    participant DB

    Agent->>Portal: Submit registration form
    Portal->>API: POST /api/auth/register
    API->>DB: Create user record
    API->>ATS: Create agent in pipeline (status: applied)
    ATS->>DB: Save agent with atsId
    ATS-->>API: Return agent data
    API-->>Portal: Success + JWT token
    Portal->>Agent: Redirect to dashboard
```

## 2. Document Upload Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Portal
    participant API
    participant Storage
    participant ATS

    Agent->>Portal: Upload document (W-9, NDA, etc.)
    Portal->>API: POST /api/documents/upload
    API->>Storage: Store file (S3/R2)
    Storage-->>API: Return file URL
    API->>ATS: Create document record
    ATS->>ATS: Trigger webhook: document.uploaded
    ATS-->>API: Document created
    API-->>Portal: Upload success
    Portal->>Agent: Show pending status
```

## 3. Pipeline Status Change Flow

```mermaid
sequenceDiagram
    participant Recruiter
    participant ATS
    participant API
    participant Portal
    participant Agent

    Recruiter->>ATS: Move agent to next stage
    ATS->>API: PUT /api/agents/:id/status
    API->>API: Update status in DB
    API->>API: Check automation rules
    alt Automation: Send notification
        API->>Portal: Create notification
        API->>Agent: Send email/SMS
    end
    alt Automation: Unlock campaign
        API->>API: Add campaign access
    end
    API-->>ATS: Status updated
    ATS-->>Recruiter: Show success
    Note over Portal,Agent: Real-time sync via WebSocket/polling
```

## 4. Campaign Application Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Portal
    participant API
    participant ATS
    participant Recruiter

    Agent->>Portal: Click "Apply" on campaign
    Portal->>API: POST /api/campaigns/:id/apply
    API->>API: Verify agent eligibility
    alt Agent eligible
        API->>ATS: Create application record
        ATS->>ATS: Trigger webhook: campaign.applied
        API-->>Portal: Application submitted
        Portal->>Agent: Show "Applied" status
        ATS->>Recruiter: New application notification
    else Agent not eligible
        API-->>Portal: Return requirements not met
        Portal->>Agent: Show missing requirements
    end
```

## 5. Onboarding Step Completion Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Portal
    participant API
    participant ATS

    Agent->>Portal: Complete onboarding step
    Portal->>API: POST /api/onboarding/:stepId/complete
    API->>API: Validate step data
    API->>ATS: Update step status
    ATS->>ATS: Check if all steps complete
    alt All steps complete
        ATS->>API: Update pipeline status
        API->>API: Trigger automation rules
    end
    API-->>Portal: Step completed
    Portal->>Agent: Show next step
```

## Key Webhook Events

| Event | Trigger | Data Payload |
|-------|---------|--------------|
| `agent.created` | New registration | `{ agentId, email, atsId }` |
| `agent.status_changed` | Pipeline move | `{ agentId, oldStatus, newStatus, changedBy }` |
| `document.uploaded` | Doc upload | `{ agentId, documentId, type, status }` |
| `document.approved` | Doc review | `{ agentId, documentId, reviewedBy }` |
| `campaign.assigned` | Agent assigned | `{ agentId, campaignId, startDate }` |
| `evaluation.completed` | Assessment done | `{ agentId, evaluationType, score }` |

## API Endpoints Summary

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new agent |
| POST | `/api/auth/login` | Agent/Admin login |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/auth/me` | Get current user |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents (admin) |
| GET | `/api/agents/:id` | Get agent details |
| PUT | `/api/agents/:id` | Update agent profile |
| PUT | `/api/agents/:id/status` | Update pipeline status |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload document |
| GET | `/api/documents/:id` | Get document |
| PUT | `/api/documents/:id/status` | Approve/reject doc |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns/:id/apply` | Apply to campaign |
| GET | `/api/campaigns/:id/agents` | Get campaign agents |

### Onboarding
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/onboarding/steps` | Get onboarding steps |
| POST | `/api/onboarding/:stepId/complete` | Complete step |

## Sync Mechanisms

1. **Real-time Updates**: WebSocket connections for instant UI updates
2. **Polling**: Fallback 30-second polling for status changes
3. **Webhooks**: Outgoing webhooks for external integrations
4. **Event Queue**: Redis-backed queue for async processing
