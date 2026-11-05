import React, { useState, useEffect } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/accountApi';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import {
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({ totalBalance: 0, breakdownByType: {} });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Masking toggle
  const [isMasked, setIsMasked] = useState(user?.privacySettings?.maskBalances ?? false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    accountType: 'Cash',
    balance: '',
    institutionName: '',
    accountNumber: '',
    creditLimit: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchAccounts();
    if (user?.privacySettings?.maskBalances !== undefined) {
      setIsMasked(user.privacySettings.maskBalances);
    }
  }, [user]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data.accounts || []);
      setSummary(data.summary || { totalBalance: 0, breakdownByType: {} });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load accounts.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        accountType: account.accountType,
        balance: account.balance,
        institutionName: account.institutionName || '',
        accountNumber: account.accountNumber || '',
        creditLimit: account.creditLimit || '',
        notes: account.notes || '',
      });
    } else {
      setEditingAccount(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
    setNotification({ type: '', message: '' });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setFormData(initialForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotification({ type: '', message: '' });

    try {
      if (editingAccount) {
        await updateAccount(editingAccount._id, formData);
        setNotification({ type: 'success', message: 'Account updated successfully!' });
      } else {
        await createAccount(formData);
        setNotification({ type: 'success', message: 'Account created successfully!' });
      }
      handleCloseModal();
      fetchAccounts();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save account.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteAccount(id);
      setNotification({ type: 'success', message: `Account "${name}" deleted.` });
      fetchAccounts();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete account.',
      });
    }
  };

  // Card themes per account type (Glassmorphism & Gradients)
  const getTheme = (type) => {
    switch (type) {
      case 'Bank':
        return {
          gradient: 'from-blue-600 via-indigo-600 to-blue-800',
          badge: 'bg-blue-400/20 text-blue-200 border-blue-400/30',
          iconBg: 'bg-white/10 text-white',
          chipColor: 'from-amber-200 to-yellow-400',
          icon: <Building2 className="w-5 h-5 text-white" />,
        };
      case 'Mobile Wallet':
        return {
          gradient: 'from-rose-500 via-pink-600 to-rose-700',
          badge: 'bg-pink-400/20 text-pink-200 border-pink-400/30',
          iconBg: 'bg-white/10 text-white',
          chipColor: 'from-amber-200 to-yellow-400',
          icon: <Smartphone className="w-5 h-5 text-white" />,
        };
      case 'Credit Card':
        return {
          gradient: 'from-slate-900 via-zinc-900 to-stone-900',
          badge: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
          iconBg: 'bg-white/10 text-white',
          chipColor: 'from-amber-300 via-yellow-400 to-yellow-500',
          icon: <CreditCard className="w-5 h-5 text-white" />,
        };
      default: // Cash
        return {
          gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
          badge: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
          iconBg: 'bg-white/10 text-white',
          chipColor: 'from-amber-200 to-yellow-400',
          icon: <Wallet className="w-5 h-5 text-white" />,
        };
    }
  };

  const userCurrency = user?.preferredCurrency || 'BDT';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
          <Sparkles className="w-4 h-4 text-emerald-500 absolute inset-0 m-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Hero Section with Deep Dark Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C1222] via-[#0F172A] to-[#0A1A1E] p-6 sm:p-8 text-white shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Real-time Multi-Account Ledger
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Accounts & Balances</h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Track physical cash, bank deposits, and mobile wallets in one unified dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMasked((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold backdrop-blur-md transition-all text-white"
            >
              {isMasked ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
              {isMasked ? 'Reveal Balances' : 'Hide Balances'}
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              New Account
            </button>
          </div>
        </div>

        {/* Aggregate Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Worth</span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              {isMasked ? '••••••' : formatCurrency(summary.totalBalance, userCurrency)}
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 font-semibold">
              <TrendingUp className="w-3 h-3" /> Live Aggregate
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cash</span>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">
              {isMasked ? '••••••' : formatCurrency(summary.breakdownByType?.Cash || 0, userCurrency)}
            </div>
            <span className="text-[10px] text-slate-400">Physical Wallets</span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Banks</span>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">
              {isMasked ? '••••••' : formatCurrency(summary.breakdownByType?.Bank || 0, userCurrency)}
            </div>
            <span className="text-[10px] text-slate-400">Checking & Savings</span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mobile Wallets</span>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">
              {isMasked ? '••••••' : formatCurrency(summary.breakdownByType?.['Mobile Wallet'] || 0, userCurrency)}
            </div>
            <span className="text-[10px] text-slate-400">bKash & Nagad</span>
          </div>
        </div>
      </div>

      {notification.message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border shadow-sm transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Account Cards Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            Financial Accounts ({accounts.length})
          </h2>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#121826] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No accounts registered yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6 max-w-sm mx-auto">
              Add your Cash wallet, Bank account, or bKash wallet to begin tracking your financial health.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Add Your First Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((acc) => {
              const theme = getTheme(acc.accountType);
              return (
                <div
                  key={acc._id}
                  className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.gradient} p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between min-h-[220px] border border-white/10`}
                >
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>

                  {/* Card Top */}
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl backdrop-blur-md ${theme.iconBg} border border-white/10 shadow-inner`}>
                          {theme.icon}
                        </div>
                        <div>
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badge}`}
                          >
                            {acc.accountType}
                          </span>
                          <h3 className="text-lg font-black tracking-tight text-white mt-1 leading-snug">
                            {acc.name}
                          </h3>
                        </div>
                      </div>

                      {/* Chip */}
                      <div
                        className={`w-9 h-7 rounded-md bg-gradient-to-tr ${theme.chipColor} shadow-inner opacity-90 border border-amber-300/40`}
                      ></div>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="relative z-10 my-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                      Available Balance
                    </div>
                    <div className="text-3xl font-black tracking-tight mt-0.5 drop-shadow-md">
                      {isMasked ? '••••••••' : formatCurrency(acc.balance, userCurrency)}
                    </div>
                    {acc.accountType === 'Credit Card' && acc.creditLimit > 0 && (
                      <div className="text-[11px] text-white/70 mt-1">
                        Limit: {formatCurrency(acc.creditLimit, userCurrency)}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
                    <div className="font-mono tracking-wider">
                      {acc.accountNumber
                        ? `•••• ${acc.accountNumber.slice(-4)}`
                        : acc.institutionName || 'Active Account'}
                    </div>

                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(acc)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
                        title="Edit Account"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(acc._id, acc.name)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/80 backdrop-blur-md transition-colors"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Styled Modal for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121826] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold">
                  {editingAccount ? 'Update Account Details' : 'Add New Money Account'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Enter balance and provider details for real-time tracking
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Account Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Personal bKash, BRAC Salary, Pocket Cash"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Account Type *
                  </label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Cash">Cash (Wallet)</option>
                    <option value="Bank">Bank Account</option>
                    <option value="Mobile Wallet">Mobile Wallet (bKash/Nagad)</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Current Balance ({userCurrency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="balance"
                    required
                    value={formData.balance}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Institution / Provider
                  </label>
                  <input
                    type="text"
                    name="institutionName"
                    value={formData.institutionName}
                    onChange={handleChange}
                    placeholder="e.g. bKash, BRAC Bank"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Account / Card Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="e.g. 017xxxxxxxx or 4123"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {formData.accountType === 'Credit Card' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Credit Limit ({userCurrency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    placeholder="e.g. 50000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Optional Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Notes for personal reference..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl text-xs tracking-wider uppercase shadow-md shadow-emerald-500/20 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
