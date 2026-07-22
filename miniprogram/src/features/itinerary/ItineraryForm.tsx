import { Button, Input, Picker, Text, View } from '@tarojs/components';
import { useEffect, useState } from 'react';
import type { Itinerary, ItineraryCreateInput } from './itinerary-service';

interface Props {
  mode: 'create' | 'edit';
  item?: Itinerary;
  scenes: Array<{
    id: string;
    name: string;
    category: string;
    estimatedTemperatureCelsius: number;
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
  const [sceneIndex, setSceneIndex] = useState(0);
  const [startTime, setStartTime] = useState(item?.startTime ?? '09:00');
  const [duration, setDuration] = useState(String(item?.durationMinutes ?? 60));

  useEffect(() => {
    if (item && scenes.length) {
      const idx = scenes.findIndex((s) => s.id === item.sceneId);
      if (idx >= 0) setSceneIndex(idx);
    }
  }, [item, scenes]);

  function handleSave() {
    const scene = scenes[sceneIndex];
    if (!scene) return;
    onSave({
      startTime,
      sceneId: scene.id,
      sceneName: scene.name,
      sceneCategory: scene.category,
      estimatedTemperatureCelsius: scene.estimatedTemperatureCelsius,
      durationMinutes: Math.max(5, Math.min(1440, Number(duration) || 60)),
    });
  }

  return (
    <View className="itinerary-form">
      <View className="itinerary-form__header">
        <Text className="itinerary-form__title">
          {mode === 'create' ? '新增行程' : '编辑行程'}
        </Text>
        <Button
          className="itinerary-form__close"
          onClick={onClose}
          disabled={saving}
        >
          取消
        </Button>
      </View>

      <View className="itinerary-form__field">
        <Text className="itinerary-form__label">场景</Text>
        <Picker
          mode="selector"
          range={scenes}
          rangeKey="name"
          value={sceneIndex}
          onChange={(e) => setSceneIndex(Number(e.detail.value))}
          disabled={saving}
        >
          <View className="itinerary-form__picker">
            <Text>{scenes[sceneIndex]?.name ?? '请选择场景'}</Text>
          </View>
        </Picker>
      </View>

      <View className="itinerary-form__field">
        <Text className="itinerary-form__label">开始时间</Text>
        <Input
          className="itinerary-form__input"
          value={startTime}
          onInput={(e) => setStartTime(e.detail.value)}
          placeholder="HH:MM"
          maxlength={5}
          disabled={saving}
        />
      </View>

      <View className="itinerary-form__field">
        <Text className="itinerary-form__label">停留时长（分钟）</Text>
        <Input
          className="itinerary-form__input"
          type="number"
          value={duration}
          onInput={(e) => setDuration(e.detail.value)}
          disabled={saving}
        />
      </View>

      {error ? <Text className="itinerary-form__error">{error}</Text> : null}

      <Button
        className="itinerary-form__save"
        disabled={saving || scenes.length === 0}
        onClick={handleSave}
      >
        {saving ? '保存中…' : '保存'}
      </Button>
    </View>
  );
}
