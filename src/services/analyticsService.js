import ExpenseModel from '../models/ExpenseModel.js';
import IncomeModel from '../models/IncomeModel.js';
import BudgetModel from '../models/BudgetModel.js';
import { roundToTwoDecimals, calculatePercentage } from '../utils/money.js';

export class AnalyticsService {
  /**
   * Calculate high-level financial summary for user
   */
  static async getSummary(userId) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    // All-time totals
    const { expenses: allExpenses } = await ExpenseModel.findAll({ userId, limit: 10000 });
    const { incomes: allIncomes } = await IncomeModel.findAll({ userId, limit: 10000 });

    const totalIncome = roundToTwoDecimals(
      allIncomes.reduce((acc, curr) => acc + Number(curr.amount), 0)
    );
    const totalExpenses = roundToTwoDecimals(
      allExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0)
    );
    const remainingBalance = roundToTwoDecimals(totalIncome - totalExpenses);

    // This month's totals
    const thisMonthExpenses = allExpenses.filter(
      (e) => e.expense_date >= startOfMonth && e.expense_date <= endOfMonth
    );
    const thisMonthIncome = allIncomes.filter(
      (i) => i.income_date >= startOfMonth && i.income_date <= endOfMonth
    );

    const monthSpending = roundToTwoDecimals(
      thisMonthExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0)
    );
    const monthIncomeTotal = roundToTwoDecimals(
      thisMonthIncome.reduce((acc, curr) => acc + Number(curr.amount), 0)
    );

    // Monthly budgets
    const budgets = await BudgetModel.findAll({ userId, month: currentMonth, year: currentYear });
    const totalBudget = roundToTwoDecimals(
      budgets.reduce((acc, curr) => acc + Number(curr.amount), 0)
    );

    // Budget remaining
    const budgetRemaining = totalBudget > 0 ? roundToTwoDecimals(totalBudget - monthSpending) : 0;

    return {
      totalIncome,
      totalExpenses,
      remainingBalance,
      thisMonthSpending: monthSpending,
      thisMonthIncome: monthIncomeTotal,
      totalBudget,
      budgetRemaining,
      month: currentMonth,
      year: currentYear,
    };
  }

  /**
   * Calculate spending by category with percentages and colors
   */
  static async getCategorySpending(userId, month = null, year = null) {
    const { expenses } = await ExpenseModel.findAll({ userId, limit: 10000 });

    let filtered = expenses;
    if (month && year) {
      const mStr = String(month).padStart(2, '0');
      const start = `${year}-${mStr}-01`;
      const end = new Date(year, month, 0).toISOString().split('T')[0];
      filtered = expenses.filter((e) => e.expense_date >= start && e.expense_date <= end);
    }

    const totalSpent = filtered.reduce((acc, curr) => acc + Number(curr.amount), 0);

    const categoryMap = {};
    for (const exp of filtered) {
      const catName = exp.category?.name || 'Other';
      const catId = exp.category?.id || exp.category_id;
      const catIcon = exp.category?.icon || 'Tag';
      const catColor = exp.category?.color || '#6366f1';

      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          categoryId: catId,
          name: catName,
          icon: catIcon,
          color: catColor,
          amount: 0,
          count: 0,
        };
      }
      categoryMap[catId].amount += Number(exp.amount);
      categoryMap[catId].count += 1;
    }

    const result = Object.values(categoryMap).map((cat) => {
      const amount = roundToTwoDecimals(cat.amount);
      const percentage = calculatePercentage(amount, totalSpent);
      return {
        ...cat,
        amount,
        percentage,
      };
    });

    return result.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Monthly trend of Income vs Expenses (Last 6 months)
   */
  static async getMonthlyTrends(userId, monthsCount = 6) {
    const { expenses } = await ExpenseModel.findAll({ userId, limit: 10000 });
    const { incomes } = await IncomeModel.findAll({ userId, limit: 10000 });

    const now = new Date();
    const trends = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const monthName = targetDate.toLocaleString('default', { month: 'short' });
      const label = `${monthName} ${year}`;

      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = new Date(year, month, 0).toISOString().split('T')[0];

      const monthExp = expenses
        .filter((e) => e.expense_date >= start && e.expense_date <= end)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const monthInc = incomes
        .filter((inc) => inc.income_date >= start && inc.income_date <= end)
        .reduce((sum, inc) => sum + Number(inc.amount), 0);

      trends.push({
        label,
        month,
        year,
        expense: roundToTwoDecimals(monthExp),
        income: roundToTwoDecimals(monthInc),
        savings: roundToTwoDecimals(monthInc - monthExp),
      });
    }

    return trends;
  }
}
