import { z } from 'zod';

const versionLabelSchema = z.string().trim().min(1).max(32);
const timestampSchema = z.string().datetime({ offset: true });

export const wechatLoginRequestSchema = z
  .object({
    userAgreementVersion: versionLabelSchema,
    privacyPolicyVersion: versionLabelSchema,
    acceptedAt: timestampSchema,
  })
  .strict();

export const authUserSummarySchema = z
  .object({
    id: z.string().trim().min(1),
    nickname: z.string().trim().min(1).max(40),
    avatarFileId: z.string().trim().min(1).optional(),
    recentFeelPreference: z.enum(['cold', 'comfortable', 'stuffy', 'cool']),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    version: z.number().int().positive(),
  })
  .strict();

export const authSessionSchema = z
  .object({
    schemaVersion: z.literal(1),
    userIsolationKey: z.string().trim().min(1),
    authenticatedAt: timestampSchema,
    expiresAt: timestampSchema,
    user: authUserSummarySchema,
  })
  .strict()
  .superRefine((session, context) => {
    if (session.userIsolationKey !== session.user.id) {
      context.addIssue({
        code: 'custom',
        path: ['userIsolationKey'],
        message: 'userIsolationKey must match user.id',
      });
    }

    if (Date.parse(session.expiresAt) <= Date.parse(session.authenticatedAt)) {
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: 'expiresAt must be later than authenticatedAt',
      });
    }
  });

export type WechatLoginRequest = z.infer<typeof wechatLoginRequestSchema>;
export type AuthUserSummary = z.infer<typeof authUserSummarySchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
