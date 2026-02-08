# Supabase Setup Guide for AgentHub

This guide will help you set up Supabase as the backend for the AgentHub platform.

## Prerequisites

- A Supabase account (free tier works fine)
- Access to the Supabase dashboard

## Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Enter a project name (e.g., "agenthub")
4. Set a secure database password
5. Choose a region close to your users
6. Click "Create new project"

Wait for the project to be provisioned (takes 1-2 minutes).

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")

## Step 3: Configure Environment Variables

Create a `.env` file in the `agent-portal-ats` directory:

```bash
cp .env.example .env
```

Edit the `.env` file and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Run the Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)

This will create all the necessary tables with Row Level Security (RLS) policies.

## Step 5: Configure Authentication

1. Go to **Authentication** > **Providers**
2. Ensure **Email** is enabled
3. (Optional) For testing, go to **Authentication** > **Settings**
   - Disable "Confirm email" to skip email verification during development

## Step 6: Create Storage Bucket (for documents)

1. Go to **Storage**
2. Click "New bucket"
3. Name it `documents`
4. Set it to **Private** or **Public** based on your needs
5. Click "Create bucket"

## Step 7: Create Your First Admin User

### Option A: Via SQL (Recommended for first admin)

1. First, sign up a user through the app
2. Then run this SQL to upgrade them to admin:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### Option B: Manually in the Dashboard

1. Go to **Authentication** > **Users**
2. Click "Add user" > "Create new user"
3. Enter email and password
4. Then run the SQL above to set the role

## Step 8: Test Your Setup

1. Start the development server:
   ```bash
   cd agent-portal-ats
   bun run dev
   ```

2. Open http://localhost:3000
3. Click "Agent Login" or "Admin Portal"
4. Create a new account or sign in

## Database Schema Overview

### Tables Created:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends Supabase auth) |
| `agents` | Agent-specific data and pipeline status |
| `opportunities` | Job opportunities/campaigns |
| `application_questions` | Custom questions per opportunity |
| `applications` | Agent applications to opportunities |
| `application_answers` | Answers to application questions |
| `documents` | Uploaded documents (W-9, ID, etc.) |
| `notifications` | Agent notifications |
| `messages` | In-app messages |
| `onboarding_steps` | Onboarding progress tracking |

### Automatic Triggers:

- **on_auth_user_created**: Automatically creates a profile and agent record when a new user signs up
- **set_*_updated_at**: Automatically updates the `updated_at` timestamp on record changes

### Row Level Security (RLS):

All tables have RLS policies that:
- Allow agents to read/write only their own data
- Allow admins and recruiters to read all data
- Allow admins to manage opportunities and approve documents

## Troubleshooting

### "Supabase not configured" Error

Make sure your `.env` file has the correct values and the dev server was restarted after adding them.

### "Invalid login credentials" Error

1. Check if the user exists in Authentication > Users
2. Verify the email is confirmed (or disable confirmation for testing)

### Tables Not Found

Make sure you ran the full schema.sql in the SQL editor without errors.

### RLS Blocking Requests

Check the browser console and Supabase logs for policy violations. You may need to adjust RLS policies for your use case.

## Next Steps

- Set up email notifications with Resend or SendGrid
- Configure custom domain for Supabase
- Enable additional auth providers (Google, GitHub, etc.)
- Set up database backups
