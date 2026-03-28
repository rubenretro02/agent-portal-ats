# Agent Portal ATS - Agent Mail Feature

## Completed
- [x] Clone repository from GitHub
- [x] Create feature/agent-mail-switch branch
- [x] Install ssh2 dependency for SSH connection
- [x] Create /api/mail/activate endpoint (creates mailbox via SSH)
- [x] Create /api/mail/status endpoint (get/toggle mail status)
- [x] Create AgentMailSection component with Switch UI
- [x] Integrate component in agent profile page (/agents/[agentId])
- [x] Update .env.example with mail server SSH configuration
- [x] Test linting - passed
- [x] Commit and push to feature/agent-mail-switch branch

## Manual Steps Required
- [ ] Run SQL schema in Supabase (see supabase/mail_schema.sql)
- [ ] Configure environment variables in production:
  - MAIL_DOMAIN
  - MAIL_SERVER_HOST
  - MAIL_SERVER_SSH_PORT
  - MAIL_SERVER_SSH_USER
  - MAIL_SERVER_SSH_PASSWORD
  - MAIL_SERVER_SETUP_PATH
  - MAIL_ENCRYPTION_KEY

## Files Created/Modified
### New Files:
- `src/app/api/mail/activate/route.ts` - API to create mailbox via SSH
- `src/app/api/mail/status/route.ts` - API to get/toggle mail status
- `src/components/mail/AgentMailSection.tsx` - UI component with switch

### Modified Files:
- `src/app/agents/[agentId]/page.tsx` - Added AgentMailSection
- `.env.example` - Added mail server SSH variables
- `package.json` / `bun.lock` - Added ssh2 dependency

## Branch Info
- Branch: `feature/agent-mail-switch`
- Pushed to: https://github.com/rubenretro02/agent-portal-ats
- PR URL: https://github.com/rubenretro02/agent-portal-ats/pull/new/feature/agent-mail-switch
