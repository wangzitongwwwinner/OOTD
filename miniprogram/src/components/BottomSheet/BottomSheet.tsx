import { Text, View } from '@tarojs/components';
import type { PropsWithChildren } from 'react';

import './BottomSheet.scss';

export interface BottomSheetProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
}

export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: BottomSheetProps) {
  if (!open) return null;

  return (
    <View
      className="ui-sheet"
      data-testid="bottom-sheet-backdrop"
      onClick={onClose}
    >
      <View
        className="ui-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <View className="ui-sheet__handle" aria-hidden="true" />
        <Text className="ui-sheet__title">{title}</Text>
        <View className="ui-sheet__content">{children}</View>
      </View>
    </View>
  );
}
