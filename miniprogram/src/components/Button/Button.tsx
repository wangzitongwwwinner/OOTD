import { Button as TaroButton, Text } from '@tarojs/components';
import type { PropsWithChildren } from 'react';

import './Button.scss';

export interface ButtonProps extends PropsWithChildren {
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  onClick?: () => void;
}

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  loadingText = '处理中…',
  onClick,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TaroButton
      className={`ui-button ui-button--${variant}`}
      disabled={isDisabled}
      loading={loading}
      onClick={isDisabled ? undefined : onClick}
    >
      <Text>{loading ? loadingText : children}</Text>
    </TaroButton>
  );
}
