import { Button, Text, View } from '@tarojs/components';
import { useCallback, useEffect, useState } from 'react';
import { Image } from '@tarojs/components';

import { useOptionalAuth } from '../auth/AuthGate';
import { GUEST_SCENES } from './guest-scenes';
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
  const auth = useOptionalAuth();
  const isGuest = Boolean(auth && auth.status !== 'authenticated');
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
    if (isGuest) return;

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
  }, [isGuest, service]);

  function handleCreate(input: SceneCreateInput) {
    if (isGuest && auth) {
      auth.requestLogin({
        title: '登录后保存新场景',
        description: '登录成功后将自动保存您已填写的场景信息。',
        action: () => persistCreate(input),
      });
      return;
    }
    void persistCreate(input);
  }

  async function persistCreate(input: SceneCreateInput) {
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

  function handleUpdate(input: SceneCreateInput) {
    if (!editingScene) return;
    const scene = editingScene;
    if (isGuest && auth) {
      auth.requestLogin({
        title: '登录后保存场景修改',
        description: '登录成功后将自动保存您对当前场景的修改。',
        action: () => persistUpdate(scene, input),
      });
      return;
    }
    void persistUpdate(scene, input);
  }

  async function persistUpdate(scene: Scene, input: SceneCreateInput) {
    setSaving(true);
    setFormError('');
    try {
      const updateInput: SceneUpdateInput = {
        ...input,
        expectedVersion: scene.version,
      };
      await service.update(scene.id, updateInput);
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

  function handleDelete(scene: Scene) {
    if (isGuest && auth) {
      auth.requestLogin({
        title: '登录后删除场景',
        description: `登录成功后将自动删除“${scene.name}”，取消登录不会产生修改。`,
        action: () => persistDelete(scene),
      });
      return;
    }
    void persistDelete(scene);
  }

  async function persistDelete(scene: Scene) {
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

  const displayedScenes = isGuest ? GUEST_SCENES : scenes;

  if (loading && !displayedScenes) return <Text>正在加载场景…</Text>;
  if (!displayedScenes) {
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
      {displayedScenes.length ? (
        <View className="scene-list__cards">
          {displayedScenes.map((scene) => (
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
