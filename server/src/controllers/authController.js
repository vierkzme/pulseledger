import { registerUser, loginUser, getCurrentUser } from '../services/authService.js';

export async function handleRegister(req, res, next) {
  try {
    const data = await registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Operator account registered successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleLogin(req, res, next) {
  try {
    const data = await loginUser(req.body);
    res.json({
      success: true,
      message: 'Authentication successful',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetMe(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.id);
    res.json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}
