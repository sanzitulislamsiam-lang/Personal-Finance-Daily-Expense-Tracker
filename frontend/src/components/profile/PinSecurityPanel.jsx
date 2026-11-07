import React, { useState } from 'react';
import { KeyRound, Lock, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { setPin, removePin, updatePrivacy } from '../../api/privacyApi';
import { LOCKABLE_SECTIONS } from '../../config/sections';
import PinInput from '../common/PinInput';

const cardCls =
  'bg-white dark:bg-[#121826] p-6 sm:p-8 rounded-3xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm space-y-6 transition-colors';
const labelCls =
  'block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 text-center sm:text-left';
const primaryBtn =
  'px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl text-xs tracking-wider uppercase disabled:opacity-40 transition-all';

// R3: create / change / remove the PIN and choose which sections it locks
export default function PinSecurityPanel() {
  const { user, updateUserState } = useAuth();
  const privacy = user?.privacySettings || {};
  const pinEnabled = Boolean(privacy.pinEnabled);

  const [mode, setMode] = useState('change'); // change | sections | remove (only when PIN exists)
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [selected, setSelected] = useState(privacy.lockedSections || []);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState({ type: '', message: '' });

  const reset = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const run = async (action, successMessage) => {
    setBusy(true);
    setNote({ type: '', message: '' });
    try {
      const res = await action();
      updateUserState({ privacySettings: res.privacySettings });
      setSelected(res.privacySettings.lockedSections || []);
      setNote({ type: 'success', message: successMessage });
      reset();
    } catch (err) {
      const data = err.response?.data || {};
      let message = data.message || 'Something went wrong.';
      if (data.code === 'PIN_INVALID') message = `Incorrect PIN. ${data.attemptsRemaining} attempt(s) left.`;
      setNote({ type: 'error', message });
      setCurrentPin('');
    } finally {
      setBusy(false);
    }
  };

  const validNew = newPin.length === 4 && newPin === confirmPin;

  const handleCreate = () => {
    if (!validNew) return setNote({ type: 'error', message: 'PINs must be 4 digits and match.' });
    run(() => setPin(newPin), 'PIN created. You can now lock sections.');
  };

  const handleChange = () => {
    if (currentPin.length !== 4) return setNote({ type: 'error', message: 'Enter your current PIN.' });
    if (!validNew) return setNote({ type: 'error', message: 'New PINs must be 4 digits and match.' });
    run(() => setPin(newPin, currentPin), 'PIN changed successfully.');
  };

  const handleSections = () => {
    if (currentPin.length !== 4) return setNote({ type: 'error', message: 'Enter your PIN to confirm.' });
    run(
      () => updatePrivacy({ lockedSections: selected, pin: currentPin }),
      selected.length ? 'Locked sections saved.' : 'All sections unlocked.'
    );
  };

  const handleRemove = () => {
    if (currentPin.length !== 4) return setNote({ type: 'error', message: 'Enter your PIN to confirm.' });
    run(() => removePin(currentPin), 'PIN removed. All locks are off.');
  };

  const toggleSection = (key) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const tabCls = (m) =>
    `px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      mode === m
        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
        : 'text-slate-600 dark:text-slate-300'
    }`;

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <KeyRound className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">PIN Lock</h2>
        </div>
        <span
          className={`text-[11px] px-2.5 py-1 rounded-md font-bold border ${
            pinEnabled
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
          }`}
        >
          {pinEnabled ? 'PIN active' : 'No PIN set'}
        </span>
      </div>

      {note.message && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium border ${
            note.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
          }`}
        >
          {note.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {note.message}
        </div>
      )}

      {!pinEnabled ? (
        <div className="space-y-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create a 4-digit PIN. After that you can lock sections such as Accounts so nobody can open
            them without it.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>New PIN</label>
              <PinInput value={newPin} onChange={setNewPin} disabled={busy} />
            </div>
            <div>
              <label className={labelCls}>Confirm PIN</label>
              <PinInput value={confirmPin} onChange={setConfirmPin} disabled={busy} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={handleCreate} disabled={busy || !validNew} className={primaryBtn}>
              Create PIN
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="inline-flex gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button type="button" className={tabCls('change')} onClick={() => { setMode('change'); reset(); setNote({ type: '', message: '' }); }}>
              Change PIN
            </button>
            <button type="button" className={tabCls('sections')} onClick={() => { setMode('sections'); reset(); setNote({ type: '', message: '' }); }}>
              Locked sections
            </button>
            <button type="button" className={tabCls('remove')} onClick={() => { setMode('remove'); reset(); setNote({ type: '', message: '' }); }}>
              Remove PIN
            </button>
          </div>

          {mode === 'change' && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-5">
                <div>
                  <label className={labelCls}>Current PIN</label>
                  <PinInput value={currentPin} onChange={setCurrentPin} disabled={busy} />
                </div>
                <div>
                  <label className={labelCls}>New PIN</label>
                  <PinInput value={newPin} onChange={setNewPin} disabled={busy} />
                </div>
                <div>
                  <label className={labelCls}>Confirm new PIN</label>
                  <PinInput value={confirmPin} onChange={setConfirmPin} disabled={busy} />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleChange} disabled={busy} className={primaryBtn}>
                  Change PIN
                </button>
              </div>
            </div>
          )}

          {mode === 'sections' && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tick the sections that must ask for the PIN before they open.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {LOCKABLE_SECTIONS.map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selected.includes(key)
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(key)}
                      onChange={() => toggleSection(key)}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className={labelCls}>Enter PIN to confirm</label>
                <PinInput value={currentPin} onChange={setCurrentPin} disabled={busy} />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleSections} disabled={busy} className={primaryBtn}>
                  Save locked sections
                </button>
              </div>
            </div>
          )}

          {mode === 'remove' && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Removing the PIN also unlocks every section.
              </p>
              <div>
                <label className={labelCls}>Enter PIN to confirm</label>
                <PinInput value={currentPin} onChange={setCurrentPin} disabled={busy} />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase disabled:opacity-40 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove PIN
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
