'use client';

import { cn } from '@/lib/utils';
import { useMailStore } from '@/store/mailStore';
import { formatDistanceToNow } from 'date-fns';
import {
  Star,
  Paperclip,
  Search,
  RefreshCw,
  MoreVertical,
  Archive,
  Trash2,
  Mail,
  MailOpen,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function MailList() {
  const {
    emails,
    selectedEmail,
    setSelectedEmail,
    toggleStar,
    markAsRead,
    searchQuery,
    setSearchQuery,
    isLoading,
    fetchEmails,
    currentFolder
  } = useMailStore();

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEmailClick = (email: typeof emails[0]) => {
    setSelectedEmail(email);
    if (!email.read) {
      markAsRead(email.id);
    }
  };

  return (
    <div className={cn(
      'flex flex-col bg-zinc-900/30 border-r border-zinc-800 transition-all',
      selectedEmail ? 'w-96' : 'flex-1'
    )}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <Input
            placeholder="Search mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 focus:ring-teal-500/50"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={() => fetchEmails(currentFolder)}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
            <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">
              <Mail size={14} className="mr-2" /> Mark all as read
            </DropdownMenuItem>
            <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">
              <Archive size={14} className="mr-2" /> Archive all
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Selection Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
        <Checkbox className="border-zinc-600 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-zinc-400 hover:text-white">
              <ChevronDown size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-800">
            <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">All</DropdownMenuItem>
            <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">None</DropdownMenuItem>
            <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">Read</DropdownMenuItem>
            <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">Unread</DropdownMenuItem>
            <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">Starred</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        <span className="text-xs text-zinc-500">
          {filteredEmails.length} messages
        </span>
      </div>

      {/* Email List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="animate-spin text-teal-500" size={24} />
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <MailOpen size={48} className="mb-4 opacity-50" />
            <p className="text-sm">No messages found</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => handleEmailClick(email)}
                className={cn(
                  'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-all',
                  selectedEmail?.id === email.id
                    ? 'bg-teal-500/10 border-l-2 border-teal-500'
                    : 'hover:bg-zinc-800/50 border-l-2 border-transparent',
                  !email.read && 'bg-zinc-800/30'
                )}
              >
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    className="border-zinc-600 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(email.id);
                    }}
                    className={cn(
                      'transition-colors',
                      email.starred
                        ? 'text-amber-400'
                        : 'text-zinc-600 hover:text-amber-400'
                    )}
                  >
                    <Star size={16} fill={email.starred ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      'text-sm truncate',
                      email.read ? 'text-zinc-400' : 'text-white font-semibold'
                    )}>
                      {email.from.name}
                    </span>
                    {email.attachments.length > 0 && (
                      <Paperclip size={12} className="text-zinc-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className={cn(
                    'text-sm truncate mb-0.5',
                    email.read ? 'text-zinc-500' : 'text-zinc-300 font-medium'
                  )}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-zinc-600 truncate">
                    {email.preview}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={cn(
                    'text-xs',
                    email.read ? 'text-zinc-600' : 'text-teal-400'
                  )}>
                    {formatDistanceToNow(email.date, { addSuffix: false })}
                  </span>
                  {email.labels.length > 0 && (
                    <div className="flex gap-1">
                      {email.labels.slice(0, 2).map((label) => (
                        <span
                          key={label}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
