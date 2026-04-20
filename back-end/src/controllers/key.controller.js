import { db } from '../db/db.js';
import { userDevices } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export async function storeDevice({
  userId,
  deviceId,
  deviceName,
  publicKey,
}) {
  // check if device already exists
  const existing = await db.query.userDevices.findFirst({
    where: and(
      eq(userDevices.userId, userId),
      eq(userDevices.deviceId, deviceId)
    ),
  });

  if (existing) {
    // update existing device
    await db
      .update(userDevices)
      .set({
        publicKey,
        deviceName,
        updatedAt: new Date(),
      })
      .where(eq(userDevices.id, existing.id));
  } else {
    // insert new device
    await db.insert(userDevices).values({
      userId,
      deviceId,
      deviceName,
      publicKey,
    });
  }
}



export async function getUserDevices(userId) {
    return db.query.userDevices.findMany({
      where: eq(userDevices.userId, userId),
    });
  }