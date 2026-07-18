import type {
  AuthUserSummary,
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
}
