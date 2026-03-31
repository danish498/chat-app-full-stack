import express from "express";
import {
  getMessagesByChatId,
  sendMessage,
  deleteMessage,
} from "../controllers/message.controller.js";
import { validate } from "../middleware/validate.js";
import { messageSchemas } from "../validations/message.schema.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/:chatId", authenticateToken, getMessagesByChatId);
router.post("/", validate(messageSchemas.send), authenticateToken, sendMessage);
router.delete(
  "/:id",
  validate(messageSchemas.getById),
  authenticateToken,
  deleteMessage,
);

export default router;
