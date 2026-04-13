import { db } from '../db/db.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const storePublicKey = async (userId, publicKeyHex) => {
    // Basic sanity check — 32 bytes = 64 hex chars
    if (!/^[0-9a-f]{64}$/.test(publicKeyHex)) {
        throw new Error('INVALID_PUBLIC_KEY');
    }

    await db.update(users)
        .set({ publicKey: publicKeyHex })
        .where(eq(users.id, userId));
};

export const getPublicKey = async (userId) => {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { publicKey: true },
    });

    if (!user?.publicKey) throw new Error('PUBLIC_KEY_NOT_FOUND');
    return user.publicKey;
};
