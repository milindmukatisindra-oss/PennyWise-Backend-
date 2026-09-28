import { body } from 'express-validator';

export const expenseValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Expense amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
  body('category_id')
    .notEmpty()
    .withMessage('Please select a category'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters'),
  body('expense_date')
    .notEmpty()
    .withMessage('Expense date is required')
    .isISO8601()
    .withMessage('Valid date format is required (YYYY-MM-DD)'),
  body('payment_method')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['Cash', 'UPI', 'Card', 'Bank', 'Other'])
    .withMessage('Payment method must be one of: Cash, UPI, Card, Bank, Other'),
];
