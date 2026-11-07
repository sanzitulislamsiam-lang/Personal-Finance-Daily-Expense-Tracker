import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';

vi.mock('../api/privacyApi', () => ({
  verifyPin: vi.fn(),
  updatePrivacy: vi.fn(),
  setPin: vi.fn(),
  removePin: vi.fn(),
}));

import { verifyPin } from '../api/privacyApi';
import { AuthProvider } from '../context/AuthContext';
import { PrivacyProvider, usePrivacy } from '../context/PrivacyContext';
import PinLock from '../components/common/PinLock';

const storeUser = (privacySettings) => {
  localStorage.setItem(
    'userInfo',
    JSON.stringify({ _id: 'u1', name: 'Test', token: 'jwt', preferredCurrency: 'BDT', privacySettings })
  );
};

const wrap = (ui) =>
  render(
    <AuthProvider>
      <PrivacyProvider>{ui}</PrivacyProvider>
    </AuthProvider>
  );

const Money = () => {
  const { formatMoney, toggleBalances, balancesHidden } = usePrivacy();
  return (
    <div>
      <span data-testid="money">{formatMoney(1500, 'BDT')}</span>
      <button onClick={toggleBalances}>{balancesHidden ? 'show' : 'hide'}</button>
    </div>
  );
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('R3 balance masking', () => {
  test('shows the amount when masking is off and hides it with the toggle', async () => {
    storeUser({ maskBalances: false, pinEnabled: false, lockedSections: [] });
    wrap(<Money />);
    expect(await screen.findByTestId('money')).toHaveTextContent('৳1,500.00');

    await userEvent.click(screen.getByText('hide'));
    expect(screen.getByTestId('money')).toHaveTextContent('••••••');
    expect(screen.getByTestId('money')).not.toHaveTextContent('1,500');
  });

  test('starts hidden when the saved preference is maskBalances = true, and can be revealed', async () => {
    storeUser({ maskBalances: true, pinEnabled: false, lockedSections: [] });
    wrap(<Money />);
    await waitFor(() => expect(screen.getByTestId('money')).toHaveTextContent('••••••'));

    await userEvent.click(screen.getByText('show'));
    expect(screen.getByTestId('money')).toHaveTextContent('৳1,500.00');
  });
});

describe('R3 PIN lock screen', () => {
  const Secret = () => <div>SECRET ACCOUNTS</div>;

  test('renders the section normally when no PIN / not locked', async () => {
    storeUser({ maskBalances: false, pinEnabled: false, lockedSections: [] });
    wrap(<PinLock section="accounts"><Secret /></PinLock>);
    expect(await screen.findByText('SECRET ACCOUNTS')).toBeInTheDocument();
  });

  test('renders normally when the PIN exists but this section is not locked', async () => {
    storeUser({ maskBalances: false, pinEnabled: true, lockedSections: ['budgets'] });
    wrap(<PinLock section="accounts"><Secret /></PinLock>);
    expect(await screen.findByText('SECRET ACCOUNTS')).toBeInTheDocument();
  });

  test('locked section hides the content and asks for the PIN', async () => {
    storeUser({ maskBalances: false, pinEnabled: true, lockedSections: ['accounts'] });
    wrap(<PinLock section="accounts"><Secret /></PinLock>);
    expect(await screen.findByText('Section Locked')).toBeInTheDocument();
    expect(screen.queryByText('SECRET ACCOUNTS')).not.toBeInTheDocument();
  });

  test('wrong PIN shows attempts left and keeps the section locked', async () => {
    storeUser({ maskBalances: false, pinEnabled: true, lockedSections: ['accounts'] });
    verifyPin.mockRejectedValue({
      response: { status: 401, data: { code: 'PIN_INVALID', attemptsRemaining: 3 } },
    });
    wrap(<PinLock section="accounts"><Secret /></PinLock>);
    await screen.findByText('Section Locked');

    await userEvent.type(screen.getByLabelText('PIN digit 1'), '1');
    await userEvent.keyboard('111');

    expect(await screen.findByText(/Incorrect PIN\. 3 attempt\(s\) left\./)).toBeInTheDocument();
    expect(screen.queryByText('SECRET ACCOUNTS')).not.toBeInTheDocument();
  });

  test('lock-out message disables the inputs', async () => {
    storeUser({ maskBalances: false, pinEnabled: true, lockedSections: ['accounts'] });
    verifyPin.mockRejectedValue({
      response: {
        status: 423,
        data: { code: 'PIN_LOCKED_OUT', message: 'Too many wrong PIN attempts. Try again in 5 minute(s).', retryAfterSeconds: 300 },
      },
    });
    wrap(<PinLock section="accounts"><Secret /></PinLock>);
    await screen.findByText('Section Locked');

    await userEvent.type(screen.getByLabelText('PIN digit 1'), '1');
    await userEvent.keyboard('111');

    expect(await screen.findByText(/Too many wrong PIN attempts/)).toBeInTheDocument();
    expect(screen.getByLabelText('PIN digit 1')).toBeDisabled();
  });

  test('correct PIN opens the section and stores the unlock token for this tab only', async () => {
    storeUser({ maskBalances: false, pinEnabled: true, lockedSections: ['accounts'] });
    verifyPin.mockResolvedValue({ valid: true, unlockToken: 'tok123', expiresIn: 600 });
    wrap(<PinLock section="accounts"><Secret /></PinLock>);
    await screen.findByText('Section Locked');

    await userEvent.type(screen.getByLabelText('PIN digit 1'), '1');
    await userEvent.keyboard('234');

    expect(await screen.findByText('SECRET ACCOUNTS')).toBeInTheDocument();
    expect(verifyPin).toHaveBeenCalledWith('1234');
    expect(JSON.parse(sessionStorage.getItem('pinUnlock')).token).toBe('tok123');
    expect(localStorage.getItem('pinUnlock')).toBeNull();
  });

  test('a still-valid unlock survives a page refresh', async () => {
    storeUser({ maskBalances: false, pinEnabled: true, lockedSections: ['accounts'] });
    sessionStorage.setItem(
      'pinUnlock',
      JSON.stringify({ token: 'tok', userId: 'u1', expiresAt: Date.now() + 60000 })
    );
    wrap(<PinLock section="accounts"><Secret /></PinLock>);
    expect(await screen.findByText('SECRET ACCOUNTS')).toBeInTheDocument();
  });

  test('an expired unlock does NOT open the section', async () => {
    storeUser({ maskBalances: false, pinEnabled: true, lockedSections: ['accounts'] });
    sessionStorage.setItem(
      'pinUnlock',
      JSON.stringify({ token: 'tok', userId: 'u1', expiresAt: Date.now() - 1000 })
    );
    wrap(<PinLock section="accounts"><Secret /></PinLock>);
    expect(await screen.findByText('Section Locked')).toBeInTheDocument();
  });

  test('server "PIN required" event locks the section again', async () => {
    storeUser({ maskBalances: false, pinEnabled: true, lockedSections: ['accounts'] });
    sessionStorage.setItem(
      'pinUnlock',
      JSON.stringify({ token: 'tok', userId: 'u1', expiresAt: Date.now() + 60000 })
    );
    wrap(<PinLock section="accounts"><Secret /></PinLock>);
    await screen.findByText('SECRET ACCOUNTS');

    act(() => {
      window.dispatchEvent(new Event('pin-required'));
    });
    expect(await screen.findByText('Section Locked')).toBeInTheDocument();
    expect(sessionStorage.getItem('pinUnlock')).toBeNull();
  });
});
