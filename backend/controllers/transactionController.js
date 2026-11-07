const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');

// @desc    Get all expense transactions for logged-in user with filters and metrics
// @route   GET /api/transactions/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, categoryId, accountId, search } = req.query;

    const query = {
      user: req.user._id,
      type: 'Expense',
    };

    // Date range filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Category filter
    if (categoryId) {
      query.category = categoryId;
    }

    // Account filter
    if (accountId) {
      query.account = accountId;
    }

    // Keyword search in notes
    if (search && search.trim()) {
      query.note = { $regex: search.trim(), $options: 'i' };
    }

    // Execute query with populated references
    const expenses = await Transaction.find(query)
      .populate('account', 'name accountType institutionName balance currency')
      .populate('category', 'name icon color')
      .sort({ date: -1, createdAt: -1 });

    // Aggregate statistics
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // All expenses for user this month/today for summary metrics
    const allUserExpenses = await Transaction.find({
      user: req.user._id,
      type: 'Expense',
    }).populate('category', 'name color');

    let totalExpenseAmount = 0;
    expenses.forEach((e) => {
      totalExpenseAmount += e.amount || 0;
    });

    let todayExpenseAmount = 0;
    let thisMonthExpenseAmount = 0;
    const categoryTotals = {};

    allUserExpenses.forEach((exp) => {
      const expDate = new Date(exp.date);
      if (expDate >= startOfToday && expDate <= endOfToday) {
        todayExpenseAmount += exp.amount || 0;
      }
      if (expDate >= startOfMonth) {
        thisMonthExpenseAmount += exp.amount || 0;
      }

      const catName = exp.category?.name || 'Uncategorized';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + exp.amount;
    });

    res.json({
      expenses,
      summary: {
        count: expenses.length,
        totalExpenses: totalExpenseAmount,
        todayExpenses: todayExpenseAmount,
        thisMonthExpenses: thisMonthExpenseAmount,
        categoryBreakdown: categoryTotals,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single expense transaction details
// @route   GET /api/transactions/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
  try {
    const expense = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
      type: 'Expense',
    })
      .populate('account', 'name accountType institutionName balance currency')
      .populate('category', 'name icon color');

    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new daily expense transaction and update account balance
// @route   POST /api/transactions/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const { accountId, amount, categoryId, date, time, note, receiptUrl, tags } = req.body;

    // Validation
    if (!accountId) {
      return res.status(400).json({ message: 'Please select an account for this expense' });
    }

    if (!categoryId) {
      return res.status(400).json({ message: 'Please select an expense category' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid amount greater than zero' });
    }

    // Verify account ownership
    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Selected account was not found' });
    }

    // Check balance sufficiency for non-credit-card accounts
    if (account.accountType !== 'Credit Card' && account.balance < numAmount) {
      return res.status(400).json({
        message: `Insufficient funds in ${account.name}. Available balance: ${account.balance} ${account.currency}, Required: ${numAmount} ${account.currency}`,
      });
    }

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Selected category was not found' });
    }

    // Deduct amount from account balance
    account.balance = Number((account.balance - numAmount).toFixed(2));
    await account.save();

    // Create transaction record
    const expense = await Transaction.create({
      user: req.user._id,
      account: account._id,
      amount: numAmount,
      type: 'Expense',
      category: category._id,
      date: date ? new Date(date) : new Date(),
      time: time || undefined,
      note: note ? note.trim() : '',
      receiptUrl: receiptUrl || '',
      tags: Array.isArray(tags) ? tags : [],
    });

    const populatedExpense = await Transaction.findById(expense._id)
      .populate('account', 'name accountType balance currency')
      .populate('category', 'name icon color');

    res.status(201).json({
      message: 'Expense logged successfully',
      expense: populatedExpense,
      updatedAccount: {
        id: account._id,
        name: account.name,
        newBalance: account.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update existing expense and reconcile account balances
// @route   PUT /api/transactions/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const expense = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
      type: 'Expense',
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    const { accountId, amount, categoryId, date, time, note, receiptUrl, tags } = req.body;

    const newAmount = amount !== undefined ? Number(amount) : expense.amount;
    if (isNaN(newAmount) || newAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    const targetAccountId = accountId || expense.account.toString();

    // Balance reconciliation
    if (targetAccountId === expense.account.toString()) {
      // Same account: difference between new amount and old amount
      const account = await Account.findOne({ _id: targetAccountId, user: req.user._id });
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const diff = newAmount - expense.amount;
      if (account.accountType !== 'Credit Card' && account.balance < diff) {
        return res.status(400).json({
          message: `Insufficient balance for this update. Available balance: ${account.balance}`,
        });
      }

      account.balance = Number((account.balance - diff).toFixed(2));
      await account.save();
    } else {
      // Switched account: refund old account, deduct from new account
      const oldAccount = await Account.findOne({ _id: expense.account, user: req.user._id });
      const newAccount = await Account.findOne({ _id: targetAccountId, user: req.user._id });

      if (!newAccount) {
        return res.status(404).json({ message: 'New selected account not found' });
      }

      if (newAccount.accountType !== 'Credit Card' && newAccount.balance < newAmount) {
        return res.status(400).json({
          message: `Insufficient balance in ${newAccount.name}. Available: ${newAccount.balance}`,
        });
      }

      if (oldAccount) {
        oldAccount.balance = Number((oldAccount.balance + expense.amount).toFixed(2));
        await oldAccount.save();
      }

      newAccount.balance = Number((newAccount.balance - newAmount).toFixed(2));
      await newAccount.save();

      expense.account = newAccount._id;
    }

    // Update Category if provided
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      expense.category = category._id;
    }

    expense.amount = newAmount;
    if (date) expense.date = new Date(date);
    if (time !== undefined) expense.time = time;
    if (note !== undefined) expense.note = note.trim();
    if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl;
    if (tags !== undefined) expense.tags = Array.isArray(tags) ? tags : [];

    await expense.save();

    const updated = await Transaction.findById(expense._id)
      .populate('account', 'name accountType balance currency')
      .populate('category', 'name icon color');

    res.json({
      message: 'Expense updated successfully',
      expense: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete expense and refund deducted amount back to account
// @route   DELETE /api/transactions/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
      type: 'Expense',
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    // Refund deducted amount back to the account
    const account = await Account.findOne({ _id: expense.account, user: req.user._id });
    if (account) {
      account.balance = Number((account.balance + expense.amount).toFixed(2));
      await account.save();
    }

    await expense.deleteOne();

    res.json({
      message: 'Expense deleted and account balance restored successfully',
      refundedAmount: expense.amount,
      updatedAccount: account ? { id: account._id, name: account.name, balance: account.balance } : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
