import { z } from 'zod';
import { uuidSchema } from './common.schema.js';

export const chatSchemas = {
  create: z.object({
    body: z.object({
      name: z.string().max(100).optional(),
      description: z.string().optional(),
      avatarUrl: z.string().url().max(500).optional(),
      type: z.enum(['direct', 'group']).default('direct'),
      participantIds: z.array(uuidSchema).min(1),
    }),
  }),
  getById: z.object({
    params: z.object({
      id: uuidSchema,
    }),
  }),
  addMember: z.object({
    params: z.object({
      id: uuidSchema,
    }),
    body: z.object({
      userId: uuidSchema,
      role: z.enum(['member', 'admin']).default('member'),
    }),
  }),
};
