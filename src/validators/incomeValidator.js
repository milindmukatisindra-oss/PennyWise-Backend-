import { body } from 'express-validator';

export const incomeValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Income amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
  body('source')
    .notEmpty()
    .withMessage('Source of income is required')
    .isIn(['Pocket Money', 'Gift', 'Part-time work', 'Scholarship', 'Allowance', 'Other'])
    .withMessage('Source must be one of: Pocket Money, Gift, Part-time work, Scholarship, Allowance, Other'),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters'),
  body('income_date')
    .notEmpty()
    .withMessage('Income date is required')
    .isISO8601()
    .withMessage('Valid date format is required (YYYY-MM-DD)'),
];
