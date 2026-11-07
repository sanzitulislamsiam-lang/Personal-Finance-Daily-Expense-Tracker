import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Calendar,
  CreditCard,
  Tag,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  DollarSign,
  Clock,
  Sparkles,
  ArrowUpRight,
  Briefcase,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getIncomes, createIncome, updateIncome, deleteIncome, getCategories } from '../api/transactionApi';
import { getAccounts } from '../api/accountApi';
import { formatCurrency } from '../utils/formatCurrency';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionFilter from '../components/transactions/TransactionFilter';

export default function IncomeLog() {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    count: 0,
    totalIncome: 0,
    todayIncome: 0,
    thisMonthIncome: 0,
    categoryBreakdown: {},
  });

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Privacy mask toggle (R3 support)
  const [isMasked, setIsMasked] = useState(user?.privacySettings?.maskBalances ?? false);

  // Filter State
  const initialFilters = {
    search: '',
    categoryId: '',
    accountId: '',
    startDate: '',
    endDate: '',
    activeQuickDate: 'all',
  };
  const [filters, setFilters] = useState(initialFilters);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deletingIncome, setDeletingIncome] = useState(null);

  useEffect(() => {
    loadAccountsAndCategories();
  }, []);

  useEffect(() => {
    fetchIncomeData();
  }, [filters]);

  const loadAccountsAndCategories = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        getAccounts(),
        getCategories({ type: 'Income' }),
      ]);
      setAccounts(accRes.accounts || []);
      setCategories(catRes || []);
    } catch (err) {
      console.error('Failed to load accounts/categories for income:', err);
    }
  };

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      const data = await getIncomes({
        startDate: filters.startDate,
        endDate: filters.endDate,
        categoryId: filters.categoryId,
        accountId: filters.accountId,
        search: filters.search,
      });

      setIncomes(data.incomes || []);
      setSummary(
        data.summary || {
          count: 0,
          totalIncome: 0,
          todayIncome: 0,
          thisMonthIncome: 0,
          categoryBreakdown: {},
        }
      );
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch income records.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create or Update Income
  const handleFormSubmit = async (payload) => {
    try {
      setSubmitting(true);
      if (editingIncome) {
        await updateIncome(editingIncome._id, payload);
        setNotification({
          type: 'success',
          message: 'Income record updated and account balance reconciled successfully!',
        });
      } else {
        await createIncome(payload);
        setNotification({
          type: 'success',
          message: 'Incoming funds logged and account balance credited!',
        });
      }

      setIsFormOpen(false);
      setEditingIncome(null);
      fetchIncomeData();
      // Refresh accounts list to reflect newly credited balance
      const accRes = await getAccounts();
      setAccounts(accRes.accounts || []);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Error saving income transaction.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Income
  const handleDeleteConfirm = async () => {
    if (!deletingIncome) return;
    try {
      await deleteIncome(deletingIncome._id);
      setNotification({
        type: 'success',
        message: `Income of ${formatCurrency(deletingIncome.amount, user?.preferredCurrency)} deleted and deducted from account.`,
      });
      setDeletingIncome(null);
      fetchIncomeData();
      const accRes = await getAccounts();
      setAccounts(accRes.accounts || []);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete income record.',
      });
    }
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Income & Inflow Tracker
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Feature R5 • Record earnings, track revenue sources, and auto-credit account balances
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Privacy Balance Mask Button */}
          <button
            onClick={() => setIsMasked(!isMasked)}
            title={isMasked ? 'Reveal Amounts' : 'Mask Amounts'}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/60 dark:border-slate-700/60"
          >
            {isMasked ? <EyeOff className="w-5 h-5 text-emerald-500" /> : <Eye className="w-5 h-5 text-slate-400" />}
          </button>

          {/* Log Income Button */}
          <button
            onClick={() => {
              setEditingIncome(null);
              setIsFormOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Log New Income
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification.message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification({ type: '', message: '' })}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Income */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Received Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {isMasked ? '••••••' : formatCurrency(summary.todayIncome, user?.preferredCurrency)}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Today's incoming funds</p>
          </div>
        </div>

        {/* This Month's Income */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              This Month
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isMasked ? '••••••' : formatCurrency(summary.thisMonthIncome, user?.preferredCurrency)}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Month-to-date earnings</p>
          </div>
        </div>

        {/* Filtered Total Income */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Filtered Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isMasked ? '••••••' : formatCurrency(summary.totalIncome, user?.preferredCurrency)}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Current view selection</p>
          </div>
        </div>

        {/* Total Income Entries */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Inflows Logged
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {summary.count}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Earnings transactions</p>
          </div>
        </div>
      </div>

      {/* Filter Component */}
      <TransactionFilter
        filters={filters}
        setFilters={setFilters}
        accounts={accounts}
        categories={categories}
        onReset={handleResetFilters}
      />

      {/* Income List / Table */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Income Records ({incomes.length})
          </h2>
          <span className="text-xs text-slate-400 font-medium">Sorted by latest date</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
            Loading income records...
          </div>
        ) : incomes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
              No income records found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No income entries match your current filters or you haven't recorded incoming funds yet.
            </p>
            <button
              onClick={() => {
                setEditingIncome(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Log Your First Income
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Source / Category</th>
                  <th className="px-6 py-3.5">Deposited To Account</th>
                  <th className="px-6 py-3.5">Reference Notes</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {incomes.map((income) => {
                  const incomeDate = new Date(income.date);
                  const formattedDate = incomeDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={income._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date & Time */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {formattedDate}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {income.time || '12:00'}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-sm"
                          style={{ backgroundColor: income.category?.color || '#10B981' }}
                        >
                          <Tag className="w-3 h-3" />
                          {income.category?.name || 'Income'}
                        </span>
                      </td>

                      {/* Destination Account */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-500" />
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {income.account?.name || 'Deleted Account'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {income.account?.accountType || 'Account'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Notes / Reference */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-slate-700 dark:text-slate-300 truncate">
                          {income.note || <span className="text-slate-400 italic">No notes</span>}
                        </div>
                        {income.tags && income.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {income.tags.map((t, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                          {isMasked ? '••••••' : `+${formatCurrency(income.amount, income.account?.currency || user?.preferredCurrency)}`}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingIncome(income);
                              setIsFormOpen(true);
                            }}
                            title="Edit Income Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingIncome(income)}
                            title="Delete Income Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal (Add/Edit) */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingIncome(null);
        }}
        onSubmit={handleFormSubmit}
        type="Income"
        editingTransaction={editingIncome}
        accounts={accounts}
        categories={categories}
        preferredCurrency={user?.preferredCurrency}
        submitting={submitting}
      />

      {/* Delete Confirmation Modal */}
      {deletingIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Income Record?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete this income of{' '}
                <span className="font-bold text-emerald-500">
                  {formatCurrency(deletingIncome.amount, user?.preferredCurrency)}
                </span>
                ? This amount will automatically be deducted back from{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {deletingIncome.account?.name}
                </span>
                .
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingIncome(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20 transition-all"
              >
                Yes, Delete & Reverse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
