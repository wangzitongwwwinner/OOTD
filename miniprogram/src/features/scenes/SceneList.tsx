import { Button, Text, View } from '@tarojs/components';
import { useCallback, useEffect, useState } from 'react';

import { sceneService, type Scene } from './scene-service';
import './SceneList.scss';

const FEEL_LABELS: Record<Scene['feel'], string> = {
  cold: '偏冷',
  comfortable: '舒适',
  stuffy: '闷热',
  cool: '微凉',
};

interface Props {
  service?: Pick<typeof sceneService, 'list'>;
}

export function SceneList({ service = sceneService }: Props) {
  const [scenes, setScenes] = useState<Scene[]>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setScenes(await service.list());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '场景加载失败，请稍后重试',
      );
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    let active = true;
    service.list().then(
      (items) => {
        if (!active) return;
        setScenes(items);
        setLoading(false);
      },
      (cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof Error ? cause.message : '场景加载失败，请稍后重试',
        );
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [service]);

  if (loading && !scenes) return <Text>正在加载场景…</Text>;
  if (!scenes) {
    return (
      <View className="scene-list__error">
        <Text>{error}</Text>
        <Button onClick={() => void load()}>重新加载</Button>
      </View>
    );
  }

  const presets = scenes.filter((scene) => scene.isPreset);
  const custom = scenes.filter((scene) => !scene.isPreset);
  return (
    <View className="scene-list">
      <SceneSection title="预设场景" scenes={presets} />
      <Text className="scene-list__section-title">我的场景</Text>
      {custom.length ? (
        <SceneSection scenes={custom} />
      ) : (
        <Text className="scene-list__empty">还没有自定义场景</Text>
      )}
    </View>
  );
}

function SceneSection({ title, scenes }: { title?: string; scenes: Scene[] }) {
  return (
    <View className="scene-list__section">
      {title ? (
        <Text className="scene-list__section-title">{title}</Text>
      ) : null}
      {scenes.map((scene) => (
        <View className="scene-list__card" key={scene.id}>
          <View>
            <Text className="scene-list__name">{scene.name}</Text>
            <Text className="scene-list__meta">
              {scene.estimatedTemperatureCelsius}°C · {FEEL_LABELS[scene.feel]}
            </Text>
            {scene.note ? (
              <Text className="scene-list__note">{scene.note}</Text>
            ) : null}
          </View>
          {scene.isPreset ? (
            <Text className="scene-list__preset">系统预设</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
