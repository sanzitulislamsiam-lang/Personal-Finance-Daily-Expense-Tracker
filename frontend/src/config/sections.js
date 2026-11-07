// R3: sections the user can protect with a PIN.
// "key" must match LOCKABLE_SECTIONS in backend/config/lockableSections.js
export const LOCKABLE_SECTIONS = [
  { key: 'accounts', label: 'Accounts & Balances' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'budgets', label: 'Budgets' },
  { key: 'goals', label: 'Savings Goals' },
  { key: 'debts', label: 'Lend & Borrow' },
  { key: 'analytics', label: 'Analytics & Reports' },
];
