export interface TrustedIdentity {
  openId: string;
  appId: string;
}

export interface RequestContext {
  requestId: string;
  identity: TrustedIdentity;
}

interface WxContextLike {
  OPENID?: string;
  APPID?: string;
}

export function trustedIdentityFromWxContext(
  context: WxContextLike,
): TrustedIdentity | undefined {
  if (!context.OPENID || !context.APPID) {
    return undefined;
  }

  return {
    openId: context.OPENID,
    appId: context.APPID,
  };
}
