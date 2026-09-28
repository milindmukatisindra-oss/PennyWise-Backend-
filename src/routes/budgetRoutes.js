import { Router } from 'express';
import { getBudgets, setBudget, deleteBudget } from '../controllers/budgetController.js';
import { budgetValidation } from '../validators/budgetValidator.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getBudgets);
router.post('/', budgetValidation, validateRequest, setBudget);
router.delete('/:id', deleteBudget);

export default router;
