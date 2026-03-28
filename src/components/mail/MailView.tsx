'use client';

import { cn } from '@/lib/utils';
import { useMailStore } from '@/store/mailStore';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Star,
  Reply,
  ReplyAll,
  Forward,
  MoreVertical,
  Trash2,
  Archive,
  Tag,
  Printer,
  ExternalLink,
  Download,
  Paperclip,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function MailView() {
  const { selectedEmail, setSelectedEmail, toggleStar, deleteEmail, moveToFolder } = useMailStore();

  if (!selectedEmail) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDelete = () => {
    deleteEmail(selectedEmail.id);
  };

  const handleArchive = () => {
    moveToFolder(selectedEmail.id, 'trash');
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-zinc-800">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800 lg:hidden"
          onClick={() => setSelectedEmail(null)}
        >
          <ArrowLeft size={18} />
        </Button>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={handleArchive}
          >
            <Archive size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={handleDelete}
          >
            <Trash2 size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'hover:bg-zinc-800',
              selectedEmail.starred ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-400'
            )}
            onClick={() => toggleStar(selectedEmail.id)}
          >
            <Star size={18} fill={selectedEmail.starred ? 'currentColor' : 'none'} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                <MoreVertical size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">
                <Tag size={14} className="mr-2" /> Add label
              </DropdownMenuItem>
              <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">
                <Printer size={14} className="mr-2" /> Print
              </DropdownMenuItem>
              <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">
                <ExternalLink size={14} className="mr-2" /> Open in new window
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="text-red-400 focus:bg-zinc-800">
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Subject */}
          <h1 className="text-xl font-semibold text-white mb-6">
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
                <span className="font-medium text-white">{selectedEmail.from.name}</span>
                <span className="text-sm text-zinc-500">&lt;{selectedEmail.from.email}&gt;</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span>to me</span>
                <DropdownMenu>
                  <DropdownMenuTrigger className="hover:text-zinc-300">
                    <span className="underline cursor-pointer">details</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-zinc-900 border-zinc-800 p-3 w-80">
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="text-zinc-500 w-16">From:</span>
                        <span className="text-zinc-300">{selectedEmail.from.email}</span>
                      </div>
                      <div className="flex">
                        <span className="text-zinc-500 w-16">To:</span>
                        <span className="text-zinc-300">{selectedEmail.to.map(t => t.email).join(', ')}</span>
                      </div>
                      <div className="flex">
                        <span className="text-zinc-500 w-16">Date:</span>
                        <span className="text-zinc-300">{format(selectedEmail.date, 'PPpp')}</span>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <span className="text-sm text-zinc-500 flex-shrink-0">
              {format(selectedEmail.date, 'MMM d, yyyy, h:mm a')}
            </span>
          </div>

          {/* Labels */}
          {selectedEmail.labels.length > 0 && (
            <div className="flex gap-2 mb-6">
              {selectedEmail.labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300"
                >
                  {label}
                  <button className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Email Body */}
          <div
            className="prose prose-invert prose-sm max-w-none text-zinc-300
                       prose-p:text-zinc-300 prose-li:text-zinc-300
                       prose-strong:text-white prose-a:text-teal-400"
            dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
          />

          {/* Attachments */}
          {selectedEmail.attachments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                <Paperclip size={14} />
                <span>{selectedEmail.attachments.length} attachment{selectedEmail.attachments.length > 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {selectedEmail.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      PDF
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">{attachment.name}</p>
                      <p className="text-xs text-zinc-500">{formatFileSize(attachment.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
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
      <div className="p-4 border-t border-zinc-800 flex items-center gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <Reply size={16} className="mr-2" />
          Reply
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <ReplyAll size={16} className="mr-2" />
          Reply All
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <Forward size={16} className="mr-2" />
          Forward
        </Button>
      </div>
    </div>
  );
}
