import { z } from 'zod';

import { authUserSummarySchema } from './auth.ts';

export const profileSchema = authUserSummarySchema;

export const updateProfileRequestSchema = z
  .object({
    nickname: z.string().trim().min(1).max(40).optional(),
    avatarFileId: z.string().trim().min(1).max(500).optional(),
    recentFeelPreference: z
      .enum(['cold', 'comfortable', 'stuffy', 'cool'])
      .optional(),
    expectedVersion: z.number().int().positive(),
  })
  .strict()
  .refine(
    (value) =>
      value.nickname !== undefined ||
      value.avatarFileId !== undefined ||
      value.recentFeelPreference !== undefined,
  );

export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
