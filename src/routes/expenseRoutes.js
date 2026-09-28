import { Router } from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { expenseValidation } from '../validators/expenseValidator.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All expense routes require authentication
router.use(requireAuth);

router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.post('/', expenseValidation, validateRequest, createExpense);
router.put('/:id', expenseValidation, validateRequest, updateExpense);
router.delete('/:id', deleteExpense);

export default router;
