import IncomeModel from '../models/IncomeModel.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getIncomes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { incomes, totalCount } = await IncomeModel.findAll({
      userId,
      startDate,
      endDate,
      limit: Number(limit),
      offset,
    });

    return successResponse(
      res,
      {
        incomes,
        pagination: {
          totalCount,
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)) || 1,
          limit: Number(limit),
        },
      },
      'Incomes retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const createIncome = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, source, description, income_date } = req.body;

    const income = await IncomeModel.create({
      userId,
      amount,
      source,
      description,
      incomeDate: income_date,
    });

    return successResponse(res, { income }, 'Income recorded successfully!', 201);
  } catch (error) {
    next(error);
  }
};

export const updateIncome = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const existing = await IncomeModel.findById(id, userId);
    if (!existing) {
      return errorResponse(res, 'Income entry not found or unauthorized.', 404);
    }

    const updatedIncome = await IncomeModel.update(id, userId, updates);

    return successResponse(res, { income: updatedIncome }, 'Income updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteIncome = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await IncomeModel.findById(id, userId);
    if (!existing) {
      return errorResponse(res, 'Income entry not found or unauthorized.', 404);
    }

    await IncomeModel.delete(id, userId);

    return successResponse(res, null, 'Income entry deleted successfully');
  } catch (error) {
    next(error);
  }
};
