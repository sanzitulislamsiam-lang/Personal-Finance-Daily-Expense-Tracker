// R3: sections of the app that a user can protect with their PIN.
// Add a new name here when a new page/module should become lockable.
const LOCKABLE_SECTIONS = [
  'accounts',
  'transactions',
  'budgets',
  'goals',
  'debts',
  'analytics',
];

module.exports = LOCKABLE_SECTIONS;
