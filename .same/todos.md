# Agent Portal ATS - Todos

## Agent Mail Feature

### Completed
- [x] Created mail store (Zustand) with state management
- [x] Created MailLayout component
- [x] Created MailSidebar component (Gmail-style folders)
- [x] Created MailList component (email list with search)
- [x] Created MailView component (email reader)
- [x] Created ComposeModal component (compose new email)
- [x] Added "Agent Mail" to sidebar navigation
- [x] Added translations (English/Spanish)
- [x] Created API routes for IMAP/SMTP (ready for integration)
- [x] Updated .env.example with mail configuration

### Pending (When setting up mail server)
- [ ] Set up mail server (Stalwart/Mailcow on Hetzner)
- [ ] Configure DNS records (SPF, DKIM, DMARC)
- [ ] Create mailboxes for agents
- [ ] Implement user mail credentials storage (encrypted)
- [ ] Connect API routes to real IMAP/SMTP
- [ ] Add attachments upload functionality
- [ ] Add email threading/conversations
- [ ] Add contact autocomplete
- [ ] Add email signatures

## Future Enhancements
- [ ] Calendar integration (if using SOGo backend)
- [ ] Email templates
- [ ] Scheduled sending
- [ ] Email analytics
