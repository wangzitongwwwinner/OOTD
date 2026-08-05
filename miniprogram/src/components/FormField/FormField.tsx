import { Text, View } from '@tarojs/components';
import { cloneElement, useId } from 'react';
import type { ReactElement } from 'react';

import './FormField.scss';

interface FieldControlProps {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-labelledby'?: string;
}

export interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactElement<FieldControlProps>;
}

export function FormField({ label, hint, error, children }: FormFieldProps) {
  const id = useId().replace(/:/g, '');
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const descriptions = [hint ? hintId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ');
  const control = cloneElement(children, {
    'aria-describedby': descriptions || undefined,
    'aria-invalid': Boolean(error),
    'aria-labelledby': labelId,
  });

  return (
    <View className={`ui-field${error ? ' ui-field--error' : ''}`}>
      <Text className="ui-field__label" id={labelId}>
        {label}
      </Text>
      {control}
      {hint && (
        <Text className="ui-field__hint" id={hintId}>
          {hint}
        </Text>
      )}
      {error && (
        <View id={errorId} role="alert">
          <Text className="ui-field__error">{error}</Text>
        </View>
      )}
    </View>
  );
}
