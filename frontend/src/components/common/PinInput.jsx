import React, { useRef } from 'react';

// 4 separate digit boxes. Calls onComplete(pin) when the 4th digit is typed.
export default function PinInput({ value, onChange, onComplete, disabled = false, autoFocus = false }) {
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const digits = value.padEnd(4, ' ').split('');

  const update = (next) => {
    onChange(next);
    if (next.length === 4 && onComplete) onComplete(next);
  };

  const handleChange = (index, e) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    const next = (value.slice(0, index) + digit).slice(0, 4);
    update(next);
    if (index < 3) refs[index + 1].current?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index].trim()) {
        onChange(value.slice(0, index));
      } else if (index > 0) {
        onChange(value.slice(0, index - 1));
        refs[index - 1].current?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    e.preventDefault();
    update(pasted);
    refs[Math.min(pasted.length, 3)].current?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-3" onPaste={handlePaste}>
      {refs.map((ref, i) => (
        <input
          key={i}
          ref={ref}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          value={digits[i].trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`PIN digit ${i + 1}`}
          className="w-12 h-14 text-center text-2xl font-black rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900 dark:text-white disabled:opacity-40"
        />
      ))}
    </div>
  );
}
