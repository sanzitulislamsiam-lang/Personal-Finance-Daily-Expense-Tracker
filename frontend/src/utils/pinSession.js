// R3: keeps the short-lived PIN unlock token in sessionStorage
// (cleared automatically when the browser tab is closed).
const KEY = 'pinUnlock';

export const saveUnlock = (token, expiresInSeconds, userId) => {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ token, userId, expiresAt: Date.now() + expiresInSeconds * 1000 })
    );
  } catch (e) {
    /* storage unavailable - user will simply be asked for the PIN again */
  }
};

export const getUnlock = (userId) => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.expiresAt <= Date.now() || (userId && data.userId !== userId)) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
};

export const clearUnlock = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch (e) {
    /* ignore */
  }
};
