const { logger } = require("../logger/winston.logger");
const db = require("../models");
const { ApiError } = require("../utils/ApiErrors");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { emitSocketEvent } = require("../socket");

const Message = db.Message;
const Chat = db.Chat;
const User = db.User;

/**
 *  @description    send messages
 *  @route           POST /message/
 *  @access          Protected
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { chat_id, message } = req.body;
  const loggedInUser = req.user.user_id;

  if (!chat_id || !message) {
    throw new ApiError(409, "Invalid data passed into request", []);
  }
  const userId = req.user.user_id;

  try {
    // Find the chat by chat_id
    const chat = await Chat.findByPk(chat_id);
    if (!chat) {
      throw new ApiError(404, "Chat not found", []);
    }

    if (chat.user_id !== userId && chat.recipient_id !== userId) {
      throw new ApiError(409, "You are not authorized to chat.", []);
    }

    const newMessage = {
      sender_id: userId,
      message: message,
      chat_id: chat_id,
    };

    const createdMessage = await Message.create(newMessage);

    const findWithUser = await Message.findByPk(createdMessage.message_id, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["user_id", "username", "email", "profile_picture"],
        },
        {
          model: Chat,
          as: "chats",
          attributes: ["user_id", "recipient_id"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["user_id", "username"],
            },
            {
              model: User,
              as: "recipientId",
              attributes: ["user_id", "username"],
            },
          ],
        },
      ],
    });

    const isOwnMessage = findWithUser.sender.user_id === loggedInUser;

    const transformedMessage = {
      message_id: findWithUser.message_id,
      chat_id: findWithUser.chat_id,
      sender_id: findWithUser.sender_id,
      message: findWithUser.message,
      seen: findWithUser.seen,
      created_at: findWithUser.created_at,
      createdAt: findWithUser.createdAt,
      updatedAt: findWithUser.updatedAt,
      sender: {
        user_id: findWithUser.sender.user_id,
        username: findWithUser.sender.username,
        email: findWithUser.sender.email,
      },
      chats: {
        user_id: findWithUser.chats.user_id,
        recipient_id: findWithUser.chats.recipient_id,
        user: {
          user_id: findWithUser.chats.user.user_id,
          username: findWithUser.chats.user.username,
        },
        recipientId: {
          user_id: findWithUser.chats.recipientId.user_id,
          username: findWithUser.chats.recipientId.username,
        },
      },
      alignment: isOwnMessage ? "right" : "left",
      isOwnMessage: isOwnMessage,
      messageType: isOwnMessage ? "sent" : "received",
    };

    const recipientId =
      chat.user_id === userId ? chat.recipient_id : chat.user_id;

    // emitSocketEvent(req, recipientId, "newMessage", transformedMessage);

    logger.info(`Message sent by user ${userId} in chat ${chat_id}`);

    return res
      .status(200)
      .json(new ApiResponse(200, { message: transformedMessage }, "Message sent"));
  } catch (error) {
    throw new ApiError(409, error.message, []);
  }
});

const getAllMessages = asyncHandler(async (req, res, next) => {
  const { chat_id } = req.params;
  const loggedInUser = req.user.user_id;

  const messages = await Message.findAll({
    where: {
      chat_id: chat_id,
    },
    include: [
      {
        model: User,
        as: "sender",
        attributes: ["user_id", "username", "email"],
      },
      {
        model: Chat,
        as: "chats",
        attributes: ["user_id", "recipient_id"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["user_id", "username"],
          },
          {
            model: User,
            as: "recipientId",
            attributes: ["user_id", "username"],
          },
        ],
      },
    ],
    order: [["createdAt", "ASC"]], // Order messages by creation time
  });

  const transformedMessages = messages.map((message) => {
    const isOwnMessage = message.sender.user_id === loggedInUser;

    return {
      message_id: message.message_id,
      chat_id: message.chat_id,
      sender_id: message.sender_id,
      message: message.message,
      seen: message.seen,
      created_at: message.created_at,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: {
        user_id: message.sender.user_id,
        username: message.sender.username,
        email: message.sender.email,
      },
      chats: {
        user_id: message.chats.user_id,
        recipient_id: message.chats.recipient_id,
        user: {
          user_id: message.chats.user.user_id,
          username: message.chats.user.username,
        },
        recipientId: {
          user_id: message.chats.recipientId.user_id,
          username: message.chats.recipientId.username,
        },
      },
      alignment: isOwnMessage ? "right" : "left",
      isOwnMessage: isOwnMessage,
      messageType: isOwnMessage ? "sent" : "received",
    };
  });

  // Optional: Get chat participants info for additional context
  const chatParticipants =
    messages.length > 0
      ? {
          currentUser: loggedInUser,
          otherUser:
            messages[0].chats.user_id === loggedInUser
              ? messages[0].chats.recipientId
              : messages[0].chats.user,
        }
      : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messages: transformedMessages,
        chatInfo: chatParticipants,
        totalMessages: transformedMessages.length,
      },
      "All Messages"
    )
  );
});

module.exports = { sendMessage, getAllMessages };
