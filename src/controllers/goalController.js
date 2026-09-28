import GoalModel from '../models/GoalModel.js';
import { calculatePercentage, roundToTwoDecimals } from '../utils/money.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getGoals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goals = await GoalModel.findAll(userId);

    const enrichedGoals = goals.map((g) => {
      const progress = calculatePercentage(g.saved_amount, g.target_amount);
      const remaining = roundToTwoDecimals(Math.max(0, g.target_amount - g.saved_amount));
      return {
        ...g,
        progress: Math.min(100, progress),
        remaining,
      };
    });

    return successResponse(res, enrichedGoals, 'Saving goals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, target_amount, saved_amount, target_date, icon } = req.body;

    const goal = await GoalModel.create({
      userId,
      title,
      targetAmount: target_amount,
      savedAmount: saved_amount,
      targetDate: target_date,
      icon,
    });

    return successResponse(res, { goal }, 'Saving goal created!', 201);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const existing = await GoalModel.findById(id, userId);
    if (!existing) {
      return errorResponse(res, 'Saving goal not found or unauthorized.', 404);
    }

    const updated = await GoalModel.update(id, userId, updates);
    return successResponse(res, { goal: updated }, 'Saving goal updated!');
  } catch (error) {
    next(error);
  }
};

export const addMoneyToGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount } = req.body;

    const increment = Number(amount);
    if (!increment || increment <= 0) {
      return errorResponse(res, 'Please provide a valid deposit amount greater than 0', 422);
    }

    const existing = await GoalModel.findById(id, userId);
    if (!existing) {
      return errorResponse(res, 'Saving goal not found.', 404);
    }

    const newSaved = Number(existing.saved_amount) + increment;
    const updated = await GoalModel.update(id, userId, { saved_amount: newSaved });

    return successResponse(res, { goal: updated }, `Added ₹${increment} towards ${existing.title}! Keep going! 🎉`);
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await GoalModel.findById(id, userId);
    if (!existing) {
      return errorResponse(res, 'Saving goal not found.', 404);
    }

    await GoalModel.delete(id, userId);
    return successResponse(res, null, 'Saving goal deleted');
  } catch (error) {
    next(error);
  }
};
