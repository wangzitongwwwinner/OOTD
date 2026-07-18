export interface WechatLoginRequest {
  userAgreementVersion: string;
  privacyPolicyVersion: string;
  acceptedAt: string;
}

export interface AuthUserSummary {
  id: string;
  nickname: string;
  avatarFileId?: string;
  recentFeelPreference: 'cold' | 'comfortable' | 'stuffy' | 'cool';
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AuthSession {
  schemaVersion: 1;
  userIsolationKey: string;
  authenticatedAt: string;
  expiresAt: string;
  user: AuthUserSummary;
}

export function isAuthSession(value: unknown): value is AuthSession {
  if (!isRecord(value) || !isRecord(value.user)) return false;
  const user = value.user;
  return (
    value.schemaVersion === 1 &&
    typeof value.userIsolationKey === 'string' &&
    value.userIsolationKey === user.id &&
    isTimestamp(value.authenticatedAt) &&
    isTimestamp(value.expiresAt) &&
    Date.parse(value.expiresAt) > Date.parse(value.authenticatedAt) &&
    typeof user.id === 'string' &&
    typeof user.nickname === 'string' &&
    typeof user.createdAt === 'string' &&
    typeof user.updatedAt === 'string' &&
    typeof user.version === 'number' &&
    ['cold', 'comfortable', 'stuffy', 'cool'].includes(
      String(user.recentFeelPreference),
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}
