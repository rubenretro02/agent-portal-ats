'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Keyboard, Gauge, Target, RotateCcw, CheckCircle2, Lock } from 'lucide-react';

/**
 * Call-center typing assessment.
 *
 * Anti-cheat design:
 *  - The passage is chosen *deterministically* from the agent's id, so a
 *    reload always shows the SAME passage (no re-rolling for an easier one)
 *    while different agents get different passages.
 *  - Pasting is blocked; the WPM is computed from elapsed time + correct
 *    characters, so dumping text doesn't help.
 *  - Once a score exists it is shown read-only (no silent retakes).
 */

const PASSAGES = [
  "Thank you for calling customer support, my name is Alex and I will be happy to help you today. Before we begin, may I please confirm the name and email address associated with your account so I can pull up the correct details for you?",
  "I completely understand how frustrating this issue must be, and I want to assure you that we will get it resolved. Let me review your recent orders and the notes on your account so we can find the fastest possible solution together.",
  "To protect your account, I just need to verify a few quick details before making any changes. Once that is done, I can update your billing information, send a confirmation email, and walk you through the next steps one at a time.",
  "Working from home as an independent contractor means being reliable, punctual, and professional on every single call. A quiet space, a stable internet connection, and a positive attitude are the keys to delivering great customer service.",
  "I appreciate your patience while I look into this for you. I have documented everything we discussed today, issued the refund to your original payment method, and you should expect to see it reflected within three to five business days.",
];

function passageForSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PASSAGES[hash % PASSAGES.length];
}

export interface TypingResult {
  wpm: number;
  accuracy: number;
}

interface TypingTestProps {
  /** Stable seed (agent id) that picks the passage deterministically. */
  seed: string;
  /** Existing result — when present the test is read-only. */
  initialResult?: TypingResult | null;
  onComplete: (result: TypingResult) => void;
}

export function TypingTest({ seed, initialResult, onComplete }: TypingTestProps) {
  const passage = useMemo(() => passageForSeed(seed || 'default'), [seed]);
  const [typed, setTyped] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<TypingResult | null>(initialResult ?? null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const correctChars = useMemo(() => {
    let c = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === passage[i]) c++;
    }
    return c;
  }, [typed, passage]);

  const elapsedMin = startedAt ? Math.max((Date.now() - startedAt) / 60000, 1 / 60) : 0;
  const liveWpm = elapsedMin > 0 ? Math.round(correctChars / 5 / elapsedMin) : 0;
  const liveAccuracy = typed.length > 0 ? Math.round((correctChars / typed.length) * 100) : 100;
  const progress = Math.min(Math.round((typed.length / passage.length) * 100), 100);

  const handleChange = (value: string) => {
    if (result) return;
    if (!startedAt && value.length > 0) setStartedAt(Date.now());
    const next = value.slice(0, passage.length);
    setTyped(next);

    if (next.length >= passage.length) {
      const mins = startedAt ? Math.max((Date.now() - startedAt) / 60000, 1 / 60) : 1 / 60;
      let correct = 0;
      for (let i = 0; i < next.length; i++) if (next[i] === passage[i]) correct++;
      const finalResult: TypingResult = {
        wpm: Math.round(correct / 5 / mins),
        accuracy: Math.round((correct / next.length) * 100),
      };
      setResult(finalResult);
      onComplete(finalResult);
    }
  };

  const reset = () => {
    setTyped('');
    setStartedAt(null);
    taRef.current?.focus();
  };

  const locked = !!initialResult;

  return (
    <div className="space-y-4">
      {/* Live stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Gauge} label="WPM" value={result ? result.wpm : liveWpm} accent="text-[var(--brand-blue)]" bg="bg-[var(--brand-blue-soft)]" />
        <Stat icon={Target} label="Accuracy" value={`${result ? result.accuracy : liveAccuracy}%`} accent="text-emerald-600" bg="bg-emerald-50" />
        <Stat icon={Keyboard} label="Progress" value={`${result ? 100 : progress}%`} accent="text-[var(--brand-purple)]" bg="bg-[var(--brand-purple-soft)]" />
      </div>

      {/* Passage with per-char feedback */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-[15px] leading-relaxed font-mono select-none">
        {passage.split('').map((ch, i) => {
          let cls = 'text-zinc-400';
          if (i < typed.length) cls = typed[i] === ch ? 'text-emerald-600' : 'text-red-500 bg-red-100 rounded';
          else if (i === typed.length) cls = 'text-zinc-900 bg-[var(--brand-blue-soft)] rounded';
          return (
            <span key={i} className={cls}>{ch}</span>
          );
        })}
      </div>

      {result ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            {locked ? 'Typing test already completed' : 'Great job!'} — {result.wpm} WPM at {result.accuracy}% accuracy.
          </span>
        </div>
      ) : (
        <>
          <textarea
            ref={taRef}
            value={typed}
            onChange={(e) => handleChange(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Start typing the text above exactly as shown…"
            className="w-full h-24 rounded-xl border border-zinc-300 p-3 text-[15px] font-mono resize-none focus:outline-none focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[rgba(32,71,255,0.15)]"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Pasting is disabled — type it yourself.
            </p>
            {typed.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={reset} className="text-zinc-500 gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Restart
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent, bg }: { icon: React.ElementType; label: string; value: string | number; accent: string; bg: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3 text-center">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-1.5`}>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <p className="text-xl font-bold text-zinc-900 leading-none">{value}</p>
      <p className="text-[11px] text-zinc-500 mt-1">{label}</p>
    </div>
  );
}
