import { Router } from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Anyone logged in can see categories
router.use(requireAuth);

router.get('/', getCategories);
router.post('/', createCategory);

export default router;
