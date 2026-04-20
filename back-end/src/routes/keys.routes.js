import { Router } from 'express';
import { z } from 'zod';
import { storePublicKey, getPublicKey } from '../lib/crypto.js';
import { authenticateToken as requireAuth } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { getUserDevices, storeDevice } from '../controllers/key.controller.js';
import { db } from '../db/db.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();




// Called once after registration — client uploads their public key
// router.post('/', requireAuth, async (req, res) => {
//     const schema = z.object({ publicKey: z.string().length(64).regex(/^[0-9a-f]+$/) });
//     const parsed = schema.safeParse(req.body);
//     if (!parsed.success) return res.status(400).json({ error: 'Invalid public key format' });

//     await storePublicKey(req.user.id, parsed.data.publicKey);
//     res.json({ ok: true });
// });



router.post('/devices', requireAuth, async (req, res) => {
    const schema = z.object({
      deviceId: z.string(),
      deviceName: z.string().optional(),
      publicKey: z.string(), // don't restrict to 64
    });
  
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }
  
    await storeDevice({
      userId: req.user.id,
      deviceId: parsed.data.deviceId,
      deviceName: parsed.data.deviceName,
      publicKey: parsed.data.publicKey,
    });
  
    res.json({ ok: true });
  });

// Called before sending a message — fetch recipient's public key
// router.get('/:userId', requireAuth, async (req, res) => {
//     try {
//         const publicKey = await getPublicKey(req.params.userId);

//         res.json({ publicKey });
//     } catch (error) {
//         res.status(404).json({ error: 'Public key not found' });
//     }
// });


router.get('/:userId/devices', requireAuth, async (req, res) => {
    try {
      const devices = await getUserDevices(req.params.userId);
  
      res.json({
        devices: devices.map(d => ({
          deviceId: d.deviceId,
          publicKey: d.publicKey,
        })),
      });
    } catch (error) {
      res.status(404).json({ error: 'Devices not found' });
    }
  });

router.get("/backup", requireAuth, async (req, res) => {
  const [user] = await db
    .select({
      encryptedPrivateKey: users.encryptedPrivateKey,
      keySalt: users.keySalt,
    })
    .from(users)
    .where(eq(users.id, req.user.id));

  if (!user?.encryptedPrivateKey) {
    return res.status(404).json({ error: "No backup found" });
  }

  res.json(user);
});

router.post("/backup", requireAuth, async (req, res) => {
  const schema = z.object({
    encryptedPrivateKey: z.string(),
    keySalt: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  await db
    .update(users)
    .set({
      encryptedPrivateKey: parsed.data.encryptedPrivateKey,
      keySalt: parsed.data.keySalt,
    })
    .where(eq(users.id, req.user.id));

  res.json({ ok: true });
});

export default router;
