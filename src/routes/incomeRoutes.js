import { Router } from 'express';
import {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} from '../controllers/incomeController.js';
import { incomeValidation } from '../validators/incomeValidator.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getIncomes);
router.post('/', incomeValidation, validateRequest, createIncome);
router.put('/:id', incomeValidation, validateRequest, updateIncome);
router.delete('/:id', deleteIncome);

export default router;
