import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/* ================= USERS ================= */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  status: varchar('status', { length: 20 }).default('offline'),
  lastSeen: timestamp('last_seen', { withTimezone: true }),
  publicKey: varchar('public_key', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

/* ================= CHATS ================= */
export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }),
  description: text('description'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  type: varchar('type', { length: 20 }).default('direct').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

/* ================= CHAT PARTICIPANTS ================= */
export const chatParticipants = pgTable(
  'chat_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    isMuted: boolean('is_muted').default(false),
    isArchived: boolean('is_archived').default(false),
  },
  (table) => ({
    uniqueChatUser: unique().on(table.chatId, table.userId),
  })
);

/* ================= MESSAGES ================= */
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id')
    .notNull()
    .references(() => chats.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 20 }).default('text'),
  fileUrl: varchar('file_url', { length: 500 }),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  // sequence: integer('sequence').default(0),
  replyToId: uuid('reply_to_id').references(() => messages.id),
  nonce: varchar('nonce', { length: 32 }),
  isEncrypted: boolean('is_encrypted').default(false),
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

});

/* ================= MESSAGE REACTIONS ================= */
export const messageReactions = pgTable(
  'message_reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    emoji: varchar('emoji', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueReaction: unique().on(
      table.messageId,
      table.userId,
      table.emoji
    ),
  })
);

/* ================= MESSAGE ATTACHMENTS ================= */
export const messageAttachments = pgTable('message_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/* ================= TYPING INDICATORS ================= */
export const typingIndicators = pgTable(
  'typing_indicators',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isTyping: boolean('is_typing').default(true),
    lastSeen: timestamp('last_seen', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueChatUser: unique().on(table.chatId, table.userId),
  })
);

/* ================= USER SETTINGS ================= */
export const userSettings = pgTable(
  'user_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    settingKey: varchar('setting_key', { length: 100 }).notNull(),
    settingValue: text('setting_value'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueUserSetting: unique().on(table.userId, table.settingKey),
  })
);

/* ================= BLOCKED USERS ================= */
export const blockedUsers = pgTable(
  'blocked_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockerId: uuid('blocker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: uuid('blocked_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedAt: timestamp('blocked_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueBlock: unique().on(table.blockerId, table.blockedId),
  })
);

/* ================= REFRESH TOKENS ================= */
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isRevoked: boolean('is_revoked').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/* ================= RELATIONS ================= */
export const usersRelations = relations(users, ({ many }) => ({
  chatsCreated: many(chats),
  chatParticipants: many(chatParticipants),
  messagesSent: many(messages),
  messageReactions: many(messageReactions),
  typingIndicators: many(typingIndicators),
  userSettings: many(userSettings),
  blockedUsers: many(blockedUsers),
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  creator: one(users, {
    fields: [chats.createdBy],
    references: [users.id],
  }),
  participants: many(chatParticipants),
  messages: many(messages),
  typingIndicators: many(typingIndicators),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  chat: one(chats, {
    fields: [chatParticipants.chatId],
    references: [chats.id],
  }),
  user: one(users, {
    fields: [chatParticipants.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
  }),
  replies: many(messages),
  reactions: many(messageReactions),
  attachments: many(messageAttachments),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
}));

export const messageAttachmentsRelations = relations(messageAttachments, ({ one }) => ({
  message: one(messages, {
    fields: [messageAttachments.messageId],
    references: [messages.id],
  }),
}));

export const typingIndicatorsRelations = relations(typingIndicators, ({ one }) => ({
  chat: one(chats, {
    fields: [typingIndicators.chatId],
    references: [chats.id],
  }),
  user: one(users, {
    fields: [typingIndicators.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const blockedUsersRelations = relations(blockedUsers, ({ one }) => ({
  blocker: one(users, {
    fields: [blockedUsers.blockerId],
    references: [users.id],
  }),
  blocked: one(users, {
    fields: [blockedUsers.blockedId],
    references: [users.id],
  }),
}));