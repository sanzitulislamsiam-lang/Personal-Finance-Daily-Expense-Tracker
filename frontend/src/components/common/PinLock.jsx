import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';
import PinInput from './PinInput';
import { LOCKABLE_SECTIONS } from '../../config/sections';

// R3: wrap any page/section with <PinLock section="accounts"> ... </PinLock>.
// If the user locked that section the PIN screen is shown instead of the children
// (children are not even mounted, so nothing is fetched until the PIN is correct).
export default function PinLock({ section, children }) {
  const { isSectionLocked, unlock } = usePrivacy();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const locked = isSectionLocked(section);

  // count the lock-out timer down
  useEffect(() => {
    if (lockoutSeconds <= 0) return undefined;
    const t = setInterval(() => setLockoutSeconds((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [lockoutSeconds]);

  useEffect(() => {
    if (lockoutSeconds === 0 && error.startsWith('Too many')) setError('');
  }, [lockoutSeconds, error]);

  if (!locked) return children;

  const label = LOCKABLE_SECTIONS.find((s) => s.key === section)?.label || section;

  const submit = async (value) => {
    if (busy || lockoutSeconds > 0) return;
    setBusy(true);
    setError('');
    try {
      await unlock(value);
      setPin('');
    } catch (err) {
      const data = err.response?.data || {};
      setPin('');
      if (data.code === 'PIN_LOCKED_OUT') {
        setLockoutSeconds(data.retryAfterSeconds || 60);
        setError(data.message);
      } else if (data.code === 'PIN_INVALID') {
        setError(`Incorrect PIN. ${data.attemptsRemaining} attempt(s) left.`);
      } else {
        setError(data.message || 'Could not verify PIN. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#121826] rounded-3xl border border-slate-200/70 dark:border-slate-800/80 shadow-xl p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-emerald-500" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Section Locked</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your 4-digit PIN to open <span className="font-semibold">{label}</span>.
          </p>
        </div>

        <PinInput
          value={pin}
          onChange={setPin}
          onComplete={submit}
          disabled={busy || lockoutSeconds > 0}
          autoFocus
        />

        {error && (
          <div className="flex items-start gap-2 text-left text-xs font-medium p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              {error}
              {lockoutSeconds > 0 && ` (${lockoutSeconds}s)`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          Stays unlocked for 10 minutes, then locks again
        </div>
      </div>
    </div>
  );
}
