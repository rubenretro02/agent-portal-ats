'use client';

import { cn } from '@/lib/utils';
import { useMailStore, MailFolder } from '@/store/mailStore';
import { Button } from '@/components/ui/button';
import {
  Inbox,
  Send,
  FileEdit,
  AlertOctagon,
  Trash2,
  Star,
  Plus,
  Tag,
} from 'lucide-react';

interface MailSidebarProps {
  onCompose: () => void;
}

const folders: { key: MailFolder; label: string; icon: typeof Inbox }[] = [
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'starred', label: 'Starred', icon: Star },
  { key: 'sent', label: 'Sent', icon: Send },
  { key: 'drafts', label: 'Drafts', icon: FileEdit },
  { key: 'spam', label: 'Spam', icon: AlertOctagon },
  { key: 'trash', label: 'Trash', icon: Trash2 },
];

const labels = [
  { name: 'Important', color: 'bg-red-500' },
  { name: 'Work', color: 'bg-blue-500' },
  { name: 'Personal', color: 'bg-green-500' },
  { name: 'Onboarding', color: 'bg-amber-500' },
];

export function MailSidebar({ onCompose }: MailSidebarProps) {
  const { currentFolder, setCurrentFolder, emails } = useMailStore();

  const getUnreadCount = (folder: MailFolder) => {
    if (folder === 'starred') {
      return emails.filter(e => e.starred && !e.read).length;
    }
    return emails.filter(e => e.folder === folder && !e.read).length;
  };

  return (
    <aside className="w-56 bg-zinc-900/50 border-r border-zinc-800 flex flex-col p-3">
      {/* Compose Button */}
      <Button
        onClick={onCompose}
        className="w-full mb-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-teal-500/40"
      >
        <Plus size={18} className="mr-2" />
        Compose
      </Button>

      {/* Folders */}
      <nav className="flex-1 space-y-1">
        {folders.map((folder) => {
          const Icon = folder.icon;
          const isActive = currentFolder === folder.key;
          const unreadCount = getUnreadCount(folder.key);

          return (
            <button
              key={folder.key}
              onClick={() => setCurrentFolder(folder.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              )}
            >
              <Icon size={18} />
              <span className="flex-1 text-left">{folder.label}</span>
              {unreadCount > 0 && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  isActive ? 'bg-teal-500 text-white' : 'bg-zinc-700 text-zinc-300'
                )}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Labels */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Labels</span>
          <button className="text-zinc-500 hover:text-zinc-300">
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-1">
          {labels.map((label) => (
            <button
              key={label.name}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
            >
              <Tag size={14} />
              <span className="flex-1 text-left">{label.name}</span>
              <div className={cn('w-2 h-2 rounded-full', label.color)} />
            </button>
          ))}
        </div>
      </div>

      {/* Storage Info */}
      <div className="mt-4 pt-4 border-t border-zinc-800 px-3">
        <div className="text-xs text-zinc-500 mb-2">Storage</div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full w-1/4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full" />
        </div>
        <div className="text-xs text-zinc-500 mt-1">2.5 GB of 10 GB used</div>
      </div>
    </aside>
  );
}
