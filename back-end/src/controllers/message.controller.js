import { db } from "../db/db.js";
import { chatParticipants, messages, chats, messageRecipients } from "../db/schema.js";
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

// export const getMessagesByChatId = async (req, res, next) => {
//   try {
//     const { chatId } = req.params;
//     const userId = req.user.id;

//     const { cursor } = req.query;

//     const isParticipant = await db
//       .select({ id: chatParticipants.id })
//       .from(chatParticipants)
//       .where(
//         and(
//           eq(chatParticipants.chatId, chatId),
//           eq(chatParticipants.userId, userId),
//         ),
//       )
//       .limit(1);

//     if (!isParticipant.length) {
//       return res.status(403).json({
//         success: false,
//         message: "Not allowed to access this chat",
//       });
//     }

//     let query = db
//       .select({
//         id: messages.id,
//         chatId: messages.chatId,
//         senderId: messages.senderId,
//         content: messages.content,
//         messageType: messages.messageType,
//         fileUrl: messages.fileUrl,
//         createdAt: messages.createdAt,
//         isEdited: messages.isEdited,
//         replyToId: messages.replyToId,
//         isEncrypted: messages.isEncrypted,
//         nonce: messages.nonce,
//         isMe: eq(messages.senderId, userId),
//       })
//       .from(messages)
//       .where(
//         and(
//           eq(messages.chatId, chatId),
//           or(eq(messages.isDeleted, false), isNull(messages.isDeleted)),
//         ),
//       )
//       .orderBy(desc(messages.createdAt))
//       .limit(10);

//     if (cursor) {
//       query = db
//         .select({
//           id: messages.id,
//           chatId: messages.chatId,
//           senderId: messages.senderId,
//           content: messages.content,
//           messageType: messages.messageType,
//           fileUrl: messages.fileUrl,
//           createdAt: messages.createdAt,
//           isEdited: messages.isEdited,
//           replyToId: messages.replyToId,
//           isEncrypted: messages.isEncrypted,
//           nonce: messages.nonce,
//           isMe: eq(messages.senderId, userId),
//         })
//         .from(messages)
//         .where(
//           and(
//             eq(messages.chatId, chatId),
//             lt(messages.createdAt, new Date(cursor)),
//             or(eq(messages.isDeleted, false), isNull(messages.isDeleted)),
//           ),
//         )
//         .orderBy(desc(messages.createdAt))
//         .limit(10);
//     }

//     const rows = await query;

//     const messagesOrdered = rows.reverse();

//     return res.json({
//       success: true,
//       data: messagesOrdered,
//       nextCursor: rows.length ? rows[rows.length - 1].createdAt : null,
//     });
//   } catch (error) {
//     next(error);
//   }
// };






export const getMessagesByChatId = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const deviceId = req.headers["x-device-id"]; // 🔥 REQUIRED
    const { cursor, limit = 10 } = req.query;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Device ID required",
      });
    }

    // ✅ Access check
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
        message: "Not allowed",
      });
    }

    let decodedCursor = null;
    if (cursor) {
      decodedCursor = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8"),
      );
    }

    const rows = await db
      .select({
        id: messages.id,
        chatId: messages.chatId,
        senderId: messages.senderId,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        isEdited: messages.isEdited,
        replyToId: messages.replyToId,

        // 🔐 encrypted payload
        ciphertext: messageRecipients.ciphertext,
        nonce: messageRecipients.nonce,

        isMe: eq(messages.senderId, userId),
      })
      .from(messages)
      .innerJoin(
        messageRecipients,
        and(
          eq(messageRecipients.messageId, messages.id),
          eq(messageRecipients.deviceId, deviceId),
        ),
      )
      .where(
        and(
          eq(messages.chatId, chatId),
          or(eq(messages.isDeleted, false), isNull(messages.isDeleted)),

          decodedCursor
            ? or(
                lt(messages.createdAt, new Date(decodedCursor.createdAt)),
                and(
                  eq(messages.createdAt, new Date(decodedCursor.createdAt)),
                  lt(messages.id, decodedCursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(Number(limit) + 1);

    let nextCursor = null;

    if (rows.length > Number(limit)) {
      const nextItem = rows.pop();

      nextCursor = Buffer.from(
        JSON.stringify({
          createdAt: nextItem.createdAt,
          id: nextItem.id,
        }),
      ).toString("base64");
    }

    return res.json({
      success: true,
      data: rows.reverse(),
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};



export const sendMessage = async (req, res, next) => {
  try {
    const {
      chatId,
      messageType,
      replyToId,
      encryptedPayloads, // 🔥 [{ deviceId, ciphertext, nonce }]
      createdAt,
    } = req.body;

    const senderId = req.user.id;

    if (!encryptedPayloads || !encryptedPayloads.length) {
      return res.status(400).json({
        success: false,
        message: "Encrypted payloads required",
      });
    }

    // ✅ Step 1: insert message metadata
    const [msg] = await db
      .insert(messages)
      .values({
        chatId,
        senderId,
        messageType,
        replyToId,
        createdAt: createdAt ? new Date(createdAt) : undefined,
      })
      .returning();

    // ✅ Step 2: store encrypted copies
    await db.insert(messageRecipients).values(
      encryptedPayloads.map((p) => ({
        messageId: msg.id,
        deviceId: p.deviceId,
        ciphertext: p.ciphertext,
        nonce: p.nonce,
      })),
    );

    // 🚀 Broadcast (no plaintext anymore)
    req.app.locals.broadcastNewMessage(chatId, {
      id: msg.id,
      chatId,
      senderId,
      messageType,
      createdAt: msg.createdAt,
    });

    res.status(201).json({
      success: true,
      data: msg,
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
