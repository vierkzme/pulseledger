import { Router } from 'express';
import { handleRegister, handleLogin, handleGetMe } from '../controllers/authController.js';
import { validateBody, registerSchema, loginSchema } from '../validators/authValidator.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', validateBody(registerSchema), handleRegister);
router.post('/login', validateBody(loginSchema), handleLogin);
router.get('/me', requireAuth, handleGetMe);

export default router;
