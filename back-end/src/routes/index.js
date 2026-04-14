import express from 'express';
import userRoutes from './user.routes.js';
import chatRoutes from './chat.routes.js';
import messageRoutes from './message.routes.js';
import authRoutes from './auth.routes.js';
import keysRoutes from './keys.routes.js';
import mediaRoutes from './media.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/keys', keysRoutes);
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/media', mediaRoutes);

export default router;
