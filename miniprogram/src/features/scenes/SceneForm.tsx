import { Button, Input, Text, View } from '@tarojs/components';
import { useState } from 'react';

import type {
  Scene,
  SceneCategory,
  SceneCreateInput,
  SceneFeel,
} from './scene-service';

import './SceneForm.scss';

const CATEGORY_OPTIONS: Array<{ value: SceneCategory; label: string }> = [
  { value: 'office', label: '办公室' },
  { value: 'home', label: '家' },
  { value: 'metro', label: '地铁通勤' },
  { value: 'mall', label: '商场' },
  { value: 'outdoor', label: '户外' },
  { value: 'custom', label: '自定义' },
];

const FEEL_OPTIONS: Array<{ value: SceneFeel; label: string }> = [
  { value: 'cold', label: '偏冷' },
  { value: 'comfortable', label: '舒适' },
  { value: 'stuffy', label: '闷热' },
  { value: 'cool', label: '微凉' },
];

interface SceneFormProps {
  mode: 'create' | 'edit';
  scene?: Scene;
  onSave: (input: SceneCreateInput) => void;
  onClose: () => void;
  saving: boolean;
  error?: string;
  success?: string;
}

export function SceneForm({
  mode,
  scene,
  onSave,
  onClose,
  saving,
  error,
  success,
}: SceneFormProps) {
  const [name, setName] = useState(scene?.name ?? '');
  const [category, setCategory] = useState<SceneCategory>(
    scene?.category ?? 'home',
  );
  const [temperature, setTemperature] = useState(
    scene?.estimatedTemperatureCelsius ?? 22,
  );
  const [feel, setFeel] = useState<SceneFeel>(scene?.feel ?? 'comfortable');
  const [note, setNote] = useState(scene?.note ?? '');
  const [showCategory, setShowCategory] = useState(false);

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      category,
      estimatedTemperatureCelsius: temperature,
      feel,
      ...(note.trim() ? { note: note.trim() } : {}),
    });
  }

  return (
    <View className="scene-form">
      <View className="scene-form__header">
        <Text className="scene-form__title">
          {mode === 'create' ? '新增场景' : '编辑场景'}
        </Text>
        <Button
          className="scene-form__close"
          onClick={onClose}
          disabled={saving}
        >
          取消
        </Button>
      </View>

      <View className="scene-form__field">
        <Text className="scene-form__label">名称</Text>
        <Input
          className="scene-form__input"
          value={name}
          onInput={(e) => setName(e.detail.value)}
          placeholder="场景名称，如「健身房」"
          maxlength={40}
          disabled={saving}
        />
      </View>

      <View className="scene-form__field">
        <Text className="scene-form__label">类型</Text>
        <View
          className={
            'scene-form__select' +
            (showCategory ? ' scene-form__select--open' : '')
          }
          onClick={() => {
            if (!saving) setShowCategory((v) => !v);
          }}
        >
          <Text>
            {CATEGORY_OPTIONS.find((o) => o.value === category)?.label ??
              '请选择'}
          </Text>
        </View>
        {showCategory ? (
          <View className="scene-form__options">
            {CATEGORY_OPTIONS.map((option) => (
              <View
                key={option.value}
                className={
                  'scene-form__option' +
                  (category === option.value
                    ? ' scene-form__option--selected'
                    : '')
                }
                onClick={() => {
                  setCategory(option.value);
                  setShowCategory(false);
                }}
              >
                <Text>{option.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View className="scene-form__field">
        <Text className="scene-form__label">
          {'估计温度（' + temperature + '°C）'}
        </Text>
        <Input
          className="scene-form__input"
          type="number"
          value={String(temperature)}
          onInput={(e) => {
            const n = Number(e.detail.value);
            if (!isNaN(n) && n >= -50 && n <= 60) setTemperature(n);
          }}
          disabled={saving}
        />
      </View>

      <View className="scene-form__field">
        <Text className="scene-form__label">体感</Text>
        <View className="scene-form__feel-options">
          {FEEL_OPTIONS.map((option) => (
            <View
              key={option.value}
              className={
                'scene-form__feel-option' +
                (feel === option.value
                  ? ' scene-form__feel-option--selected'
                  : '')
              }
              onClick={() => {
                if (!saving) setFeel(option.value);
              }}
            >
              <Text>{option.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="scene-form__field">
        <Text className="scene-form__label">备注（可选）</Text>
        <Input
          className="scene-form__input"
          value={note}
          onInput={(e) => setNote(e.detail.value)}
          placeholder="如「夏天冷气很足」"
          maxlength={500}
          disabled={saving}
        />
      </View>

      {success ? <Text className="scene-form__success">{success}</Text> : null}
      {error ? <Text className="scene-form__error">{error}</Text> : null}

      <Button
        className="scene-form__save"
        disabled={saving || !name.trim()}
        onClick={handleSave}
      >
        {saving ? '保存中…' : '保存'}
      </Button>
    </View>
  );
}
