'use client';

import { useState, useEffect } from 'react';
import { MailLayout } from '@/components/mail/MailLayout';
import { MailSidebar } from '@/components/mail/MailSidebar';
import { MailList } from '@/components/mail/MailList';
import { MailView } from '@/components/mail/MailView';
import { ComposeModal } from '@/components/mail/ComposeModal';
import { useMailStore } from '@/store/mailStore';
import { Sidebar } from '@/components/layout/Sidebar';

export default function MailPage() {
  const [composeOpen, setComposeOpen] = useState(false);
  const { selectedEmail, currentFolder, fetchEmails, isLoading } = useMailStore();

  useEffect(() => {
    fetchEmails(currentFolder);
  }, [currentFolder, fetchEmails]);

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        <MailLayout>
          <MailSidebar onCompose={() => setComposeOpen(true)} />
          <div className="flex-1 flex">
            <MailList />
            {selectedEmail && <MailView />}
          </div>
        </MailLayout>
        <ComposeModal open={composeOpen} onOpenChange={setComposeOpen} />
      </div>
    </div>
  );
}
