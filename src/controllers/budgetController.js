import BudgetModel from '../models/BudgetModel.js';
import ExpenseModel from '../models/ExpenseModel.js';
import { roundToTwoDecimals, calculatePercentage } from '../utils/money.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getBudgets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const budgets = await BudgetModel.findAll({ userId, month, year });

    // Calculate actual spending for each category in this period
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

    const { expenses } = await ExpenseModel.findAll({
      userId,
      startDate: startOfMonth,
      endDate: endOfMonth,
      limit: 10000,
    });

    const enrichedBudgets = budgets.map((b) => {
      const spent = expenses
        .filter((e) => e.category_id === b.category_id)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const roundedSpent = roundToTwoDecimals(spent);
      const remaining = roundToTwoDecimals(b.amount - roundedSpent);
      const percentage = calculatePercentage(roundedSpent, b.amount);

      let status = 'normal'; // 0 - 70%
      if (percentage >= 100) {
        status = 'exceeded'; // 100%+
      } else if (percentage >= 90) {
        status = 'danger'; // 90 - 100%
      } else if (percentage >= 70) {
        status = 'warning'; // 70 - 90%
      }

      return {
        ...b,
        spent: roundedSpent,
        remaining,
        percentage,
        status,
      };
    });

    const totalBudget = roundToTwoDecimals(budgets.reduce((s, b) => s + Number(b.amount), 0));
    const totalSpent = roundToTwoDecimals(enrichedBudgets.reduce((s, b) => s + b.spent, 0));
    const totalRemaining = roundToTwoDecimals(totalBudget - totalSpent);

    return successResponse(
      res,
      {
        budgets: enrichedBudgets,
        overview: {
          totalBudget,
          totalSpent,
          totalRemaining,
          month,
          year,
        },
      },
      'Budgets retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const setBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category_id, amount, month, year } = req.body;

    const budget = await BudgetModel.upsert({
      userId,
      categoryId: category_id,
      amount,
      month,
      year,
    });

    return successResponse(res, { budget }, 'Budget limit saved successfully!', 201);
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await BudgetModel.delete(id, userId);

    return successResponse(res, null, 'Budget limit deleted successfully');
  } catch (error) {
    next(error);
  }
};
