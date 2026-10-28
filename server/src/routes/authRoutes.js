import { Router } from 'express';
import { handleRegister, handleLogin, handleGetMe } from '../controllers/authController.js';
import { validateBody, registerSchema, loginSchema } from '../validators/authValidator.js';

const router = Router();

router.post('/register', validateBody(registerSchema), handleRegister);
router.post('/login', validateBody(loginSchema), handleLogin);

export default router;
