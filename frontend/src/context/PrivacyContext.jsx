import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { verifyPin } from '../api/privacyApi';
import { formatCurrency } from '../utils/formatCurrency';
import { saveUnlock, getUnlock, clearUnlock } from '../utils/pinSession';

const PrivacyContext = createContext();

export const MASK = '••••••';

export const PrivacyProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const privacy = user?.privacySettings || {};

  // R3 (a): balance masking - starts from the saved preference, the eye button toggles it live
  const [balancesHidden, setBalancesHidden] = useState(Boolean(privacy.maskBalances));

  // R3 (b): PIN unlock - timestamp until which locked sections stay open (null = locked)
  const [unlockedUntil, setUnlockedUntil] = useState(null);

  // Re-sync the eye when the saved preference changes (login, saving Profile)
  useEffect(() => {
    setBalancesHidden(Boolean(user?.privacySettings?.maskBalances));
  }, [user?._id, user?.privacySettings?.maskBalances]);

  // Restore an unlock after page refresh; forget it on logout
  useEffect(() => {
    if (loading) return;
    if (!user) {
      clearUnlock();
      setUnlockedUntil(null);
      return;
    }
    const saved = getUnlock(user._id);
    setUnlockedUntil(saved ? saved.expiresAt : null);
  }, [loading, user?._id]);

  // Auto-lock again when the unlock time runs out
  useEffect(() => {
    if (!unlockedUntil) return undefined;
    const remaining = unlockedUntil - Date.now();
    if (remaining <= 0) {
      clearUnlock();
      setUnlockedUntil(null);
      return undefined;
    }
    const timer = setTimeout(() => {
      clearUnlock();
      setUnlockedUntil(null);
    }, remaining);
    return () => clearTimeout(timer);
  }, [unlockedUntil]);

  // Server answered "PIN required" (e.g. token expired) -> lock immediately
  useEffect(() => {
    const onPinRequired = () => {
      clearUnlock();
      setUnlockedUntil(null);
    };
    window.addEventListener('pin-required', onPinRequired);
    return () => window.removeEventListener('pin-required', onPinRequired);
  }, []);

  const toggleBalances = useCallback(() => setBalancesHidden((prev) => !prev), []);

  const isUnlocked = Boolean(unlockedUntil && unlockedUntil > Date.now());
  const hasActiveLocks = Boolean(privacy.pinEnabled && privacy.lockedSections?.length > 0);

  const isSectionLocked = (section) =>
    Boolean(privacy.pinEnabled && privacy.lockedSections?.includes(section) && !isUnlocked);

  // Throws the axios error when the PIN is wrong so the caller can show the message
  const unlock = async (pin) => {
    const data = await verifyPin(pin);
    saveUnlock(data.unlockToken, data.expiresIn, user._id);
    setUnlockedUntil(Date.now() + data.expiresIn * 1000);
  };

  const lockNow = () => {
    clearUnlock();
    setUnlockedUntil(null);
  };

  // Use this instead of formatCurrency() for any sensitive money value
  const formatMoney = (amount, currency) =>
    balancesHidden ? MASK : formatCurrency(amount, currency);

  return (
    <PrivacyContext.Provider
      value={{
        balancesHidden,
        toggleBalances,
        formatMoney,
        isSectionLocked,
        isUnlocked,
        hasActiveLocks,
        unlock,
        lockNow,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => useContext(PrivacyContext);
