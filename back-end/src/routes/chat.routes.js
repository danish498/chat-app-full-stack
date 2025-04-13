const express = require("express");

const { validate } = require("../validators/validators.js");
const { verifyJWT } = require("../middlewares/auth.middleware.js");
const { createOnOneChat, fetchChats } = require("../controllers/chat.controllers.js");

const router = express.Router();

router.route("/chat").post(verifyJWT, createOnOneChat);
router.route("/chat").get(verifyJWT, fetchChats);

module.exports = router;
