import { Button, Input, Text, View } from '@tarojs/components';
import { useState } from 'react';
import { Image, Slider } from '@tarojs/components';

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
    scene?.category ?? 'custom',
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
    <View className="scene-form__backdrop" onClick={onClose}>
      <View
        className="scene-form"
        role="dialog"
        aria-label={mode === 'create' ? '创建自定义微气候' : '编辑场景气候'}
        onClick={(event) => event.stopPropagation()}
      >
        <View className="scene-form__header">
          <Text className="scene-form__title">
            {mode === 'create' ? '创建自定义微气候' : '编辑场景气候'}
          </Text>
          <Button
            className="scene-form__close"
            aria-label="关闭"
            onClick={onClose}
            disabled={saving}
          >
            <Image src="/assets/icons/close.svg" mode="aspectFit" />
          </Button>
        </View>

        <View className="scene-form__field">
          <Text className="scene-form__label">场景名称</Text>
          <Input
            className="scene-form__input"
            value={name}
            onInput={(e) => setName(e.detail.value)}
            placeholder="例如：书店、健身房、大平层"
            maxlength={15}
            disabled={saving}
          />
        </View>

        <View className="scene-form__field">
          <Text className="scene-form__label">类型归属</Text>
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
            <Text className="scene-form__select-arrow">⌄</Text>
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
          <View className="scene-form__temperature-heading">
            <Text className="scene-form__label">预估环境温度</Text>
            <Text className="scene-form__temperature-value">
              {temperature + '°C'}
            </Text>
          </View>
          <Slider
            className="scene-form__temperature-slider"
            aria-label="预估环境温度"
            min={-10}
            max={40}
            step={1}
            value={temperature}
            activeColor="#211d1a"
            backgroundColor="#eef0f2"
            blockColor="#211d1a"
            blockSize={18}
            onChange={(event) => setTemperature(event.detail.value)}
            disabled={saving}
          />
          <View className="scene-form__temperature-range">
            <Text>-10°C（严寒环境）</Text>
            <Text>40°C（酷暑无冷气）</Text>
          </View>
        </View>

        <View className="scene-form__field">
          <Text className="scene-form__label">在该温度下的体感</Text>
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
          <Text className="scene-form__label">备注（例如：高频活动）</Text>
          <Input
            className="scene-form__input"
            value={note}
            onInput={(e) => setNote(e.detail.value)}
            placeholder="添加特征备注，如“高频活动”、“午休场景”"
            maxlength={15}
            disabled={saving}
          />
        </View>

        {success ? (
          <Text className="scene-form__success">{success}</Text>
        ) : null}
        {error ? <Text className="scene-form__error">{error}</Text> : null}

        <View className="scene-form__actions">
          <Button
            className="scene-form__cancel"
            disabled={saving}
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            className="scene-form__save"
            disabled={saving || !name.trim()}
            onClick={handleSave}
          >
            {saving ? '保存中…' : mode === 'create' ? '确认新建' : '保存修改'}
          </Button>
        </View>
      </View>
    </View>
  );
}
