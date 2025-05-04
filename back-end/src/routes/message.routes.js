const express = require("express");

const { validate } = require("../validators/validators.js");
const { verifyJWT } = require("../middlewares/auth.middleware.js");
const { sendMessage, getAllMessages } = require("../controllers/message.controllers.js");

const router = express.Router();

router.route("/message").post(verifyJWT, sendMessage);
router.route("/messages/:chat_id").get(verifyJWT, getAllMessages);

module.exports = router;
