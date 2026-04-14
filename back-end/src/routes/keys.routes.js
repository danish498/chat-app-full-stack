import { Router } from 'express';
import { z } from 'zod';
import { storePublicKey, getPublicKey } from '../lib/crypto.js';
import { authenticateToken as requireAuth } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

// Called once after registration — client uploads their public key
router.post('/', requireAuth, async (req, res) => {
    const schema = z.object({ publicKey: z.string().length(64).regex(/^[0-9a-f]+$/) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid public key format' });

    await storePublicKey(req.user.id, parsed.data.publicKey);
    res.json({ ok: true });
});

// Called before sending a message — fetch recipient's public key
router.get('/:userId', requireAuth, async (req, res) => {
    console.log(`Keys route called for userId: ${req.params.userId}`);
    try {
        const publicKey = await getPublicKey(req.params.userId);

        console.log(`Public key fetched for user ${req.params.userId}: ${publicKey}`);
        res.json({ publicKey });
    } catch (error) {
        console.log(`Error fetching public key for user ${req.params.userId}:`, error.message);
        res.status(404).json({ error: 'Public key not found' });
    }
});

export default router;
