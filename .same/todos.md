# TODO List - Agent Mail Fixes

## Completed
- [x] Fixed mail/page.tsx to handle page reloads properly
  - Added timestamp parameter to prevent caching
  - Added logout=1 parameter to force Roundcube logout
  - Added iframeKey to force iframe remount
  - Added refresh button for manual refresh
  - Added forceRefresh parameter to initializeSSO

- [x] Fixed api/mail/sso/route.ts to handle logout requests
  - Added forceLogout parameter check
  - Added nonce to JWT payload for uniqueness
  - Extended JWT expiry from 60 to 120 seconds
  - Added _logout parameter to SSO URL

- [x] Updated scripts/roundcube-sso/sso.php
  - Added _logout parameter handling
  - Modified autoLogin to perform logout before login if requested
  - Added async performLogin function with proper logout handling
  - Improved CSRF token handling

## Pending Deployment
- [ ] Deploy updated sso.php to mail server (mail.agent-mail.online)
- [ ] Verify MAIL_SERVER_API_URL and MAIL_SERVER_API_KEY are correctly configured
- [ ] Test mail activation flow
- [ ] Test page reload behavior

## Notes
- The "Failed to create mailbox on server" error occurs when the mail server API fails
- This requires proper MAIL_SERVER_API_URL and MAIL_SERVER_API_KEY configuration
- The SSO "Petición inválida" error was caused by CSRF token mismatch on page reload
