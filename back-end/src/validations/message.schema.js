import { z } from "zod";
import { uuidSchema } from "./common.schema.js";

export const messageSchemas = {
  send: z.object({
    body: z.object({
      chatId: uuidSchema,
      content: z.string().min(1),
      messageType: z.enum(["text", "image", "file", "audio", "video", "document"]).default("text"),
      replyToId: uuidSchema.optional(),
    }),
  }),
  getById: z.object({
    params: z.object({
      id: uuidSchema,
    }),
  }),
};
