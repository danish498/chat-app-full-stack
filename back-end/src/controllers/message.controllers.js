const { logger } = require("../logger/winston.logger");
const db = require("../models");
const { ApiError } = require("../utils/ApiErrors");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

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

  if (!chat_id || !message) {
    throw new ApiError(409, "Invalid data passed into request", []);
  }

  const userId = req.user.user_id;

  console.log("dsfasfdasdfswerwrweqreqwxdfds", userId);

  try {
    // Find the chat by chat_id
    const chat = await Chat.findByPk(chat_id);

    if (!chat) {
      throw new ApiError(404, "Chat not found", []);
    }

    // Check if the user is a participant of the chat
    if (chat.user_id !== userId && chat.recipient_id !== userId) {
      throw new ApiError(409, "You are not authorized to chat.", []);
    }

    // Create the new message
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
              attributes: [
                "user_id",
                "username",
                // "profile_picture" /* other desired user details */,
              ], // Specify user attributes to include
            },

            {
              model: User,
              as: "recipientId",
              attributes: [
                "user_id",
                "username",
                // "profile_picture" /* other desired user details */,
              ], // Specify user attributes to include
            },
          ],
        },
      ],
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { message: findWithUser }, "Msg send"));
  } catch (error) {
    throw new ApiError(409, error.message, []);
  }
});

const getAllMessages = asyncHandler(async (req, res, next) => {
  const { chat_id } = req.params;
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
            attributes: [
              "user_id",
              "username",
              // "profile_picture" /* other desired user details */,
            ], // Specify user attributes to include
          },

          {
            model: User,
            as: "recipientId",
            attributes: [
              "user_id",
              "username",
              // "profile_picture" /* other desired user details */,
            ], // Specify user attributes to include
          },
        ],
      },
    ],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { messages: messages }, "All Messages"));
});

module.exports = { sendMessage, getAllMessages };
