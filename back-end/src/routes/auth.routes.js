import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6),
    displayName: z.string().max(100).optional(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  })
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  })
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', validate(refreshTokenSchema), authController.logout);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refresh);
router.get('/profile', authenticateToken, authController.getProfile);

export default router;
