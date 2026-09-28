import ExpenseModel from '../models/ExpenseModel.js';
import IncomeModel from '../models/IncomeModel.js';
import BudgetModel from '../models/BudgetModel.js';
import GoalModel from '../models/GoalModel.js';
import { roundToTwoDecimals, calculatePercentage } from '../utils/money.js';

export class SuggestionService {
  /**
   * Generates actionable, teen-friendly financial observations and tips.
   * Framed as educational insights, not rigid or punitive advice.
   */
  static async generateSuggestions(userId) {
    const suggestions = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    // Previous month range for trends
    const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth() + 1;
    const startOfPrevMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const endOfPrevMonth = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

    const { expenses: allExpenses } = await ExpenseModel.findAll({ userId, limit: 10000 });
    const { incomes: allIncomes } = await IncomeModel.findAll({ userId, limit: 10000 });
    const budgets = await BudgetModel.findAll({ userId, month: currentMonth, year: currentYear });
    const goals = await GoalModel.findAll(userId);

    const thisMonthExpenses = allExpenses.filter(
      (e) => e.expense_date >= startOfMonth && e.expense_date <= endOfMonth
    );
    const lastMonthExpenses = allExpenses.filter(
      (e) => e.expense_date >= startOfPrevMonth && e.expense_date <= endOfPrevMonth
    );
    const thisMonthIncomes = allIncomes.filter(
      (i) => i.income_date >= startOfMonth && i.income_date <= endOfMonth
    );

    const currentSpent = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const lastMonthSpent = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const currentIncome = thisMonthIncomes.reduce((sum, i) => sum + Number(i.amount), 0);

    // Rule 1: High Category Concentration (> 35% of total monthly spend)
    if (currentSpent > 0) {
      const catTotals = {};
      for (const exp of thisMonthExpenses) {
        const catName = exp.category?.name || 'Other';
        catTotals[catName] = (catTotals[catName] || 0) + Number(exp.amount);
      }

      for (const [catName, amount] of Object.entries(catTotals)) {
        const pct = calculatePercentage(amount, currentSpent);
        if (pct >= 35 && amount >= 300) {
          suggestions.push({
            id: `high-cat-${catName.toLowerCase()}`,
            type: 'insight',
            badge: 'Category Insight',
            icon: 'PieChart',
            title: `High Spending in ${catName}`,
            description: `You spent ₹${roundToTwoDecimals(amount)} (${pct}%) on ${catName} this month.`,
            tip: `If ${catName} isn't your main priority, setting a weekly cap could help free up cash for your savings goals!`,
          });
        }
      }
    }

    // Rule 2: Frequent Small Purchases (Snacks, impulse buys under ₹150)
    const smallPurchases = thisMonthExpenses.filter((e) => Number(e.amount) <= 150);
    if (smallPurchases.length >= 6) {
      const totalSmall = smallPurchases.reduce((sum, e) => sum + Number(e.amount), 0);
      suggestions.push({
        id: 'small-purchases-trend',
        type: 'warning',
        badge: 'Habit Check',
        icon: 'Coffee',
        title: 'Small Purchases Add Up',
        description: `You made ${smallPurchases.length} small purchases (under ₹150) this month, totaling ₹${roundToTwoDecimals(totalSmall)}.`,
        tip: 'Micro-expenses like daily snacks or impulse buys are sneaky! Checking whether each was truly needed can boost your pocket money.',
      });
    }

    // Rule 3: Budget Warnings (70-90% warning, >90% close, >100% exceeded)
    for (const budget of budgets) {
      const spentInCat = thisMonthExpenses
        .filter((e) => e.category_id === budget.category_id)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const usagePct = calculatePercentage(spentInCat, budget.amount);
      const catName = budget.category?.name || 'Category';

      if (usagePct >= 100) {
        suggestions.push({
          id: `budget-exceeded-${budget.id}`,
          type: 'danger',
          badge: 'Budget Exceeded',
          icon: 'AlertCircle',
          title: `${catName} Budget Limit Reached`,
          description: `You've spent ₹${roundToTwoDecimals(spentInCat)} out of your ₹${roundToTwoDecimals(budget.amount)} limit (${usagePct}%).`,
          tip: `Try hitting the pause button on ${catName} purchases until next month to keep your total balance healthy.`,
        });
      } else if (usagePct >= 80) {
        const remaining = roundToTwoDecimals(budget.amount - spentInCat);
        suggestions.push({
          id: `budget-warning-${budget.id}`,
          type: 'warning',
          badge: 'Budget Alert',
          icon: 'AlertTriangle',
          title: `Close to ${catName} Budget Limit`,
          description: `You've used ${usagePct}% of your ${catName} budget. Only ₹${remaining} remains.`,
          tip: `Consider spacing out any planned ${catName} spending across the remaining days of this month.`,
        });
      }
    }

    // Rule 4: Month-over-Month Comparison
    if (lastMonthSpent > 0 && currentSpent > 0) {
      const diff = currentSpent - lastMonthSpent;
      const changePct = calculatePercentage(Math.abs(diff), lastMonthSpent);

      if (diff < 0 && changePct >= 10) {
        suggestions.push({
          id: 'spending-reduction-win',
          type: 'success',
          badge: 'Great Progress',
          icon: 'TrendingDown',
          title: 'Spending is Down Compared to Last Month',
          description: `Your spending this month is ${changePct}% lower than the same period last month!`,
          tip: 'Awesome discipline! Consider transferring a bit of those savings directly into one of your saving goals.',
        });
      } else if (diff > 0 && changePct >= 25 && diff >= 500) {
        suggestions.push({
          id: 'spending-increase-notice',
          type: 'insight',
          badge: 'Trend Notice',
          icon: 'TrendingUp',
          title: 'Spending Increased This Month',
          description: `You spent ${changePct}% (₹${roundToTwoDecimals(diff)}) more this month than last month.`,
          tip: 'Review your recent transactions to see if this was due to a one-time big purchase or higher everyday expenses.',
        });
      }
    }

    // Rule 5: Income vs Expense Alert
    if (currentIncome > 0 && currentSpent > 0) {
      const burnRate = calculatePercentage(currentSpent, currentIncome);
      if (burnRate > 90) {
        suggestions.push({
          id: 'high-burn-rate',
          type: 'warning',
          badge: 'Cash Flow',
          icon: 'Zap',
          title: 'Spending Most of Your Income',
          description: `You've spent ${burnRate}% of the money you received this month.`,
          tip: 'Aiming to save even 10% to 20% of any pocket money or gift you receive builds a fantastic rainy-day cushion.',
        });
      }
    }

    // Rule 6: Saving Goals Milestones
    for (const goal of goals) {
      if (!goal.is_completed) {
        const goalPct = calculatePercentage(goal.saved_amount, goal.target_amount);
        if (goalPct >= 75) {
          suggestions.push({
            id: `goal-almost-there-${goal.id}`,
            type: 'success',
            badge: 'Goal Alert',
            icon: 'Sparkles',
            title: `Almost Reached "${goal.title}"!`,
            description: `You are at ${goalPct}% (₹${goal.saved_amount} of ₹${goal.target_amount}). Only ₹${roundToTwoDecimals(goal.target_amount - goal.saved_amount)} to go!`,
            tip: 'You are in the home stretch! Stay focused and celebrate when you hit your target.',
          });
        }
      }
    }

    // Fallback welcome tip if teenager has newly registered
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'welcome-tip',
        type: 'info',
        badge: 'Starter Tip',
        icon: 'Lightbulb',
        title: 'Welcome to Smart Money Tracking',
        description: 'Track your first few expenses and income entries to start seeing personalized money insights.',
        tip: 'The 50/30/20 rule is a great baseline: 50% on essentials, 30% on fun, and 20% into savings!',
      });
    }

    return suggestions;
  }
}
