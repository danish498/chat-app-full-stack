const { Op } = require("sequelize");
const { logger } = require("../logger/winston.logger");
const db = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiErrors");

const Chat = db.Chat;
const User = db.User;

/**
 *  @description    Create or fetch One to One Chat
 *  @route          POST /chat/
 *  @access         Protected
 */

const createOnOneChat = asyncHandler(async (req, res) => {
  console.log("check the response over here", req.user.user_id);

  const loggedInUser = req.user.user_id;

  const { recipient_id, type = "individual" } = req.body;
  // where: { recipient_id: req.user.user_id || recipient_id },

  const existingChat = await Chat.findOne({
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
    where: {
      [Op.or]: [
        {
          user_id: req.user.user_id,
          recipient_id: recipient_id,
        },
        {
          user_id: recipient_id,
          recipient_id: req.user.user_id,
        },
      ],
    },
  });

  if (existingChat) {
    // Both recipient_id and user_id exist in the model

    const newExistingChatData = {
      chat_id: existingChat.chat_id,
      user_id: existingChat.user_id,
      recipient_id: existingChat.recipient_id,
      admin_id: existingChat.admin_id,
      recipientUsers:
        loggedInUser === existingChat.user_id
          ? existingChat.recipientId
          : existingChat.user,
      type: existingChat.type,
      group_name: existingChat.group_name,
      users: [existingChat.user, existingChat.recipientId],
      created_at: existingChat.created_at,
      createdAt: existingChat.createdAt,
      updatedAt: existingChat.updatedAt,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { chat: newExistingChatData },
          "Chat already exists"
        )
      );
  } else {
    // Either recipient_id or user_id doesn't exist in the model
    const newChat = await Chat.create({
      type: type,
      user_id: req.user.user_id,
      recipient_id: recipient_id,
    });

    const newChatWithUser = await Chat.findByPk(newChat.chat_id, {
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
    });

    const newChatCreated = {
      chat_id: newChatWithUser.chat_id,
      user_id: newChatWithUser.user_id,
      recipient_id: newChatWithUser.recipient_id,
      admin_id: newChatWithUser.admin_id,
      recipientUsers:
        loggedInUser === newChatWithUser.user_id
          ? newChatWithUser.recipientId
          : newChatWithUser.user,
      type: newChatWithUser.type,
      group_name: newChatWithUser.group_name,
      users: [newChatWithUser.user, newChatWithUser.recipientId],
      created_at: newChatWithUser.created_at,
      createdAt: newChatWithUser.createdAt,
      updatedAt: newChatWithUser.updatedAt,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { chat: newChatCreated },
          "New Chat created successfully"
        )
      );
  }

  // console.log('check the response over here ifChatExist ifChatExist', ifChatExist)
});



/**
 *  @description    GET ALL CHATS
 *  @route          GET /chat/
 *  @access         Protected
 */


const fetchChats = asyncHandler(async (req, res, next) => {
  const userId = req.user.user_id;

  const loggedInUser = req.user.user_id;

  try {
    // Include User models for both user and recipient
    const chats = await Chat.findAll({
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

      where: {
        [Op.or]: [{ user_id: userId }, { recipient_id: userId }],
      },
    });

    const chatsWithUsers = chats.map((chat) => {
      return {
        chat_id: chat.chat_id,
        user_id: chat.user_id,
        recipient_id: chat.recipient_id,
        admin_id: chat.admin_id,
        recipientUsers:
          loggedInUser === chat.user_id ? chat.recipientId : chat.user,
        type: chat.type,
        group_name: chat.group_name,
        users: [chat.user, chat.recipientId],
        created_at: chat.created_at,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { chats: chatsWithUsers },
          "All Chats with User Details"
        )
      );
  } catch (error) {
    throw new ApiError(409, error, []);
  }
});

module.exports = { createOnOneChat, fetchChats };
