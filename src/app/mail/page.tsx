'use client';

import { useState, useEffect } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useMailStore } from '@/store/mailStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Inbox,
  Send,
  FileEdit,
  AlertOctagon,
  Trash2,
  Star,
  Plus,
  Tag,
  Search,
  RefreshCw,
  MoreVertical,
  Archive,
  Mail,
  MailOpen,
  ChevronDown,
  Paperclip,
  Reply,
  ReplyAll,
  Forward,
  X,
  Minimize2,
  Maximize2,
  Minus,
  Link,
  Smile,
  Image,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type MailFolder = 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'starred';

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

export default function MailPage() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  // Compose form state
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const {
    emails,
    selectedEmail,
    setSelectedEmail,
    currentFolder,
    setCurrentFolder,
    fetchEmails,
    isLoading,
    toggleStar,
    markAsRead,
    deleteEmail,
    sendEmail,
    searchQuery,
    setSearchQuery,
  } = useMailStore();

  useEffect(() => {
    fetchEmails(currentFolder);
  }, [currentFolder, fetchEmails]);

  const getUnreadCount = (folder: MailFolder) => {
    if (folder === 'starred') {
      return emails.filter(e => e.starred && !e.read).length;
    }
    return emails.filter(e => e.folder === folder && !e.read).length;
  };

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSend = async () => {
    if (!to || !subject) return;
    await sendEmail({ to: [{ name: '', email: to }], subject, body });
    setTo(''); setCc(''); setBcc(''); setSubject(''); setBody('');
    setComposeOpen(false);
  };

  const handleCloseCompose = () => {
    setComposeOpen(false);
    setMinimized(false);
    setMaximized(false);
  };

  return (
    <UnifiedLayout title="Agent Mail">
      <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {/* Mail Sidebar */}
        <aside className="w-56 bg-zinc-50 border-r border-zinc-200 flex flex-col p-3">
          {/* Compose Button */}
          <Button
            onClick={() => setComposeOpen(true)}
            className="w-full mb-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md"
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
                      ? 'bg-teal-100 text-teal-700'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  )}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{folder.label}</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className={cn(
                      'text-xs',
                      isActive ? 'bg-teal-500 text-white' : 'bg-zinc-200 text-zinc-600'
                    )}>
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Labels */}
          <div className="mt-4 pt-4 border-t border-zinc-200">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Labels</span>
              <button className="text-zinc-400 hover:text-zinc-600">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {labels.map((label) => (
                <button
                  key={label.name}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 transition-all"
                >
                  <Tag size={14} />
                  <span className="flex-1 text-left">{label.name}</span>
                  <div className={cn('w-2 h-2 rounded-full', label.color)} />
                </button>
              ))}
            </div>
          </div>

          {/* Storage Info */}
          <div className="mt-4 pt-4 border-t border-zinc-200 px-3">
            <div className="text-xs text-zinc-500 mb-2">Storage</div>
            <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full" />
            </div>
            <div className="text-xs text-zinc-500 mt-1">2.5 GB of 10 GB used</div>
          </div>
        </aside>

        {/* Email List */}
        <div className={cn(
          'flex flex-col border-r border-zinc-200 transition-all',
          selectedEmail ? 'w-80' : 'flex-1'
        )}>
          {/* Toolbar */}
          <div className="flex items-center gap-2 p-3 border-b border-zinc-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <Input
                placeholder="Search mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-50 border-zinc-200"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchEmails(currentFolder)}
              className="text-zinc-500 hover:text-zinc-700"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>

          {/* Selection Bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-100 bg-zinc-50">
            <Checkbox className="border-zinc-300" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-zinc-500 hover:text-zinc-700">
                  <ChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>All</DropdownMenuItem>
                <DropdownMenuItem>None</DropdownMenuItem>
                <DropdownMenuItem>Read</DropdownMenuItem>
                <DropdownMenuItem>Unread</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex-1" />
            <span className="text-xs text-zinc-500">{filteredEmails.length} messages</span>
          </div>

          {/* Email List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="animate-spin text-teal-500" size={24} />
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                <MailOpen size={48} className="mb-4 opacity-50" />
                <p className="text-sm">No messages found</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    className={cn(
                      'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-all',
                      selectedEmail?.id === email.id
                        ? 'bg-teal-50 border-l-2 border-teal-500'
                        : 'hover:bg-zinc-50 border-l-2 border-transparent',
                      !email.read && 'bg-blue-50/50'
                    )}
                  >
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        className="border-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(email.id);
                        }}
                        className={cn(
                          'transition-colors',
                          email.starred ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-500'
                        )}
                      >
                        <Star size={16} fill={email.starred ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn(
                          'text-sm truncate',
                          email.read ? 'text-zinc-600' : 'text-zinc-900 font-semibold'
                        )}>
                          {email.from.name}
                        </span>
                        {email.attachments.length > 0 && (
                          <Paperclip size={12} className="text-zinc-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className={cn(
                        'text-sm truncate mb-0.5',
                        email.read ? 'text-zinc-500' : 'text-zinc-700 font-medium'
                      )}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {email.preview}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={cn(
                        'text-xs',
                        email.read ? 'text-zinc-400' : 'text-teal-600 font-medium'
                      )}>
                        {formatDistanceToNow(email.date, { addSuffix: false })}
                      </span>
                      {email.labels.length > 0 && (
                        <div className="flex gap-1">
                          {email.labels.slice(0, 2).map((label) => (
                            <span
                              key={label}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500"
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

        {/* Email View */}
        {selectedEmail && (
          <div className="flex-1 flex flex-col bg-white min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b border-zinc-200">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-500 hover:text-zinc-700 lg:hidden"
                onClick={() => setSelectedEmail(null)}
              >
                <X size={18} />
              </Button>
              <div className="flex-1" />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-700">
                  <Archive size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-500 hover:text-red-600"
                  onClick={() => deleteEmail(selectedEmail.id)}
                >
                  <Trash2 size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(selectedEmail.starred ? 'text-amber-500' : 'text-zinc-500 hover:text-amber-500')}
                  onClick={() => toggleStar(selectedEmail.id)}
                >
                  <Star size={18} fill={selectedEmail.starred ? 'currentColor' : 'none'} />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Subject */}
                <h1 className="text-xl font-semibold text-zinc-900 mb-6">
                  {selectedEmail.subject}
                </h1>

                {/* Sender Info */}
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="h-10 w-10 bg-gradient-to-br from-teal-400 to-cyan-500">
                    <AvatarFallback className="bg-transparent text-white font-medium text-sm">
                      {getInitials(selectedEmail.from.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-zinc-900">{selectedEmail.from.name}</span>
                      <span className="text-sm text-zinc-500">&lt;{selectedEmail.from.email}&gt;</span>
                    </div>
                    <div className="text-sm text-zinc-500">to me</div>
                  </div>
                  <span className="text-sm text-zinc-500 flex-shrink-0">
                    {format(selectedEmail.date, 'MMM d, yyyy, h:mm a')}
                  </span>
                </div>

                {/* Labels */}
                {selectedEmail.labels.length > 0 && (
                  <div className="flex gap-2 mb-6">
                    {selectedEmail.labels.map((label) => (
                      <Badge key={label} variant="secondary" className="bg-zinc-100 text-zinc-600">
                        {label}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Email Body */}
                <div
                  className="prose prose-sm max-w-none text-zinc-700"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />

                {/* Attachments */}
                {selectedEmail.attachments.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-zinc-200">
                    <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
                      <Paperclip size={14} />
                      <span>{selectedEmail.attachments.length} attachment{selectedEmail.attachments.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedEmail.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors cursor-pointer group"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
                            PDF
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-700 truncate">{attachment.name}</p>
                            <p className="text-xs text-zinc-500">{formatFileSize(attachment.size)}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-700">
                            <Download size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Reply Actions */}
            <div className="p-4 border-t border-zinc-200 flex items-center gap-2">
              <Button variant="outline" className="flex-1">
                <Reply size={16} className="mr-2" />
                Reply
              </Button>
              <Button variant="outline" className="flex-1">
                <ReplyAll size={16} className="mr-2" />
                Reply All
              </Button>
              <Button variant="outline" className="flex-1">
                <Forward size={16} className="mr-2" />
                Forward
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div
          className={cn(
            'fixed bg-white border border-zinc-300 rounded-t-lg shadow-2xl flex flex-col z-50 transition-all duration-200',
            minimized
              ? 'bottom-0 right-4 w-72 h-10'
              : maximized
              ? 'inset-4'
              : 'bottom-0 right-4 w-[560px] h-[480px]'
          )}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-2 bg-zinc-100 rounded-t-lg cursor-pointer border-b border-zinc-200"
            onClick={() => minimized && setMinimized(false)}
          >
            <span className="text-sm font-medium text-zinc-700">
              {subject || 'New Message'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); if (maximized) setMaximized(false); }}
                className="p-1 text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMaximized(!maximized); if (minimized) setMinimized(false); }}
                className="p-1 text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCloseCompose(); }}
                className="p-1 text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center px-4 py-2 border-b border-zinc-100">
                  <span className="text-sm text-zinc-500 w-16">To</span>
                  <Input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="Recipients"
                    className="border-0 bg-transparent focus-visible:ring-0 px-0"
                  />
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    {!showCc && <button onClick={() => setShowCc(true)} className="hover:text-zinc-700">Cc</button>}
                    {!showBcc && <button onClick={() => setShowBcc(true)} className="hover:text-zinc-700">Bcc</button>}
                  </div>
                </div>
                {showCc && (
                  <div className="flex items-center px-4 py-2 border-b border-zinc-100">
                    <span className="text-sm text-zinc-500 w-16">Cc</span>
                    <Input value={cc} onChange={(e) => setCc(e.target.value)} className="border-0 bg-transparent focus-visible:ring-0 px-0" />
                  </div>
                )}
                {showBcc && (
                  <div className="flex items-center px-4 py-2 border-b border-zinc-100">
                    <span className="text-sm text-zinc-500 w-16">Bcc</span>
                    <Input value={bcc} onChange={(e) => setBcc(e.target.value)} className="border-0 bg-transparent focus-visible:ring-0 px-0" />
                  </div>
                )}
                <div className="flex items-center px-4 py-2 border-b border-zinc-100">
                  <span className="text-sm text-zinc-500 w-16">Subject</span>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="border-0 bg-transparent focus-visible:ring-0 px-0" />
                </div>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 resize-none p-4"
                />
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
                <div className="flex items-center gap-1">
                  <Button onClick={handleSend} disabled={!to || !subject} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                    Send
                  </Button>
                  <div className="flex items-center gap-0.5 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500"><Paperclip size={16} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500"><Link size={16} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500"><Smile size={16} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500"><Image size={16} /></Button>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-600" onClick={handleCloseCompose}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </UnifiedLayout>
  );
}
