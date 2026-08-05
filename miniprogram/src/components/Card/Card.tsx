import { View } from '@tarojs/components';
import type { PropsWithChildren } from 'react';

import './Card.scss';

export interface CardProps extends PropsWithChildren {
  ariaLabel?: string;
  tone?: 'default' | 'muted' | 'accent';
}

export function Card({ children, ariaLabel, tone = 'default' }: CardProps) {
  return (
    <View className={`ui-card ui-card--${tone}`} aria-label={ariaLabel}>
      {children}
    </View>
  );
}
