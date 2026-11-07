import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
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
  PieChart,
  ArrowDownRight,
  Clock,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories } from '../api/transactionApi';
import { getAccounts } from '../api/accountApi';
import { formatCurrency } from '../utils/formatCurrency';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionFilter from '../components/transactions/TransactionFilter';

export default function ExpenseLog() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    count: 0,
    totalExpenses: 0,
    todayExpenses: 0,
    thisMonthExpenses: 0,
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
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deletingExpense, setDeletingExpense] = useState(null);

  useEffect(() => {
    loadAccountsAndCategories();
  }, []);

  useEffect(() => {
    fetchExpenseData();
  }, [filters]);

  const loadAccountsAndCategories = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        getAccounts(),
        getCategories({ type: 'Expense' }),
      ]);
      setAccounts(accRes.accounts || []);
      setCategories(catRes || []);
    } catch (err) {
      console.error('Failed to load initial accounts/categories:', err);
    }
  };

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      const data = await getExpenses({
        startDate: filters.startDate,
        endDate: filters.endDate,
        categoryId: filters.categoryId,
        accountId: filters.accountId,
        search: filters.search,
      });

      setExpenses(data.expenses || []);
      setSummary(
        data.summary || {
          count: 0,
          totalExpenses: 0,
          todayExpenses: 0,
          thisMonthExpenses: 0,
          categoryBreakdown: {},
        }
      );
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch expense records.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create or Update Expense
  const handleFormSubmit = async (payload) => {
    try {
      setSubmitting(true);
      if (editingExpense) {
        await updateExpense(editingExpense._id, payload);
        setNotification({
          type: 'success',
          message: 'Expense record updated successfully!',
        });
      } else {
        await createExpense(payload);
        setNotification({
          type: 'success',
          message: 'New daily expense logged and account balance updated!',
        });
      }

      setIsFormOpen(false);
      setEditingExpense(null);
      fetchExpenseData();
      // Refresh accounts in case balance changed
      const accRes = await getAccounts();
      setAccounts(accRes.accounts || []);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Error saving expense transaction.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;
    try {
      await deleteExpense(deletingExpense._id);
      setNotification({
        type: 'success',
        message: `Expense of ${formatCurrency(deletingExpense.amount, user?.preferredCurrency)} deleted and refunded to account.`,
      });
      setDeletingExpense(null);
      fetchExpenseData();
      const accRes = await getAccounts();
      setAccounts(accRes.accounts || []);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete expense.',
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
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/25">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Daily Expense Tracker
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Feature R4 • Record, monitor, and categorize your everyday spending
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
            {isMasked ? <EyeOff className="w-5 h-5 text-red-500" /> : <Eye className="w-5 h-5 text-slate-400" />}
          </button>

          {/* Log Expense Button */}
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsFormOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-red-500/25 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Log New Expense
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
        {/* Today's Spend */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Spent Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isMasked ? '••••••' : formatCurrency(summary.todayExpenses, user?.preferredCurrency)}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">24-hour daily spend</p>
          </div>
        </div>

        {/* This Month's Spend */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              This Month
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {isMasked ? '••••••' : formatCurrency(summary.thisMonthExpenses, user?.preferredCurrency)}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Month-to-date total</p>
          </div>
        </div>

        {/* Filtered Total Spend */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Filtered Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isMasked ? '••••••' : formatCurrency(summary.totalExpenses, user?.preferredCurrency)}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Current view selection</p>
          </div>
        </div>

        {/* Total Expense Entries */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Entries Found
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {summary.count}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Transactions recorded</p>
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

      {/* Expense List / Table */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Expense Records ({expenses.length})
          </h2>
          <span className="text-xs text-slate-400 font-medium">Sorted by latest date</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
            Loading expense records...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
              No expense records found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No expenses match your current filters or you haven't logged any daily expenses yet.
            </p>
            <button
              onClick={() => {
                setEditingExpense(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-red-500/20"
            >
              <Plus className="w-4 h-4" />
              Log Your First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Account / Paid Via</th>
                  <th className="px-6 py-3.5">Notes</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {expenses.map((expense) => {
                  const expenseDate = new Date(expense.date);
                  const formattedDate = expenseDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={expense._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date & Time */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {formattedDate}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {expense.time || '12:00'}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-sm"
                          style={{ backgroundColor: expense.category?.color || '#EF4444' }}
                        >
                          <Tag className="w-3 h-3" />
                          {expense.category?.name || 'General'}
                        </span>
                      </td>

                      {/* Account */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {expense.account?.name || 'Deleted Account'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {expense.account?.accountType || 'Account'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Notes / Description */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-slate-700 dark:text-slate-300 truncate">
                          {expense.note || <span className="text-slate-400 italic">No notes</span>}
                        </div>
                        {expense.tags && expense.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {expense.tags.map((t, i) => (
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
                        <span className="font-extrabold text-sm text-red-600 dark:text-red-400">
                          {isMasked ? '••••••' : `-${formatCurrency(expense.amount, expense.account?.currency || user?.preferredCurrency)}`}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setIsFormOpen(true);
                            }}
                            title="Edit Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingExpense(expense)}
                            title="Delete Record"
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
          setEditingExpense(null);
        }}
        onSubmit={handleFormSubmit}
        editingExpense={editingExpense}
        accounts={accounts}
        categories={categories}
        preferredCurrency={user?.preferredCurrency}
        submitting={submitting}
      />

      {/* Delete Confirmation Modal */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Expense Record?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete this expense of{' '}
                <span className="font-bold text-red-500">
                  {formatCurrency(deletingExpense.amount, user?.preferredCurrency)}
                </span>
                ? The amount will automatically be refunded back to{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {deletingExpense.account?.name}
                </span>
                .
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20 transition-all"
              >
                Yes, Delete & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
