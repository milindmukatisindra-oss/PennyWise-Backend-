import { AnalyticsService } from '../services/analyticsService.js';
import { SuggestionService } from '../services/suggestionService.js';
import ExpenseModel from '../models/ExpenseModel.js';
import IncomeModel from '../models/IncomeModel.js';
import { successResponse } from '../utils/response.js';

export const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const summary = await AnalyticsService.getSummary(userId);
    return successResponse(res, summary, 'Dashboard summary retrieved');
  } catch (error) {
    next(error);
  }
};

export const getCategorySpending = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    const breakdown = await AnalyticsService.getCategorySpending(userId, month, year);
    return successResponse(res, breakdown, 'Category spending breakdown retrieved');
  } catch (error) {
    next(error);
  }
};

export const getMonthlySpending = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { months = 6 } = req.query;
    const trends = await AnalyticsService.getMonthlyTrends(userId, Number(months));
    return successResponse(res, trends, 'Monthly spending trend retrieved');
  } catch (error) {
    next(error);
  }
};

export const getSuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const suggestions = await SuggestionService.generateSuggestions(userId);
    return successResponse(res, suggestions, 'Personalized spending suggestions retrieved');
  } catch (error) {
    next(error);
  }
};

export const getRecentTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 8 } = req.query;

    const { expenses } = await ExpenseModel.findAll({ userId, limit: Number(limit) });
    const { incomes } = await IncomeModel.findAll({ userId, limit: Number(limit) });

    // Normalize and merge both streams
    const normalizedExpenses = expenses.map((e) => ({
      id: e.id,
      type: 'expense',
      title: e.description,
      amount: e.amount,
      date: e.expense_date,
      category: e.category?.name || 'Expense',
      icon: e.category?.icon || 'TrendingDown',
      color: e.category?.color || '#ef4444',
      paymentMethod: e.payment_method,
      createdAt: e.created_at,
    }));

    const normalizedIncomes = incomes.map((i) => ({
      id: i.id,
      type: 'income',
      title: i.description || i.source,
      amount: i.amount,
      date: i.income_date,
      category: i.source,
      icon: 'ArrowDownLeft',
      color: '#10b981',
      paymentMethod: 'Deposit',
      createdAt: i.created_at,
    }));

    const combined = [...normalizedExpenses, ...normalizedIncomes]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, Number(limit));

    return successResponse(res, combined, 'Recent transactions retrieved');
  } catch (error) {
    next(error);
  }
};
