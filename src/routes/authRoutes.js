import { Router } from 'express';
import { register, login, logout, getMe, seedDemoData } from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../validators/authValidator.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/logout', logout);

// Protected routes
router.get('/me', requireAuth, getMe);
router.post('/seed-demo', requireAuth, seedDemoData);

export default router;
