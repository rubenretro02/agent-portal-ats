-- =====================================================
-- AGENTHUB - SUPABASE SCHEMA
-- 1099 Agent Portal + ATS Database
-- =====================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (extends auth.users)
-- =====================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  first_name text not null,
  last_name text not null,
  phone text,
  role text not null default 'agent' check (role in ('agent', 'admin', 'recruiter')),
  is_active boolean default true,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- NOTE: Admin profile updates should be done via service role (API route) to avoid
-- infinite recursion. This policy uses auth.jwt() metadata to check role without
-- querying profiles table (which would cause infinite recursion).
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('admin', 'recruiter')
  );

-- =====================================================
-- AGENTS TABLE
-- =====================================================
create table public.agents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade unique not null,
  ats_id text unique default ('ATS-' || to_char(now(), 'YYYY') || '-' || lpad(floor(random() * 10000)::text, 4, '0')),
  pipeline_status text default 'applied' check (pipeline_status in ('applied', 'screening', 'background_check', 'training', 'approved', 'hired', 'active', 'inactive', 'rejected')),
  pipeline_stage integer default 1,
  application_date timestamp with time zone default timezone('utc'::text, now()) not null,
  last_status_change timestamp with time zone default timezone('utc'::text, now()) not null,
  address jsonb,
  languages jsonb default '[]'::jsonb,
  skills jsonb default '[]'::jsonb,
  experience jsonb default '[]'::jsonb,
  equipment jsonb,
  availability jsonb,
  scores jsonb default '{"overall": 0, "communication": 0, "technical": 0, "reliability": 0, "customerService": 0, "typing": 0}'::jsonb,
  preferred_language text default 'en' check (preferred_language in ('en', 'es')),
  timezone text default 'America/New_York',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.agents enable row level security;

-- Agents policies
create policy "Agents can view own data"
  on public.agents for select
  using (user_id = auth.uid());

create policy "Admins can view all agents"
  on public.agents for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'recruiter')
    )
  );

create policy "Agents can update own data"
  on public.agents for update
  using (user_id = auth.uid());

create policy "Admins can update any agent"
  on public.agents for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'recruiter')
    )
  );

create policy "Anyone can insert agent (for registration)"
  on public.agents for insert
  with check (user_id = auth.uid());

-- =====================================================
-- OPPORTUNITIES TABLE
-- =====================================================
create table public.opportunities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text not null,
  client text not null,
  status text default 'draft' check (status in ('draft', 'active', 'paused', 'closed')),
  category text,
  requirements jsonb,
  compensation jsonb,
  schedule jsonb,
  max_agents integer default 50,
  current_agents integer default 0,
  open_positions integer default 50,
  training jsonb,
  tags jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.opportunities enable row level security;

-- Opportunities policies
create policy "Active opportunities are viewable by authenticated users"
  on public.opportunities for select
  using (status = 'active' or exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'recruiter')
  ));

create policy "Admins can insert opportunities"
  on public.opportunities for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'recruiter')
    )
  );

create policy "Admins can update opportunities"
  on public.opportunities for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'recruiter')
    )
  );

create policy "Admins can delete opportunities"
  on public.opportunities for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =====================================================
-- APPLICATION QUESTIONS TABLE
-- =====================================================
create table public.application_questions (
  id uuid default uuid_generate_v4() primary key,
  opportunity_id uuid references public.opportunities on delete cascade not null,
  question text not null,
  question_es text,
  type text default 'text' check (type in ('text', 'textarea', 'select', 'multiselect', 'checkbox', 'radio', 'file', 'date', 'number')),
  required boolean default false,
  "order" integer default 0,
  options jsonb,
  placeholder text,
  placeholder_es text,
  validation jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.application_questions enable row level security;

-- Application questions policies
create policy "Questions viewable by authenticated users"
  on public.application_questions for select
  using (auth.uid() is not null);

create policy "Admins can manage questions"
  on public.application_questions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'recruiter')
    )
  );

-- =====================================================
-- APPLICATIONS TABLE
-- =====================================================
create table public.applications (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.agents on delete cascade not null,
  opportunity_id uuid references public.opportunities on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'in_review', 'approved', 'rejected', 'withdrawn')),
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone,
  reviewed_by uuid references public.profiles,
  notes text,
  confirmation_email_sent boolean default false,
  confirmation_email_sent_at timestamp with time zone,
  unique(agent_id, opportunity_id)
);

-- Enable RLS
alter table public.applications enable row level security;

-- Applications policies
create policy "Agents can view own applications"
  on public.applications for select
  using (
    agent_id in (select id from public.agents where user_id = auth.uid())
  );

create policy "Admins can view all applications"
  on public.applications for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'recruiter')
    )
  );

create policy "Agents can insert own applications"
  on public.applications for insert
  with check (
    agent_id in (select id from public.agents where user_id = auth.uid())
  );

create policy "Admins can update applications"
  on public.applications for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'recruiter')
    )
  );

-- =====================================================
-- APPLICATION ANSWERS TABLE
-- =====================================================
create table public.application_answers (
  id uuid default uuid_generate_v4() primary key,
  application_id uuid references public.applications on delete cascade not null,
  question_id uuid references public.application_questions on delete cascade not null,
  value jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.application_answers enable row level security;

-- Application answers policies
create policy "Agents can view own answers"
  on public.application_answers for select
  using (
    application_id in (
      select a.id from public.applications a
      join public.agents ag on a.agent_id = ag.id
      where ag.user_id = auth.uid()
    )
  );

create policy "Admins can view all answers"
  on public.application_answers for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'recruiter')
    )
  );

create policy "Agents can insert answers"
  on public.application_answers for insert
  with check (
    application_id in (
      select a.id from public.applications a
      join public.agents ag on a.agent_id = ag.id
      where ag.user_id = auth.uid()
    )
  );

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.agents on delete cascade not null,
  type text not null check (type in ('w9', 'nda', 'contract', 'id_front', 'id_back', 'background_consent', 'tax_form', 'other')),
  name text not null,
  url text not null,
  status text default 'pending' check (status in ('pending', 'uploaded', 'approved', 'rejected')),
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone,
  reviewed_by uuid references public.profiles,
  expires_at timestamp with time zone,
  notes text
);

-- Enable RLS
alter table public.documents enable row level security;

-- Documents policies
create policy "Agents can view own documents"
  on public.documents for select
  using (
    agent_id in (select id from public.agents where user_id = auth.uid())
  );

create policy "Admins can view all documents"
  on public.documents for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'recruiter')
    )
  );

create policy "Agents can insert own documents"
  on public.documents for insert
  with check (
    agent_id in (select id from public.agents where user_id = auth.uid())
  );

create policy "Agents can update own documents"
  on public.documents for update
  using (
    agent_id in (select id from public.agents where user_id = auth.uid())
  );

create policy "Admins can update documents"
  on public.documents for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'recruiter')
    )
  );

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.agents on delete cascade not null,
  type text not null check (type in ('status_change', 'document_approved', 'opportunity_available', 'message', 'reminder', 'system')),
  title text not null,
  message text not null,
  read boolean default false,
  action_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Notifications policies
create policy "Agents can view own notifications"
  on public.notifications for select
  using (
    agent_id in (select id from public.agents where user_id = auth.uid())
  );

create policy "Agents can update own notifications"
  on public.notifications for update
  using (
    agent_id in (select id from public.agents where user_id = auth.uid())
  );

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.agents on delete cascade not null,
  type text not null check (type in ('email', 'sms', 'in_app')),
  subject text not null,
  content text not null,
  read boolean default false,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_at timestamp with time zone,
  metadata jsonb
);

-- Enable RLS
alter table public.messages enable row level security;

-- Messages policies
create policy "Agents can view own messages"
  on public.messages for select
  using (
    agent_id in (select id from public.agents where user_id = auth.uid())
  );

create policy "Agents can update own messages"
  on public.messages for update
  using (
    agent_id in (select id from public.agents where user_id = auth.uid())
  );

-- =====================================================
-- ONBOARDING STEPS TABLE
-- =====================================================
create table public.onboarding_steps (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.agents on delete cascade not null,
  step_key text not null,
  name text not null,
  description text not null,
  "order" integer default 0,
  required_pipeline_status jsonb,
  is_required boolean default true,
  type text not null check (type in ('document', 'assessment', 'training', 'verification', 'info')),
  completed boolean default false,
  completed_at timestamp with time zone,
  data jsonb,
  unique(agent_id, step_key)
);

-- Enable RLS
alter table public.onboarding_steps enable row level security;

-- Onboarding steps policies
create policy "Agents can view own steps"
  on public.onboarding_steps for select
  using (
    agent_id in (select id from public.agents where user_id = auth.uid())
  );

create policy "Agents can update own steps"
  on public.onboarding_steps for update
  using (
    agent_id in (select id from public.agents where user_id = auth.uid())
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'agent')
  );

  -- If role is agent, create agent record
  if coalesce(new.raw_user_meta_data->>'role', 'agent') = 'agent' then
    insert into public.agents (user_id)
    values (new.id);

    -- Create default onboarding steps for the agent
    insert into public.onboarding_steps (agent_id, step_key, name, description, "order", is_required, type)
    select
      (select id from public.agents where user_id = new.id),
      step_key, name, description, "order", is_required, type
    from (values
      ('profile', 'Profile Information', 'Complete your personal and contact information', 1, true, 'info'),
      ('documents', 'Upload Documents', 'Submit required documents (W-9, ID, etc.)', 2, true, 'document'),
      ('assessment', 'Skills Assessment', 'Complete the typing test and skills evaluation', 3, true, 'assessment'),
      ('background', 'Background Check', 'Authorize and complete background verification', 4, true, 'verification'),
      ('contract', 'Sign Contract', 'Review and sign the Independent Contractor Agreement', 5, true, 'document'),
      ('training', 'Complete Training', 'Finish required opportunity training modules', 6, true, 'training')
    ) as steps(step_key, name, description, "order", is_required, type);
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger set_agents_updated_at
  before update on public.agents
  for each row execute procedure public.handle_updated_at();

create trigger set_opportunities_updated_at
  before update on public.opportunities
  for each row execute procedure public.handle_updated_at();

create trigger set_questions_updated_at
  before update on public.application_questions
  for each row execute procedure public.handle_updated_at();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert sample opportunities
insert into public.opportunities (name, description, client, status, category, requirements, compensation, training, max_agents, current_agents, open_positions, tags)
values
(
  'TechCare Premium Support',
  'Provide technical support for premium software customers. Handle escalated issues and ensure customer satisfaction.',
  'TechCare Inc.',
  'active',
  'Technical Support',
  '{"minScore": 75, "languages": ["English"], "skills": ["Technical Support", "Customer Service"], "minExperience": 6, "requiredDocuments": ["w9", "nda", "contract"], "equipmentRequirements": {"hasComputer": true, "hasHeadset": true, "internetSpeed": 50}, "backgroundCheckRequired": true}'::jsonb,
  '{"type": "hourly", "baseRate": 18, "bonusStructure": "Performance bonus up to $200/month", "currency": "USD"}'::jsonb,
  '{"required": true, "duration": 40, "modules": []}'::jsonb,
  50, 32, 18,
  '["Technical", "Premium", "Full-time"]'::jsonb
),
(
  'HealthLine Bilingual Support',
  'Provide customer support for healthcare insurance inquiries in English and Spanish.',
  'HealthLine Insurance',
  'active',
  'Healthcare',
  '{"minScore": 80, "languages": ["English", "Spanish"], "skills": ["Healthcare", "Bilingual (English/Spanish)"], "minExperience": 12, "requiredDocuments": ["w9", "nda", "contract", "background_consent"], "equipmentRequirements": {"hasComputer": true, "hasHeadset": true, "hasQuietSpace": true}, "backgroundCheckRequired": true}'::jsonb,
  '{"type": "hourly", "baseRate": 22, "bonusStructure": "Quality bonus + $2/hour for bilingual", "currency": "USD"}'::jsonb,
  '{"required": true, "duration": 60, "modules": []}'::jsonb,
  30, 12, 18,
  '["Healthcare", "Bilingual", "Premium Pay"]'::jsonb
),
(
  'ShopEasy Customer Care',
  'Handle order inquiries, returns, and general customer support for e-commerce platform.',
  'ShopEasy',
  'active',
  'Customer Service',
  '{"minScore": 70, "languages": ["English"], "skills": ["Customer Service", "E-commerce"], "minExperience": 3, "requiredDocuments": ["w9", "nda", "contract"], "equipmentRequirements": {"hasComputer": true, "hasHeadset": true}, "backgroundCheckRequired": false}'::jsonb,
  '{"type": "hourly", "baseRate": 15, "bonusStructure": "Sales commission on upsells", "currency": "USD"}'::jsonb,
  '{"required": true, "duration": 20, "modules": []}'::jsonb,
  100, 67, 33,
  '["E-commerce", "Entry Level", "Flexible"]'::jsonb
);

-- Insert sample application questions
insert into public.application_questions (opportunity_id, question, question_es, type, required, "order", options, placeholder, placeholder_es)
select
  id,
  'Why are you interested in this technical support opportunity?',
  '¿Por qué te interesa esta oportunidad de soporte técnico?',
  'textarea',
  true,
  1,
  null,
  'Share your motivation and relevant experience...',
  'Comparte tu motivación y experiencia relevante...'
from public.opportunities where name = 'TechCare Premium Support';

insert into public.application_questions (opportunity_id, question, question_es, type, required, "order", options)
select
  id,
  'How many years of technical support experience do you have?',
  '¿Cuántos años de experiencia en soporte técnico tienes?',
  'select',
  true,
  2,
  '[{"value": "0-1", "label": "Less than 1 year", "labelEs": "Menos de 1 año"}, {"value": "1-2", "label": "1-2 years", "labelEs": "1-2 años"}, {"value": "3-5", "label": "3-5 years", "labelEs": "3-5 años"}, {"value": "5+", "label": "5+ years", "labelEs": "5+ años"}]'::jsonb
from public.opportunities where name = 'TechCare Premium Support';

insert into public.application_questions (opportunity_id, question, question_es, type, required, "order", options)
select
  id,
  'Are you comfortable working weekends if needed?',
  '¿Estás cómodo trabajando fines de semana si es necesario?',
  'radio',
  true,
  3,
  '[{"value": "yes", "label": "Yes", "labelEs": "Sí"}, {"value": "no", "label": "No", "labelEs": "No"}, {"value": "sometimes", "label": "Sometimes", "labelEs": "A veces"}]'::jsonb
from public.opportunities where name = 'TechCare Premium Support';

insert into public.application_questions (opportunity_id, question, question_es, type, required, "order", placeholder, placeholder_es)
select
  id,
  'Describe your experience in healthcare or insurance customer service.',
  'Describe tu experiencia en servicio al cliente de salud o seguros.',
  'textarea',
  true,
  1,
  'Include specific roles and responsibilities...',
  'Incluye roles y responsabilidades específicas...'
from public.opportunities where name = 'HealthLine Bilingual Support';

insert into public.application_questions (opportunity_id, question, question_es, type, required, "order", options)
select
  id,
  'Rate your Spanish language proficiency',
  'Califica tu nivel de español',
  'select',
  true,
  2,
  '[{"value": "native", "label": "Native Speaker", "labelEs": "Hablante Nativo"}, {"value": "fluent", "label": "Fluent", "labelEs": "Fluido"}, {"value": "conversational", "label": "Conversational", "labelEs": "Conversacional"}, {"value": "basic", "label": "Basic", "labelEs": "Básico"}]'::jsonb
from public.opportunities where name = 'HealthLine Bilingual Support';

insert into public.application_questions (opportunity_id, question, question_es, type, required, "order")
select
  id,
  'When can you start?',
  '¿Cuándo puedes comenzar?',
  'date',
  true,
  3
from public.opportunities where name = 'HealthLine Bilingual Support';

insert into public.application_questions (opportunity_id, question, question_es, type, required, "order", options)
select
  id,
  'Have you worked in e-commerce customer support before?',
  '¿Has trabajado en soporte al cliente de e-commerce antes?',
  'radio',
  true,
  1,
  '[{"value": "yes", "label": "Yes", "labelEs": "Sí"}, {"value": "no", "label": "No", "labelEs": "No"}]'::jsonb
from public.opportunities where name = 'ShopEasy Customer Care';

insert into public.application_questions (opportunity_id, question, question_es, type, required, "order", placeholder, placeholder_es, validation)
select
  id,
  'How many hours per week can you commit?',
  '¿Cuántas horas por semana puedes comprometer?',
  'number',
  true,
  2,
  'Enter hours (e.g., 40)',
  'Ingresa horas (ej: 40)',
  '{"min": 10, "max": 60, "message": "Must be between 10 and 60 hours"}'::jsonb
from public.opportunities where name = 'ShopEasy Customer Care';

insert into public.application_questions (opportunity_id, question, question_es, type, required, "order", placeholder, placeholder_es)
select
  id,
  'Tell us about a time you turned an unhappy customer into a satisfied one.',
  'Cuéntanos sobre una vez que convertiste un cliente insatisfecho en uno satisfecho.',
  'textarea',
  true,
  3,
  'Describe the situation and how you handled it...',
  'Describe la situación y cómo la manejaste...'
from public.opportunities where name = 'ShopEasy Customer Care';
