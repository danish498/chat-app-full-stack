import express from "express";
import {
  getChats,
  getChatById,
  createChat,
  updateChat,
  deleteChat,
  addMember,
} from "../controllers/chat.controller.js";
import { validate } from "../middleware/validate.js";
import { chatSchemas } from "../validations/chat.schema.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, getChats);
router.get(
  "/:id",
  authenticateToken,
  validate(chatSchemas.getById),
  getChatById,
);
router.post("/", authenticateToken, validate(chatSchemas.create), createChat);
router.patch(
  "/:id",
  authenticateToken,
  validate(chatSchemas.getById),
  updateChat,
); // Reuse getById schema for validation of ID
router.delete(
  "/:id",
  authenticateToken,
  validate(chatSchemas.getById),
  deleteChat,
);
router.post(
  "/:id/add-member",
  authenticateToken,
  validate(chatSchemas.addMember),
  addMember,
);

export default router;
