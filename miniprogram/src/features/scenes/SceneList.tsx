import { Button, Text, View } from '@tarojs/components';
import { useCallback, useEffect, useState } from 'react';
import { Image } from '@tarojs/components';

import {
  sceneService,
  type Scene,
  type SceneCreateInput,
  type SceneUpdateInput,
} from './scene-service';
import { SceneForm } from './SceneForm';
import './SceneList.scss';

const FEEL_LABELS: Record<Scene['feel'], string> = {
  cold: '偏冷',
  comfortable: '舒适',
  stuffy: '闷热',
  cool: '微凉',
};

const CATEGORY_ICONS: Record<Scene['category'], string> = {
  office: '/assets/icons/scene-office.svg',
  home: '/assets/icons/scene-home.svg',
  metro: '/assets/icons/scene-metro.svg',
  mall: '/assets/icons/scene-mall.svg',
  outdoor: '/assets/icons/scene-outdoor.svg',
  custom: '/assets/icons/scene-custom.svg',
};

interface Props {
  service?: Pick<typeof sceneService, 'list' | 'create' | 'update' | 'delete'>;
}

export function SceneList({ service = sceneService }: Props) {
  const [scenes, setScenes] = useState<Scene[]>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene>();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [deleting, setDeleting] = useState<string>();

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

  async function handleCreate(input: SceneCreateInput) {
    setSaving(true);
    setFormError('');
    try {
      await service.create(input);
      setFormSuccess('已添加');
      setShowForm(false);
      setEditingScene(undefined);
      await load();
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : '添加失败，请稍后重试',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(input: SceneCreateInput) {
    if (!editingScene) return;
    setSaving(true);
    setFormError('');
    try {
      const updateInput: SceneUpdateInput = {
        ...input,
        expectedVersion: editingScene.version,
      };
      await service.update(editingScene.id, updateInput);
      setFormSuccess('已保存');
      setShowForm(false);
      setEditingScene(undefined);
      await load();
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : '保存失败，请稍后重试',
      );
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setEditingScene(undefined);
    setFormError('');
    setFormSuccess('');
    setShowForm(true);
  }

  function openEdit(scene: Scene) {
    setEditingScene(scene);
    setFormError('');
    setFormSuccess('');
    setShowForm(true);
  }

  async function handleDelete(scene: Scene) {
    setDeleting(scene.id);
    try {
      await service.delete(scene.id);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除失败，请稍后重试');
    } finally {
      setDeleting(undefined);
    }
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingScene(undefined);
  }

  if (loading && !scenes) return <Text>正在加载场景…</Text>;
  if (!scenes) {
    return (
      <View className="scene-list__error">
        <Text>{error}</Text>
        <Button onClick={() => void load()}>重新加载</Button>
      </View>
    );
  }

  if (showForm) {
    return (
      <View className="scene-list">
        <SceneForm
          mode={editingScene ? 'edit' : 'create'}
          scene={editingScene}
          onSave={editingScene ? handleUpdate : handleCreate}
          onClose={closeForm}
          saving={saving}
          error={formError}
          success={formSuccess}
        />
      </View>
    );
  }

  return (
    <View className="scene-list">
      {error ? <Text className="scene-list__global-error">{error}</Text> : null}
      {scenes.length ? (
        <View className="scene-list__cards">
          {scenes.map((scene) => (
            <View className="scene-list__card" key={scene.id}>
              <View className="scene-list__icon-wrap">
                <Image
                  className="scene-list__icon"
                  src={CATEGORY_ICONS[scene.category]}
                  mode="aspectFit"
                />
              </View>
              <View className="scene-list__content">
                <View className="scene-list__name-line">
                  <Text className="scene-list__name">{scene.name}</Text>
                  {scene.note ? (
                    <Text className="scene-list__note">{scene.note}</Text>
                  ) : null}
                </View>
                <View className="scene-list__meta-line">
                  <View className="scene-list__temperature">
                    <Image
                      className="scene-list__temperature-icon"
                      src="/assets/icons/thermometer.svg"
                      mode="aspectFit"
                    />
                    <Text>{scene.estimatedTemperatureCelsius}°C</Text>
                  </View>
                  <Text
                    className={`scene-list__feel scene-list__feel--${scene.feel}`}
                  >
                    体感: {FEEL_LABELS[scene.feel]}
                  </Text>
                </View>
              </View>
              <View className="scene-list__actions">
                <Button
                  className="scene-list__action"
                  aria-label={`编辑 ${scene.name}`}
                  onClick={() => (editingScene ? undefined : openEdit(scene))}
                >
                  <Image src="/assets/icons/edit.svg" mode="aspectFit" />
                </Button>
                <Button
                  className="scene-list__delete"
                  aria-label={`删除 ${scene.name}`}
                  disabled={deleting === scene.id}
                  onClick={() => handleDelete(scene)}
                >
                  {deleting === scene.id ? (
                    '…'
                  ) : (
                    <Image src="/assets/icons/trash.svg" mode="aspectFit" />
                  )}
                </Button>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text className="scene-list__empty">还没有场景</Text>
      )}
      <Button
        className="scene-list__add-card"
        aria-label="添加新场景"
        onClick={openCreate}
      >
        <Image
          className="scene-list__add-icon"
          src="/assets/icons/add-circle.svg"
          mode="aspectFit"
        />
        <Text className="scene-list__add-text">添加新场景</Text>
      </Button>
    </View>
  );
}
