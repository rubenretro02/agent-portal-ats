import { create } from 'zustand';

export interface Email {
  id: string;
  from: {
    name: string;
    email: string;
  };
  to: {
    name: string;
    email: string;
  }[];
  subject: string;
  preview: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  labels: string[];
  attachments: {
    name: string;
    size: number;
    type: string;
  }[];
  folder: string;
}

export type MailFolder = 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'starred';

interface MailState {
  emails: Email[];
  selectedEmail: Email | null;
  currentFolder: MailFolder;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedEmail: (email: Email | null) => void;
  setCurrentFolder: (folder: MailFolder) => void;
  setSearchQuery: (query: string) => void;
  fetchEmails: (folder: MailFolder) => Promise<void>;
  sendEmail: (email: Partial<Email>) => Promise<void>;
  deleteEmail: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  moveToFolder: (id: string, folder: MailFolder) => Promise<void>;
}

// Demo emails for initial testing
const demoEmails: Email[] = [
  {
    id: '1',
    from: { name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
    to: [{ name: 'Agent', email: 'agent@yourdomain.com' }],
    subject: 'Welcome to the Team! - Important Onboarding Information',
    preview: 'Hi! Welcome aboard. I wanted to reach out personally to welcome you to our team. Please find attached all the onboarding documents...',
    body: `<p>Hi!</p>
<p>Welcome aboard. I wanted to reach out personally to welcome you to our team.</p>
<p>Please find attached all the onboarding documents you'll need to get started. Make sure to complete the following by end of week:</p>
<ul>
<li>Complete your profile information</li>
<li>Review the company handbook</li>
<li>Set up your direct deposit</li>
<li>Schedule your orientation session</li>
</ul>
<p>If you have any questions, don't hesitate to reach out!</p>
<p>Best regards,<br/>Sarah Johnson<br/>HR Manager</p>`,
    date: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    starred: true,
    labels: ['important', 'onboarding'],
    attachments: [
      { name: 'Onboarding_Checklist.pdf', size: 245000, type: 'application/pdf' },
      { name: 'Company_Handbook.pdf', size: 1240000, type: 'application/pdf' },
    ],
    folder: 'inbox',
  },
  {
    id: '2',
    from: { name: 'Michael Chen', email: 'michael.chen@company.com' },
    to: [{ name: 'Agent', email: 'agent@yourdomain.com' }],
    subject: 'Q4 Performance Review Schedule',
    preview: 'Hello team, I wanted to share the upcoming schedule for Q4 performance reviews. Please mark your calendars...',
    body: `<p>Hello team,</p>
<p>I wanted to share the upcoming schedule for Q4 performance reviews.</p>
<p>Please mark your calendars for the following dates:</p>
<ul>
<li><strong>Oct 15-20:</strong> Self-assessment period</li>
<li><strong>Oct 21-30:</strong> Manager reviews</li>
<li><strong>Nov 1-5:</strong> One-on-one discussions</li>
</ul>
<p>Best,<br/>Michael</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    starred: false,
    labels: ['work'],
    attachments: [],
    folder: 'inbox',
  },
  {
    id: '3',
    from: { name: 'Benefits Team', email: 'benefits@company.com' },
    to: [{ name: 'Agent', email: 'agent@yourdomain.com' }],
    subject: 'Open Enrollment Begins Next Week',
    preview: 'Annual benefits enrollment is starting soon. Review your options and make selections by the deadline...',
    body: `<p>Dear Employee,</p>
<p>Annual benefits enrollment begins next week. This is your opportunity to review and update your benefits selections for the upcoming year.</p>
<p>Key dates:</p>
<ul>
<li>Enrollment opens: November 1</li>
<li>Enrollment closes: November 15</li>
<li>New benefits effective: January 1</li>
</ul>
<p>Please visit the benefits portal to review your options.</p>
<p>The Benefits Team</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
    starred: false,
    labels: ['benefits'],
    attachments: [
      { name: 'Benefits_Guide_2024.pdf', size: 3200000, type: 'application/pdf' },
    ],
    folder: 'inbox',
  },
  {
    id: '4',
    from: { name: 'IT Support', email: 'it.support@company.com' },
    to: [{ name: 'Agent', email: 'agent@yourdomain.com' }],
    subject: 'Security Update Required - Action Needed',
    preview: 'A critical security update is available for your workstation. Please complete the installation by Friday...',
    body: `<p>Hello,</p>
<p>A critical security update is available for your workstation. Please complete the installation by Friday to ensure your system remains protected.</p>
<p>To install the update:</p>
<ol>
<li>Save all your work</li>
<li>Click on the update notification in your system tray</li>
<li>Follow the on-screen instructions</li>
<li>Restart your computer when prompted</li>
</ol>
<p>If you need assistance, please contact the IT Help Desk.</p>
<p>IT Support Team</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    starred: false,
    labels: ['it'],
    attachments: [],
    folder: 'inbox',
  },
  {
    id: '5',
    from: { name: 'Training Department', email: 'training@company.com' },
    to: [{ name: 'Agent', email: 'agent@yourdomain.com' }],
    subject: 'New Training Courses Available',
    preview: 'Check out our new professional development courses for Q4. Several popular topics have been added...',
    body: `<p>Hi there!</p>
<p>We're excited to announce new training courses available for Q4:</p>
<ul>
<li>Leadership Fundamentals</li>
<li>Advanced Excel Techniques</li>
<li>Effective Communication</li>
<li>Project Management Basics</li>
</ul>
<p>Sign up through the learning portal before seats fill up!</p>
<p>Training Department</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
    starred: true,
    labels: ['training'],
    attachments: [],
    folder: 'inbox',
  },
];

export const useMailStore = create<MailState>((set, get) => ({
  emails: demoEmails,
  selectedEmail: null,
  currentFolder: 'inbox',
  searchQuery: '',
  isLoading: false,
  error: null,

  setSelectedEmail: (email) => set({ selectedEmail: email }),

  setCurrentFolder: (folder) => {
    set({ currentFolder: folder, selectedEmail: null });
    get().fetchEmails(folder);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchEmails: async (folder) => {
    set({ isLoading: true, error: null });
    try {
      // In production, this would call the API
      // const response = await fetch(`/api/mail?folder=${folder}`);
      // const data = await response.json();
      // set({ emails: data.emails, isLoading: false });

      // For now, filter demo emails
      await new Promise(resolve => setTimeout(resolve, 300));
      const filtered = folder === 'starred'
        ? demoEmails.filter(e => e.starred)
        : demoEmails.filter(e => e.folder === folder);
      set({ emails: filtered, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch emails', isLoading: false });
    }
  },

  sendEmail: async (email) => {
    set({ isLoading: true });
    try {
      // In production: await fetch('/api/mail/send', { method: 'POST', body: JSON.stringify(email) });
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to send email', isLoading: false });
    }
  },

  deleteEmail: async (id) => {
    const { emails } = get();
    set({
      emails: emails.map(e => e.id === id ? { ...e, folder: 'trash' as const } : e),
      selectedEmail: null
    });
  },

  markAsRead: async (id) => {
    const { emails } = get();
    set({ emails: emails.map(e => e.id === id ? { ...e, read: true } : e) });
  },

  toggleStar: async (id) => {
    const { emails, selectedEmail } = get();
    const updatedEmails = emails.map(e => e.id === id ? { ...e, starred: !e.starred } : e);
    set({
      emails: updatedEmails,
      selectedEmail: selectedEmail?.id === id ? { ...selectedEmail, starred: !selectedEmail.starred } : selectedEmail
    });
  },

  moveToFolder: async (id, folder) => {
    const { emails } = get();
    set({
      emails: emails.map(e => e.id === id ? { ...e, folder } : e),
      selectedEmail: null
    });
  },
}));
