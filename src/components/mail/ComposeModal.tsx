'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useMailStore } from '@/store/mailStore';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Paperclip,
  Link,
  Smile,
  Image,
  MoreVertical,
  Trash2,
  Send,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComposeModal({ open, onOpenChange }: ComposeModalProps) {
  const { sendEmail, isLoading } = useMailStore();
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSend = async () => {
    if (!to || !subject) return;

    await sendEmail({
      to: [{ name: '', email: to }],
      subject,
      body,
    });

    // Reset and close
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setMinimized(false);
    setMaximized(false);
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed bg-zinc-900 border border-zinc-700 rounded-t-lg shadow-2xl flex flex-col z-50 transition-all duration-200',
        minimized
          ? 'bottom-0 right-4 w-72 h-10'
          : maximized
          ? 'inset-4'
          : 'bottom-0 right-4 w-[560px] h-[480px]'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-zinc-800 rounded-t-lg cursor-pointer"
        onClick={() => minimized && setMinimized(false)}
      >
        <span className="text-sm font-medium text-white">
          {subject || 'New Message'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(!minimized);
              if (maximized) setMaximized(false);
            }}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMaximized(!maximized);
              if (minimized) setMinimized(false);
            }}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <>
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* To Field */}
            <div className="flex items-center px-4 py-2 border-b border-zinc-800">
              <span className="text-sm text-zinc-500 w-16">To</span>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipients"
                className="border-0 bg-transparent text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              />
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                {!showCc && (
                  <button onClick={() => setShowCc(true)} className="hover:text-zinc-300">
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button onClick={() => setShowBcc(true)} className="hover:text-zinc-300">
                    Bcc
                  </button>
                )}
              </div>
            </div>

            {/* Cc Field */}
            {showCc && (
              <div className="flex items-center px-4 py-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-500 w-16">Cc</span>
                <Input
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="border-0 bg-transparent text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                />
              </div>
            )}

            {/* Bcc Field */}
            {showBcc && (
              <div className="flex items-center px-4 py-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-500 w-16">Bcc</span>
                <Input
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  className="border-0 bg-transparent text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                />
              </div>
            )}

            {/* Subject Field */}
            <div className="flex items-center px-4 py-2 border-b border-zinc-800">
              <span className="text-sm text-zinc-500 w-16">Subject</span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="border-0 bg-transparent text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              />
            </div>

            {/* Body */}
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="flex-1 border-0 bg-transparent text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none p-4"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <div className="flex items-center gap-1">
              <Button
                onClick={handleSend}
                disabled={!to || !subject || isLoading}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                Send
                <ChevronDown size={14} className="ml-1" />
              </Button>

              <div className="flex items-center gap-0.5 ml-2">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8">
                  <Paperclip size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8">
                  <Link size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8">
                  <Smile size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8">
                  <Image size={16} />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">
                    Schedule send
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800">
                    Save draft
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-red-400 hover:bg-zinc-800 h-8 w-8"
                onClick={handleClose}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
