import { Router } from 'express';
import {
  getSummary,
  getCategorySpending,
  getMonthlySpending,
  getSuggestions,
  getRecentTransactions,
} from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', getSummary);
router.get('/category-spending', getCategorySpending);
router.get('/monthly-spending', getMonthlySpending);
router.get('/suggestions', getSuggestions);
router.get('/recent-transactions', getRecentTransactions);

export default router;
