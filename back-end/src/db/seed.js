import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { eq, sql } from 'drizzle-orm';
import { db, pool } from './db.js';
import * as schema from './schema.js';
import logger from '../utils/logger.js';

const SEED_CONFIG = {
  userCount: 15,
  groupChatCount: 5,
  messagesPerChat: 20,
  defaultPassword: 'Password123!',
};

async function clearDatabase() {
  logger.info('Clearing existing data...');
  // Order matters due to foreign key constraints
  await db.delete(schema.refreshTokens);
  await db.delete(schema.messageReactions);
  await db.delete(schema.messageAttachments);
  await db.delete(schema.messages);
  await db.delete(schema.chatParticipants);
  await db.delete(schema.typingIndicators);
  await db.delete(schema.userSettings);
  await db.delete(schema.blockedUsers);
  await db.delete(schema.chats);
  await db.delete(schema.users);
  logger.info('Database cleared.');
}

async function seedUsers() {
  logger.info(`Seeding ${SEED_CONFIG.userCount} users...`);
  const passwordHash = await bcrypt.hash(SEED_CONFIG.defaultPassword, 10);
  
  const userData = Array.from({ length: SEED_CONFIG.userCount }).map((_, i) => ({
    username: faker.internet.username(),
    email: i === 0 ? 'admin@example.com' : faker.internet.email(),
    passwordHash,
    displayName: faker.person.fullName(),
    avatarUrl: faker.image.avatar(),
    status: faker.helpers.arrayElement(['online', 'offline', 'away', 'busy']),
    lastSeen: faker.date.recent(),
  }));

  const insertedUsers = await db.insert(schema.users).values(userData).returning();
  logger.info(`Inserted ${insertedUsers.length} users.`);
  return insertedUsers;
}

async function seedChats(users) {
  logger.info('Seeding chats and participants...');
  const insertedChats = [];

  // Seed Group Chats
  for (let i = 0; i < SEED_CONFIG.groupChatCount; i++) {
    const creator = faker.helpers.arrayElement(users);
    const [chat] = await db.insert(schema.chats).values({
      name: faker.commerce.department() + ' Chat',
      description: faker.lorem.sentence(),
      avatarUrl: faker.image.urlLoremFlickr({ category: 'business' }),
      type: 'group',
      createdBy: creator.id,
    }).returning();

    // Add random participants to group chat
    const participantsCount = faker.number.int({ min: 3, max: users.length });
    const participants = faker.helpers.shuffle(users).slice(0, participantsCount);
    
    await db.insert(schema.chatParticipants).values(
      participants.map(user => ({
        chatId: chat.id,
        userId: user.id,
        role: user.id === creator.id ? 'admin' : 'member',
      }))
    );
    
    insertedChats.push(chat);
  }

  // Seed Direct Chats (each user has 2-3 direct chats)
  for (const user of users) {
    const otherUsers = users.filter(u => u.id !== user.id);
    const chatPartners = faker.helpers.shuffle(otherUsers).slice(0, 2);

    for (const partner of chatPartners) {
      // Check if direct chat already exists between these two
      // (Simplification: just create anyway or handle unique constraint)
      try {
        const [chat] = await db.insert(schema.chats).values({
          type: 'direct',
          createdBy: user.id,
        }).returning();

        await db.insert(schema.chatParticipants).values([
          { chatId: chat.id, userId: user.id },
          { chatId: chat.id, userId: partner.id }
        ]);
        
        insertedChats.push(chat);
      } catch (err) {
        // Likely unique constraint if we added logic for that, but here just skip
      }
    }
  }

  logger.info(`Inserted ${insertedChats.length} chats.`);
  return insertedChats;
}

async function seedMessages(chats, users) {
  logger.info(`Seeding messages for ${chats.length} chats...`);
  
  for (const chat of chats) {
    // Get participants for this chat
    const participants = await db.select()
      .from(schema.chatParticipants)
      .where(eq(schema.chatParticipants.chatId, chat.id));
    
    const participantIds = participants.map(p => p.userId);
    
    const messageData = Array.from({ length: SEED_CONFIG.messagesPerChat }).map(() => ({
      chatId: chat.id,
      senderId: faker.helpers.arrayElement(participantIds),
      content: faker.lorem.sentence(),
      createdAt: faker.date.recent({ days: 7 }),
    }));

    // Sort messages by date for realism
    messageData.sort((a, b) => a.createdAt - b.createdAt);

    await db.insert(schema.messages).values(messageData);
  }
  
  logger.info('Messages seeded.');
}

async function main() {
  let success = true;
  try {
    await clearDatabase();
    
    const users = await seedUsers();
    const chats = await seedChats(users);
    await seedMessages(chats, users);

    logger.info('--- Seeding Completed Successfully ---');
    logger.info(`Admin User: admin@example.com / ${SEED_CONFIG.defaultPassword}`);
  } catch (error) {
    logger.error('Seeding failed:', error);
    success = false;
  } finally {
    await pool.end();
    process.exit(success ? 0 : 1);
  }
}

main();
