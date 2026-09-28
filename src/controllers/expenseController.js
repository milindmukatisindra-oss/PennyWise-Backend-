import ExpenseModel from '../models/ExpenseModel.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getExpenses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      categoryId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sortBy = 'expense_date',
      sortOrder = 'desc',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { expenses, totalCount } = await ExpenseModel.findAll({
      userId,
      categoryId,
      startDate,
      endDate,
      search,
      limit: Number(limit),
      offset,
      sortBy,
      sortOrder,
    });

    return successResponse(
      res,
      {
        expenses,
        pagination: {
          totalCount,
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)) || 1,
          limit: Number(limit),
        },
      },
      'Expenses retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const expense = await ExpenseModel.findById(id, userId);
    if (!expense) {
      return errorResponse(res, 'Expense not found or unauthorized access.', 404);
    }

    return successResponse(res, { expense }, 'Expense retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category_id, amount, description, expense_date, payment_method } = req.body;

    const expense = await ExpenseModel.create({
      userId,
      categoryId: category_id,
      amount,
      description,
      expenseDate: expense_date,
      paymentMethod: payment_method,
    });

    return successResponse(res, { expense }, 'Expense recorded successfully!', 201);
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const existing = await ExpenseModel.findById(id, userId);
    if (!existing) {
      return errorResponse(res, 'Expense not found or unauthorized to edit.', 404);
    }

    const updatedExpense = await ExpenseModel.update(id, userId, updates);

    return successResponse(res, { expense: updatedExpense }, 'Expense updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await ExpenseModel.findById(id, userId);
    if (!existing) {
      return errorResponse(res, 'Expense not found or unauthorized to delete.', 404);
    }

    await ExpenseModel.delete(id, userId);

    return successResponse(res, null, 'Expense deleted successfully');
  } catch (error) {
    next(error);
  }
};
