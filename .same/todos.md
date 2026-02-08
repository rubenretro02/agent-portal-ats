# AgentHub Portal - TODOs

## Completed ✅
- [x] Supabase integration with real backend
- [x] User authentication (email/password)
- [x] Dashboard with profile and agent data
- [x] Opportunities page with application forms
- [x] Admin portal for recruiters
- [x] Fixed TypeScript/ESLint errors
- [x] Updated Next.js to v16.1.6 for security
- [x] **Deployed to Netlify** - https://same-t78xqt2a480-latest.netlify.app
- [x] Fixed opportunities page (sync AuthProvider with store)
- [x] Created real onboarding flow with multi-step form (address, phone, equipment, languages)
- [x] Updated dashboard to show dynamic onboarding progress
- [x] Added navigation menu to dashboard
- [x] Fixed PortalLayout to use AuthContext instead of old mock store
- [x] Added profile page with edit functionality
- [x] Fixed navigation sidebar with proper links
- [x] Removed eligibility restrictions - anyone can apply to opportunities
- [x] Created "Mis Aplicaciones" page to view applied opportunities
- [x] Added job details dialog before application form
- [x] **Admin portal now uses real Supabase auth** (not demo/mock)
- [x] Admin login verifies user role is 'admin' or 'recruiter'
- [x] AdminLayout verifies session on initial load
- [x] **Admin can CREATE real opportunities in Supabase**
- [x] **Admin can UPDATE/PAUSE/ACTIVATE opportunities**
- [x] **Admin can DELETE (close) opportunities**
- [x] **Inline question builder in opportunity creation dialog**
- [x] **System check integrated into onboarding as automated step**
- [x] Removed manual equipment questions from onboarding
- [x] System check automatically detects: internet speed, hardware, webcam, mic, VPN
- [x] System check results saved to agent profile (cannot be manually modified)
- [x] Removed system check page from agent portal navigation
- [x] **Combined Dashboard and Opportunities into single page**
- [x] Dashboard shows onboarding steps first (if not complete)
- [x] Each onboarding step saves independently when submitted
- [x] After onboarding complete, dashboard shows opportunities grid
- [x] Removed black welcome box and stats cards (Calls, Hours, Score, Earnings)
- [x] Only shows "Complete your profile" notification when onboarding incomplete
- [x] Added zoom hover effect (1.03 scale) on opportunity cards
- [x] Added teal shadow glow and color transitions on hover
- [x] Icons scale up with colored backgrounds on hover
- [x] Arrow animates to the right on hover
- [x] Applied to both Dashboard and Opportunities pages
- [x] **Simplified signup to username, email, password only**
- [x] Personal info now collected during onboarding (not signup)
- [x] Added onboarding popup for first-time users
- [x] DOB and last name locked after first save
- [x] Username login support with email lookup
- [x] **Personal Info Popup Improvements (v49)**
- [x] Removed username and email from personal info form (already collected at signup)
- [x] Changed DOB to MM/DD/YYYY format with separate Month/Day/Year select dropdowns
- [x] Personal info now opens in popup dialog instead of inline collapsible
- [x] Popup is dismissible with "Later" button
- [x] Created RequirePersonalInfo component to block access until complete
- [x] Protected pages: opportunities, applications, profile
- [x] **Onboarding UI Improvements (v52)**
- [x] Made Address section collapsible with read-only view and Edit popup (like Personal Info)
- [x] Made Languages & Availability section collapsible with read-only view and Edit popup
- [x] Added new **Work Experience** section with fields:
  - Years of experience (required)
  - Previous role
  - Previous company
  - Key skills
  - Certifications
- [x] Reordered onboarding steps:
  1. Personal Information
  2. Address
  3. Work Experience (NEW)
  4. Languages & Availability
  5. System Check (LAST)
- [x] All sections now use consistent collapsible UI with read-only display and Edit button
- [x] **Address & Phone Validation (v54)**
- [x] Added US states dropdown selector (50 states + DC + Puerto Rico)
- [x] Added second address line field (Apt, Suite, Unit, etc.)
- [x] State field shows dropdown for US, text input for other countries
- [x] Added ZIP code validation for US format (12345 or 12345-6789)
- [x] Added automatic ZIP code formatting
- [x] Added phone number formatting as user types: (XXX) XXX-XXXX
- [x] Added phone number validation (must be 10 digits)
- [x] Created AddressAutocomplete component with Google Places API integration
- [x] Address autocomplete auto-fills: street, city, state, ZIP, country
- [x] Country selection at top of address form for better UX

## Dashboard Flow
The dashboard now works as follows:
1. **If onboarding is incomplete:**
   - Shows "Complete your profile" notification with progress (5 steps now)
   - Shows collapsible onboarding steps:
     1. Personal Information (popup for editing)
     2. Address (popup for editing)
     3. Work Experience (popup for editing)
     4. Languages & Availability (popup for editing)
     5. System Check (inline, automated)
   - Each step shows read-only info when expanded, with Edit button
   - First-time users see a popup to complete personal info before continuing

2. **If onboarding is complete:**
   - Shows opportunities grid with search and filter
   - Can apply to opportunities directly from the dashboard
   - Dialog shows opportunity details before applying

## How to Create Admin Users
To create admin or recruiter accounts:
1. User registers via the agent portal (creates profile with role='agent')
2. Admin updates the role in Supabase Dashboard:
   - Go to Table Editor > profiles
   - Find the user by email
   - Change `role` from 'agent' to 'admin' or 'recruiter'
3. User can now login via /admin/login

## Signup Flow
1. User creates account with just username, email, and password
2. After login, user is redirected to dashboard
3. If personal info is not complete, a popup appears forcing completion
4. User must fill: first name, middle name, last name, sex, DOB, phone
5. After saving, user can continue with other onboarding steps
6. DOB and last name are locked after first save (cannot be changed)

## Google Places API Setup (Optional)
To enable address autocomplete:
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable the "Places API"
4. Create an API key with restrictions (HTTP referrers recommended)
5. Add to `.env.local`: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key`
6. Restart the dev server

Note: Address autocomplete works without the API key, but won't show suggestions.

## Pending
- [ ] Deploy latest version (v54) to Netlify

## Future Enhancements
- [ ] Downloadable system check tool for more accurate hardware detection
- [ ] Require system check before applying to specific jobs
- [ ] Add password reset functionality
- [ ] Implement document upload to Supabase Storage
- [ ] Add email notifications with Resend
- [ ] Create analytics dashboard for admin
- [ ] Username availability check during signup
- [ ] Profile picture upload
- [ ] International phone number support
- [ ] Address validation for non-US countries
