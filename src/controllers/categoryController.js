import CategoryModel from '../models/CategoryModel.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getCategories = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const categories = await CategoryModel.findAll(userId);
    return successResponse(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, icon, color } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 'Category name is required', 422);
    }

    const category = await CategoryModel.create({
      name,
      icon,
      color,
      userId,
    });

    return successResponse(res, { category }, 'Category created successfully', 201);
  } catch (error) {
    next(error);
  }
};
