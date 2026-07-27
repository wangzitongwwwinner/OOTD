import { Image, Text, View } from '@tarojs/components';
import { useState } from 'react';

import { Button } from '../../components';
import productLogo from '../../assets/product-logo.jpg';

import './LoginPage.scss';

interface LoginPageProps {
  status: 'unauthenticated' | 'authenticating';
  error?: string;
  onLogin(): void;
  onOpenLegal(document: 'agreement' | 'privacy'): void;
}

export function LoginPage({
  status,
  error,
  onLogin,
  onOpenLegal,
}: LoginPageProps) {
  const [accepted, setAccepted] = useState(false);
  const [agreementError, setAgreementError] = useState(false);
  const authenticating = status === 'authenticating';

  const handleLogin = () => {
    if (!accepted) {
      setAgreementError(true);
      return;
    }
    setAgreementError(false);
    onLogin();
  };

  return (
    <View className="login-page login-page--kai">
      <View className="login-page__brand">
        <Image
          className="login-page__logo"
          src={productLogo}
          mode="aspectFill"
        />
        <Text className="login-page__title">穿衣有数</Text>
        <View className="login-page__divider" />
        <Text className="login-page__subtitle">
          让每一天的穿衣决策，都成为一种享受。
        </Text>
      </View>

      <View className="login-page__action">
        <Button
          loading={authenticating}
          loadingText="登录中…"
          onClick={handleLogin}
        >
          <Text className="login-page__wechat-icon" aria-hidden="true">
            ●
          </Text>
          <Text>微信一键登录</Text>
        </Button>
        <View className="login-page__consent">
          <View
            className={`login-page__checkbox ${accepted ? 'login-page__checkbox--checked' : ''}`}
            role="checkbox"
            aria-checked={accepted}
            onClick={() => {
              setAccepted((value) => !value);
              setAgreementError(false);
            }}
          >
            {accepted ? '✓' : ''}
          </View>
          <Text>我已阅读并同意</Text>
          <Text
            className="login-page__legal"
            onClick={() => onOpenLegal('agreement')}
          >
            用户协议
          </Text>
          <Text>和</Text>
          <Text
            className="login-page__legal"
            onClick={() => onOpenLegal('privacy')}
          >
            隐私政策
          </Text>
        </View>
        {agreementError && (
          <Text className="login-page__error">
            请先阅读并同意用户协议和隐私政策
          </Text>
        )}
        {error && <Text className="login-page__error">{error}</Text>}
      </View>
    </View>
  );
}
