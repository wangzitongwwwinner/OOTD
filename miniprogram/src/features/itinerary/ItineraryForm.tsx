import { Button, Input, Picker, Text, View } from '@tarojs/components';
import { useState } from 'react';
import type { SceneFeel } from '../scenes/scene-service';
import type { Itinerary, ItineraryCreateInput } from './itinerary-service';
import './ItineraryForm.scss';

const FEEL_LABELS: Record<SceneFeel, string> = {
  cold: '偏冷',
  comfortable: '舒适',
  stuffy: '闷热',
  cool: '微凉',
};

interface Props {
  mode: 'create' | 'edit';
  item?: Itinerary;
  scenes: Array<{
    id: string;
    name: string;
    category: string;
    estimatedTemperatureCelsius: number;
    feel?: SceneFeel;
  }>;
  onSave: (input: ItineraryCreateInput) => void;
  onClose: () => void;
  saving: boolean;
  error?: string;
}

export function ItineraryForm({
  mode,
  item,
  scenes,
  onSave,
  onClose,
  saving,
  error,
}: Props) {
  const [sceneIndex, setSceneIndex] = useState(() => {
    if (!item) return 0;
    const index = scenes.findIndex((scene) => scene.id === item.sceneId);
    return index >= 0 ? index : 0;
  });
  const [startTime, setStartTime] = useState(item?.startTime ?? '08:30');
  const [durationHours, setDurationHours] = useState(
    String((item?.durationMinutes ?? 60) / 60),
  );
  const scene = scenes[sceneIndex];
  const sceneText = scene
    ? `${scene.name} (${scene.estimatedTemperatureCelsius}°C, 体感: ${
        scene.feel ? FEEL_LABELS[scene.feel] : '舒适'
      })`
    : '请选择场景';

  function handleSave() {
    if (!scene) return;
    const hours = Math.max(1 / 12, Math.min(24, Number(durationHours) || 1));
    onSave({
      startTime,
      sceneId: scene.id,
      sceneName: scene.name,
      sceneCategory: scene.category,
      estimatedTemperatureCelsius: scene.estimatedTemperatureCelsius,
      durationMinutes: Math.round(hours * 60),
    });
  }

  return (
    <View className="itinerary-form__backdrop" onClick={onClose}>
      <View
        className="itinerary-form"
        role="dialog"
        aria-label={mode === 'create' ? '规划新行程' : '编辑行程'}
        onClick={(event) => event.stopPropagation()}
      >
        <View className="itinerary-form__header">
          <Text className="itinerary-form__title">
            {mode === 'create' ? '规划新行程' : '编辑行程'}
          </Text>
          <Button
            className="itinerary-form__close"
            aria-label="关闭"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </Button>
        </View>

        <View className="itinerary-form__field">
          <Text className="itinerary-form__label">出发时间</Text>
          <View className="itinerary-form__control">
            <Input
              className="itinerary-form__input"
              value={startTime}
              onInput={(event) => setStartTime(event.detail.value)}
              placeholder="08:30"
              maxlength={5}
              disabled={saving}
            />
            <Text className="itinerary-form__clock">◷</Text>
          </View>
        </View>

        <View className="itinerary-form__field">
          <Text className="itinerary-form__label">到达场景</Text>
          <Picker
            mode="selector"
            range={scenes}
            rangeKey="name"
            value={sceneIndex}
            onChange={(event) => setSceneIndex(Number(event.detail.value))}
            disabled={saving}
          >
            <View className="itinerary-form__control itinerary-form__picker">
              <Text>{sceneText}</Text>
              <Text className="itinerary-form__chevron">⌄</Text>
            </View>
          </Picker>
          <Text className="itinerary-form__helper">
            没有找到场景？可以随时去下方的「场景库」页自定义场景，通勤车辆或者商铺的估计温度。
          </Text>
        </View>

        <View className="itinerary-form__field">
          <Text className="itinerary-form__label">预计逗留时长（小时）</Text>
          <Input
            className="itinerary-form__control itinerary-form__input"
            type="digit"
            value={durationHours}
            onInput={(event) => setDurationHours(event.detail.value)}
            disabled={saving}
          />
        </View>

        {error ? <Text className="itinerary-form__error">{error}</Text> : null}

        <View className="itinerary-form__actions">
          <Button
            className="itinerary-form__cancel"
            onClick={onClose}
            disabled={saving}
          >
            取消
          </Button>
          <Button
            className="itinerary-form__save"
            disabled={saving || scenes.length === 0}
            onClick={handleSave}
          >
            {saving
              ? '保存中…'
              : mode === 'create'
                ? '添加至今日行程'
                : '保存行程'}
          </Button>
        </View>
      </View>
    </View>
  );
}
