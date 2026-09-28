import { body } from 'express-validator';

export const budgetValidation = [
  body('category_id')
    .notEmpty()
    .withMessage('Category is required for budget'),
  body('amount')
    .notEmpty()
    .withMessage('Budget amount is required')
    .isFloat({ min: 1.0 })
    .withMessage('Budget amount must be at least ₹1'),
  body('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 (January) and 12 (December)'),
  body('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Please specify a valid year'),
];
