import { db } from "../db/db.js";
import { chatParticipants, messages } from "../db/schema.js";
import { eq, desc, isNull, and, or, lt } from "drizzle-orm";

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
      .limit(50);

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
        .limit(50);
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
    const { chatId, content, messageType, replyToId } = req.body;

    const senderId = req.user.id;

    const [newMessage] = await db
      .insert(messages)
      .values({
        chatId,
        senderId,
        content,
        messageType,
        replyToId,
      })
      .returning();

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
      .returning({ id: messages.id });

    if (!deletedMessage) {
      return res.status(404).json({
        success: false,
        error: { message: "Message not found" },
      });
    }

    res.json({
      success: true,
      message: "Message deleted (soft delete)",
    });
  } catch (error) {
    next(error);
  }
};
