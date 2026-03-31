import { z } from 'zod';
import { uuidSchema } from './common.schema.js';

export const userSchemas = {
  create: z.object({
    body: z.object({
      username: z.string().min(3).max(50),
      email: z.string().email(),
      password: z.string().min(8),
      displayName: z.string().max(100).optional(),
      avatarUrl: z.string().url().max(500).optional(),
    }),
  }),
  update: z.object({
    params: z.object({
      id: uuidSchema,
    }),
    body: z.object({
      username: z.string().min(3).max(50).optional(),
      displayName: z.string().max(100).optional(),
      avatarUrl: z.string().url().max(500).optional(),
      status: z.enum(['online', 'offline', 'away', 'busy']).optional(),
    }),
  }),
  getById: z.object({
    params: z.object({
      id: uuidSchema,
    }),
  }),
};
