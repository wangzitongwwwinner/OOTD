import type {
  AuthUserSummary,
  FeelPreference,
  Profile,
  WechatLoginRequest,
} from '../../../../packages/contracts/src/index.ts';

export interface FindOrCreateWechatUserInput {
  openId: string;
  appId: string;
  agreement: WechatLoginRequest;
  now: string;
}

export interface UserRepository {
  findOrCreateByWechatIdentity(
    input: FindOrCreateWechatUserInput,
  ): Promise<AuthUserSummary>;
  findByWechatIdentity(input: {
    openId: string;
    appId: string;
  }): Promise<Profile | undefined>;
  updateFeelPreference(input: {
    openId: string;
    appId: string;
    recentFeelPreference: FeelPreference;
    expectedVersion: number;
    now: string;
  }): Promise<
    | { status: 'updated'; profile: Profile }
    | { status: 'conflict' }
    | { status: 'not_found' }
  >;
}
