const express = require('express');
const router = express.Router();
const {
  // R4: Expense Logging
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  // R5: Income Logging
  getIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// ==========================================
// FEATURE R4: EXPENSE LOGGING ROUTES
// ==========================================
router.route('/expenses')
  .get(getExpenses)
  .post(createExpense);

router.route('/expenses/:id')
  .get(getExpenseById)
  .put(updateExpense)
  .delete(deleteExpense);

// ==========================================
// FEATURE R5: INCOME LOGGING ROUTES
// ==========================================
router.route('/incomes')
  .get(getIncomes)
  .post(createIncome);

router.route('/incomes/:id')
  .get(getIncomeById)
  .put(updateIncome)
  .delete(deleteIncome);

module.exports = router;
