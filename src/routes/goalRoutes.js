import { Router } from 'express';
import {
  getGoals,
  createGoal,
  updateGoal,
  addMoneyToGoal,
  deleteGoal,
} from '../controllers/goalController.js';
import { goalValidation } from '../validators/goalValidator.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getGoals);
router.post('/', goalValidation, validateRequest, createGoal);
router.put('/:id', goalValidation, validateRequest, updateGoal);
router.patch('/:id/add-money', addMoneyToGoal);
router.delete('/:id', deleteGoal);

export default router;
