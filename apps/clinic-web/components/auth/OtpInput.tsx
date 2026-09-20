'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

import { cn } from '@/lib/cn';

export function OtpInput({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setAt(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join('').slice(0, 6));
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        setAt(index, '');
      } else if (index > 0) {
        setAt(index - 1, '');
        refs.current[index - 1]?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      refs.current[index + 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    onChange(text);
    const focusIdx = Math.min(text.length, 5);
    refs.current[focusIdx]?.focus();
  }

  return (
    <div className="flex justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={d}
          aria-label={`OTP ${i + 1}`}
          onPaste={onPaste}
          onKeyDown={(e) => onKeyDown(i, e)}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            if (!raw) {
              setAt(i, '');
              return;
            }
            const char = raw.slice(-1);
            setAt(i, char);
            if (i < 5) refs.current[i + 1]?.focus();
          }}
          className={cn(
            'h-12 w-10 rounded-xl border bg-slate-50 text-center text-lg font-semibold text-slate-900 outline-none transition tablet:h-14 tablet:w-12',
            'focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20',
            error ? 'border-red-400' : 'border-slate-200',
          )}
        />
      ))}
    </div>
  );
}
