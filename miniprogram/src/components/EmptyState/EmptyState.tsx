import { Text, View } from '@tarojs/components';

import { Button } from '../Button/Button';
import '../StatePanel/StatePanel.scss';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="ui-state-panel">
      <Text className="ui-state-panel__title">{title}</Text>
      {description && (
        <Text className="ui-state-panel__description">{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
