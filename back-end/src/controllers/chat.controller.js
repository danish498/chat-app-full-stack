import { db } from "../db/db.js";
import { chats, chatParticipants, users, messages } from "../db/schema.js";
import { eq, and, or, isNull, inArray, desc } from "drizzle-orm";

import { Buffer } from "buffer";

export const getChats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { cursor, limit = 10 } = req.query;

    // Decode cursor
    let decodedCursor = null;
    if (cursor) {
      decodedCursor = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8"),
      );
    }

    // Step 1: get user's chatIds
    const userChatRows = await db
      .select({ chatId: chatParticipants.chatId })
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.userId, userId),
          or(
            eq(chatParticipants.isArchived, false),
            isNull(chatParticipants.isArchived),
          ),
        ),
      );

    const chatIds = userChatRows.map((row) => row.chatId);

    if (chatIds.length === 0) {
      return res.json({ success: true, data: [], nextCursor: null });
    }

    // Step 2: main query with pagination
    const rows = await db
      .select({
        chatId: chats.id,
        name: chats.name,
        type: chats.type,
        avatarUrl: chats.avatarUrl,
        createdAt: chats.createdAt,

        participantUserId: chatParticipants.userId,
        role: chatParticipants.role,

        userName: users.username,
        displayName: users.displayName,
        userAvatar: users.avatarUrl,
      })
      .from(chats)
      .innerJoin(chatParticipants, eq(chatParticipants.chatId, chats.id))
      .innerJoin(users, eq(users.id, chatParticipants.userId))
      .where(
        and(
          inArray(chats.id, chatIds),
          decodedCursor
            ? lt(chats.createdAt, decodedCursor.createdAt)
            : undefined,
        ),
      )
      .orderBy(desc(chats.createdAt))
      .limit(Number(limit) + 1); // +1 for nextCursor

    // Step 3: group chats
    const chatMap = new Map();

    for (const row of rows) {
      if (!chatMap.has(row.chatId)) {
        chatMap.set(row.chatId, {
          id: row.chatId,
          name: row.name,
          type: row.type,
          avatarUrl: row.avatarUrl,
          createdAt: row.createdAt,
          participants: [],
          otherUser: null, // 🔥 important
        });
      }

      const chat = chatMap.get(row.chatId);

      chat.participants.push({
        userId: row.participantUserId,
        role: row.role,
      });

      // ✅ Detect other user in direct chat
      if (
        row.type === "direct" &&
        row.participantUserId !== userId
      ) {
        chat.otherUser = {
          id: row.participantUserId,
          username: row.userName,
          displayName: row.displayName,
          avatarUrl: row.userAvatar,
        };
      }
    }

    let chatsArray = Array.from(chatMap.values());

    // Step 4: handle pagination
    let nextCursor = null;

    if (chatsArray.length > Number(limit)) {
      const nextItem = chatsArray.pop();

      nextCursor = Buffer.from(
        JSON.stringify({
          createdAt: nextItem.createdAt,
        }),
      ).toString("base64");
    }

    return res.json({
      success: true,
      data: chatsArray,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const getChatById = async (req, res, next) => {
  try {
    const { id: chatId } = req.params;
    const userId = req.user.id;

    const [myParticipant] = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId),
        ),
      );

    if (!myParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this chat",
      });
    }

    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const participants = await db
      .select({
        userId: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,

        role: chatParticipants.role,
        joinedAt: chatParticipants.joinedAt,
      })
      .from(chatParticipants)
      .innerJoin(users, eq(users.id, chatParticipants.userId))
      .where(eq(chatParticipants.chatId, chatId));

    const [lastMessage] = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(
        and(
          eq(messages.chatId, chatId),
          or(eq(messages.isDeleted, false), isNull(messages.isDeleted)),
        ),
      )
      .orderBy(desc(messages.createdAt))
      .limit(1);

    let unreadCount = 0;

    if (myParticipant.lastReadAt) {
      const result = await db
        .select({
          count: sql < number > `count(*)`,
        })
        .from(messages)
        .where(
          and(
            eq(messages.chatId, chatId),
            gt(messages.createdAt, myParticipant.lastReadAt),
            or(eq(messages.isDeleted, false), isNull(messages.isDeleted)),
          ),
        );

      unreadCount = Number(result[0]?.count || 0);
    }

    const response = {
      id: chat.id,
      name: chat.name,
      description: chat.description,
      avatarUrl: chat.avatarUrl,
      type: chat.type,
      createdAt: chat.createdAt,

      participants,

      lastMessage: lastMessage || null,
      unreadCount,

      mySettings: {
        role: myParticipant.role,
        isMuted: myParticipant.isMuted,
        isArchived: myParticipant.isArchived,
        lastReadAt: myParticipant.lastReadAt,
      },
    };

    return res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

export const createChat = async (req, res, next) => {
  try {
    const {
      name,
      description,
      avatarUrl,
      type = "direct",
      participantIds = [],
    } = req.body;
    const currentUserId = req.user.id;

    // ✅ Ensure creator is included
    const uniqueParticipants = Array.from(
      new Set([...participantIds, currentUserId]),
    );

    // 🚀 1. Handle DIRECT CHAT (prevent duplicates)
    if (type === "direct" && uniqueParticipants.length === 2) {
      const existing = await db
        .select({ chatId: chatParticipants.chatId })
        .from(chatParticipants)
        .where(inArray(chatParticipants.userId, uniqueParticipants));

      // Group by chatId
      const map = new Map();
      for (const row of existing) {
        map.set(row.chatId, (map.get(row.chatId) || 0) + 1);
      }

      // If both users exist in same chat → return it
      for (const [chatId, count] of map.entries()) {
        if (count === 2) {
          return res.json({
            success: true,
            message: "Chat already exists",
            isExistingChat: true,
            data: { id: chatId , type: "EXISTING_CHAT",},
          });
        }
      }
    }

    // 🚀 2. Create new chat
    const result = await db.transaction(async (tx) => {
      const [newChat] = await tx
        .insert(chats)
        .values({
          name,
          description,
          avatarUrl,
          type,
          createdBy: currentUserId,
        })
        .returning();

      const participantsData = uniqueParticipants.map((userId) => ({
        chatId: newChat.id,
        userId,
        role: userId === currentUserId ? "admin" : "member",
      }));

      await tx.insert(chatParticipants).values(participantsData);

      return newChat;
    });

    // Notify all participants about the new chat
    uniqueParticipants.forEach((uid) => {
      req.app.locals.broadcastToUser(uid, {
        type: req.app.locals.EVENTS.ROOM.CREATE,
        data: result,
      });
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    const [updatedChat] = await db
      .update(chats)
      .set(updateData)
      .where(eq(chats.id, id))
      .returning();

    if (!updatedChat) {
      return res.status(404).json({
        success: false,
        error: { message: "Chat not found" },
      });
    }

    // Broadcast room update event
    req.app.locals.broadcastMessageUpdate(
      id,
      req.app.locals.EVENTS.ROOM.UPDATE,
      updatedChat,
    );

    res.json({
      success: true,
      data: updatedChat,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [deletedChat] = await db
      .delete(chats)
      .where(eq(chats.id, id))
      .returning({ id: chats.id });

    if (!deletedChat) {
      return res.status(404).json({
        success: false,
        error: { message: "Chat not found" },
      });
    }

    // Broadcast room delete event
    req.app.locals.broadcastMessageUpdate(
      id,
      req.app.locals.EVENTS.ROOM.DELETE,
      { id },
    );

    res.json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { id: chatId } = req.params;
    const { userId, role = "member" } = req.body;
    const currentUserId = req.user.id;

    // 1. Check if chat exists and is a group chat
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (chat.type !== "group") {
      return res.status(400).json({
        success: false,
        message: "Members can only be added to group chats",
      });
    }

    // 2. Check if current user is an admin in this chat
    const [currentUserParticipant] = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, currentUserId),
        ),
      );

    if (!currentUserParticipant || currentUserParticipant.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can add members",
      });
    }

    // 3. Check if user to be added exists
    const [userToAdd] = await db.select().from(users).where(eq(users.id, userId));
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "User to add not found",
      });
    }

    // 4. Check if user is already a member
    const [existingParticipant] = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId),
        ),
      );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this chat",
      });
    }

    // 5. Add user to chat
    const [newParticipant] = await db
      .insert(chatParticipants)
      .values({
        chatId,
        userId,
        role,
      })
      .returning();

    // 6. Broadcast notification
    req.app.locals.broadcastToUser(userId, {
      type: req.app.locals.EVENTS.ROOM.CREATE, // New chat for that user
      data: chat,
    });

    req.app.locals.broadcastMessageUpdate(
      chatId,
      req.app.locals.EVENTS.ROOM.MEMBER_ADD,
      {
        chatId,
        user: {
          id: userToAdd.id,
          username: userToAdd.username,
          displayName: userToAdd.displayName,
          avatarUrl: userToAdd.avatarUrl,
          role: newParticipant.role,
        },
      }
    );

    return res.status(201).json({
      success: true,
      data: newParticipant,
    });
  } catch (error) {
    next(error);
  }
};
