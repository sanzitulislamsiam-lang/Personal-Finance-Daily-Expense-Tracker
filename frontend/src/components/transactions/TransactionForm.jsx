import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  Calendar,
  Clock,
  CreditCard,
  Tag,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  type = 'Expense', // 'Expense' or 'Income'
  editingTransaction = null,
  editingExpense = null, // for backwards compatibility
  accounts = [],
  categories = [],
  preferredCurrency = 'BDT',
  submitting = false,
}) {
  const activeRecord = editingTransaction || editingExpense;
  const isIncome = type === 'Income';

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().substring(0, 5);
  };

  const initialForm = {
    amount: '',
    accountId: '',
    categoryId: '',
    date: getTodayDate(),
    time: getCurrentTime(),
    note: '',
    tags: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeRecord) {
      setFormData({
        amount: activeRecord.amount || '',
        accountId: activeRecord.account?._id || activeRecord.account || '',
        categoryId: activeRecord.category?._id || activeRecord.category || '',
        date: activeRecord.date ? new Date(activeRecord.date).toISOString().split('T')[0] : getTodayDate(),
        time: activeRecord.time || getCurrentTime(),
        note: activeRecord.note || '',
        tags: Array.isArray(activeRecord.tags) ? activeRecord.tags.join(', ') : '',
      });
    } else {
      setFormData({
        ...initialForm,
        accountId: accounts.length > 0 ? accounts[0]._id : '',
        categoryId: categories.length > 0 ? categories[0]._id : '',
      });
    }
    setError('');
  }, [activeRecord, isOpen, accounts, categories]);

  if (!isOpen) return null;

  const selectedAccount = accounts.find((acc) => acc._id === formData.accountId);
  const enteredAmount = Number(formData.amount) || 0;
  const isOverdraft =
    !isIncome &&
    selectedAccount &&
    selectedAccount.accountType !== 'Credit Card' &&
    enteredAmount > (selectedAccount.balance + (activeRecord ? activeRecord.amount : 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.amount || enteredAmount <= 0) {
      setError(`Please provide a valid ${isIncome ? 'income' : 'expense'} amount greater than 0.`);
      return;
    }

    if (!formData.accountId) {
      setError(`Please select an account to ${isIncome ? 'deposit into' : 'pay from'}.`);
      return;
    }

    if (!formData.categoryId) {
      setError(`Please choose an ${isIncome ? 'income source' : 'expense'} category.`);
      return;
    }

    if (!formData.date) {
      setError('Please select the date.');
      return;
    }

    const payload = {
      amount: enteredAmount,
      accountId: formData.accountId,
      categoryId: formData.categoryId,
      date: formData.date,
      time: formData.time,
      note: formData.note,
      tags: formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  isIncome ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              {activeRecord
                ? `Edit ${isIncome ? 'Income' : 'Expense'} Record`
                : isIncome
                ? 'Log New Income'
                : 'Log Daily Expense'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeRecord
                ? `Update ${isIncome ? 'income' : 'expense'} details and balance reconciliation`
                : isIncome
                ? 'Record incoming funds and automatically credit aggregate account balance'
                : 'Record outgoing payment and automatically deduct account balance'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              {isIncome ? 'Income Amount' : 'Expense Amount'} ({preferredCurrency}){' '}
              <span className={isIncome ? 'text-emerald-500' : 'text-red-500'}>*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                {preferredCurrency === 'USD' ? '$' : '৳'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                className={`w-full pl-9 pr-4 py-2.5 text-base font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                  isIncome
                    ? 'focus:ring-emerald-500/30 focus:border-emerald-500'
                    : 'focus:ring-red-500/30 focus:border-red-500'
                }`}
              />
            </div>
            {isOverdraft && (
              <p className="mt-1 text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Warning: Expense exceeds current account balance (
                {formatCurrency(selectedAccount.balance, selectedAccount.currency)})
              </p>
            )}
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              {isIncome ? 'Deposit To Account' : 'Paid From Account'}{' '}
              <span className={isIncome ? 'text-emerald-500' : 'text-red-500'}>*</span>
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                required
                className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                  isIncome
                    ? 'focus:ring-emerald-500/30 focus:border-emerald-500'
                    : 'focus:ring-red-500/30 focus:border-red-500'
                }`}
              >
                <option value="" disabled>
                  Select account...
                </option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} — {acc.accountType} (Current Balance:{' '}
                    {formatCurrency(acc.balance, acc.currency)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              {isIncome ? 'Income Source / Category' : 'Expense Category'}{' '}
              <span className={isIncome ? 'text-emerald-500' : 'text-red-500'}>*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
                className={`w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                  isIncome
                    ? 'focus:ring-emerald-500/30 focus:border-emerald-500'
                    : 'focus:ring-red-500/30 focus:border-red-500'
                }`}
              >
                <option value="" disabled>
                  Select category...
                </option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Date <span className={isIncome ? 'text-emerald-500' : 'text-red-500'}>*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    isIncome ? 'focus:ring-emerald-500/30' : 'focus:ring-red-500/30'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    isIncome ? 'focus:ring-emerald-500/30' : 'focus:ring-red-500/30'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Notes / Reference (Optional)
            </label>
            <div className="relative">
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder={
                  isIncome
                    ? 'e.g., Monthly salary payment, Upwork client payout, Birthday gift'
                    : 'What was this expense for? (e.g. Lunch with team, Groceries)'
                }
                rows={2}
                className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                  isIncome
                    ? 'focus:ring-emerald-500/30 focus:border-emerald-500'
                    : 'focus:ring-red-500/30 focus:border-red-500'
                }`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-lg flex items-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-50 ${
                isIncome
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 shadow-red-500/25'
              }`}
            >
              {submitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {activeRecord
                      ? `Update ${isIncome ? 'Income' : 'Expense'}`
                      : isIncome
                      ? 'Log Income'
                      : 'Log Expense'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
