import { db } from "../db/db.js";
import { chatParticipants, messages, chats } from "../db/schema.js";
import { eq, desc, isNull, and, or, lt } from "drizzle-orm";
import logger from "../utils/logger.js";

// export const getMessagesByChatId = async (req, res, next) => {
//   try {
//     const { chatId } = req.params;
//     const chatMessages = await db
//       .select()
//       .from(messages)
//       .where(eq(messages.chatId, chatId))
//       .orderBy(desc(messages.createdAt))
//       .limit(50); // Get latest 50 messages

//     res.json({
//       success: true,
//       data: chatMessages,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getMessagesByChatId = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const { cursor } = req.query;

    const isParticipant = await db
      .select({ id: chatParticipants.id })
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId),
        ),
      )
      .limit(1);

    if (!isParticipant.length) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to access this chat",
      });
    }

    let query = db
      .select({
        id: messages.id,
        chatId: messages.chatId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        fileUrl: messages.fileUrl,
        createdAt: messages.createdAt,
        isEdited: messages.isEdited,
        replyToId: messages.replyToId,
        isMe: eq(messages.senderId, userId),
      })
      .from(messages)
      .where(
        and(
          eq(messages.chatId, chatId),
          or(eq(messages.isDeleted, false), isNull(messages.isDeleted)),
        ),
      )
      .orderBy(desc(messages.createdAt))
      .limit(10);

    if (cursor) {
      query = db
        .select({
          id: messages.id,
          chatId: messages.chatId,
          senderId: messages.senderId,
          content: messages.content,
          messageType: messages.messageType,
          fileUrl: messages.fileUrl,
          createdAt: messages.createdAt,
          isEdited: messages.isEdited,
          replyToId: messages.replyToId,
        })
        .from(messages)
        .where(
          and(
            eq(messages.chatId, chatId),
            lt(messages.createdAt, new Date(cursor)),
            or(eq(messages.isDeleted, false), isNull(messages.isDeleted)),
          ),
        )
        .orderBy(desc(messages.createdAt))
        .limit(10);
    }

    const rows = await query;

    const messagesOrdered = rows.reverse();

    return res.json({
      success: true,
      data: messagesOrdered,
      nextCursor: rows.length ? rows[rows.length - 1].createdAt : null,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { chatId, content, messageType, replyToId, createdAt } = req.body;

    const senderId = req.user.id;

    const [newMessage] = await db
      .insert(messages)
      .values({
        chatId,
        senderId,
        content,
        messageType,
        replyToId,
        createdAt: createdAt ? new Date(createdAt) : undefined,
      })
      .returning();

    // Fetch chat type to determine how to broadcast
    const [chatInfo] = await db
      .select({ type: chats.type })
      .from(chats)
      .where(eq(chats.id, chatId));

    if (chatInfo?.type === "direct") {
      // Find the other participant in this 1-on-1 chat
      const participants = await db
        .select({ userId: chatParticipants.userId })
        .from(chatParticipants)
        .where(eq(chatParticipants.chatId, chatId));

      const otherUser = participants.find((p) => p.userId !== senderId);

      console.log("Other user", participants);

      if (otherUser) {
        req.app.locals.broadcastNewMessage(otherUser.userId, newMessage);
      }
    } else {
      // Broadcast to the whole group room (chatInfo?.type === "group")
      req.app.locals.broadcastNewGroupMessage(chatId, newMessage);
    }

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Soft delete pattern
    const [deletedMessage] = await db
      .update(messages)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(messages.id, id))
      .returning({ id: messages.id, chatId: messages.chatId });

    if (!deletedMessage) {
      return res.status(404).json({
        success: false,
        error: { message: "Message not found" },
      });
    }

    // Broadcast message delete event
    req.app.locals.broadcastMessageUpdate(
      deletedMessage.chatId,
      req.app.locals.EVENTS.MESSAGING.DELETE,
      { id: deletedMessage.id, chatId: deletedMessage.chatId },
    );

    res.json({
      success: true,
      message: "Message deleted (soft delete)",
    });
  } catch (error) {
    next(error);
  }
};
