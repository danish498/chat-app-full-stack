import { Router } from 'express';
import { z } from 'zod';
import { storePublicKey, getPublicKey } from '../lib/crypto.js';
import { authenticateToken as requireAuth } from '../middleware/auth.js';

const router = Router();

// Called once after registration — client uploads their public key
router.post('/keys', requireAuth, async (req, res) => {
    const schema = z.object({ publicKey: z.string().length(64).regex(/^[0-9a-f]+$/) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid public key format' });

    await storePublicKey(req.user.id, parsed.data.publicKey);
    res.json({ ok: true });
});

// Called before sending a message — fetch recipient's public key
router.get('/keys/:userId', requireAuth, async (req, res) => {
    try {
        const publicKey = await getPublicKey(req.params.userId);
        res.json({ publicKey });
    } catch {
        res.status(404).json({ error: 'Public key not found' });
    }
});

export default router;
