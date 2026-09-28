import { body } from 'express-validator';

export const goalValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Goal title is required')
    .isLength({ max: 150 })
    .withMessage('Goal title cannot exceed 150 characters'),
  body('target_amount')
    .notEmpty()
    .withMessage('Target amount is required')
    .isFloat({ min: 1.0 })
    .withMessage('Target amount must be greater than 0'),
  body('saved_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Saved amount cannot be negative'),
  body('target_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Target date must be a valid date'),
  body('icon')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 30 }),
];
