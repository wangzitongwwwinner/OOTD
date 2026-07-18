import { z } from 'zod';

import { authUserSummarySchema } from './auth.ts';

export const profileSchema = authUserSummarySchema;

export const updateProfileRequestSchema = z
  .object({
    recentFeelPreference: z.enum(['cold', 'comfortable', 'stuffy', 'cool']),
    expectedVersion: z.number().int().positive(),
  })
  .strict();

export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
