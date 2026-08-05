import { Text, View } from '@tarojs/components';

import { Button } from '../Button/Button';
import '../StatePanel/StatePanel.scss';

export interface ErrorStateProps {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title,
  description,
  retryLabel = '重新加载',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="ui-state-panel ui-state-panel--error" role="alert">
      <Text className="ui-state-panel__title">{title}</Text>
      <Text className="ui-state-panel__description">{description}</Text>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </View>
  );
}
