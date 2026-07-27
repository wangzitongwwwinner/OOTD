import { Button, Text, View } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { Image } from '@tarojs/components';
import { sceneService, type Scene } from '../scenes/scene-service';
import {
  itineraryService,
  type Itinerary,
  type ItineraryCreateInput,
} from './itinerary-service';
import { ItineraryForm } from './ItineraryForm';
import './TodayItinerary.scss';

export function TodayItinerary() {
  const [items, setItems] = useState<Itinerary[]>();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Itinerary>();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<string>();

  async function load() {
    setLoading(true);
    setError('');
    try {
      setItems(await itineraryService.listToday());
    } catch (e) {
      setError(e instanceof Error ? e.message : '行程加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadScenes() {
    try {
      setScenes(await sceneService.list());
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    let a = true;
    itineraryService
      .listToday()
      .then((i) => {
        if (a) {
          setItems(i);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (a) {
          setError(e instanceof Error ? e.message : '加载失败');
          setLoading(false);
        }
      });
    return () => {
      a = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    sceneService
      .list()
      .then((result) => {
        if (active) setScenes(result);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(input: ItineraryCreateInput) {
    setSaving(true);
    setFormError('');
    try {
      await itineraryService.create(input);
      setShowForm(false);
      setEditing(undefined);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '添加失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(input: ItineraryCreateInput) {
    if (!editing) return;
    setSaving(true);
    setFormError('');
    try {
      await itineraryService.update(editing.id, {
        ...input,
        expectedVersion: editing.version,
      });
      setShowForm(false);
      setEditing(undefined);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setEditing(undefined);
    setFormError('');
    setShowForm(true);
  }
  function openEdit(item: Itinerary) {
    setEditing(item);
    setFormError('');
    setShowForm(true);
  }
  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditing(undefined);
  }

  async function handleDelete(item: Itinerary) {
    setDeleting(item.id);
    try {
      await itineraryService.delete(item.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    } finally {
      setDeleting(undefined);
    }
  }

  if (loading) return <Text className="itinerary__loading">正在加载行程…</Text>;

  if (showForm) {
    return (
      <View className="itinerary">
        <ItineraryForm
          mode={editing ? 'edit' : 'create'}
          item={editing}
          scenes={scenes}
          onSave={editing ? handleUpdate : handleCreate}
          onClose={closeForm}
          saving={saving}
          error={formError}
        />
      </View>
    );
  }

  if (items?.length) {
    return (
      <View className="itinerary">
        <View className="itinerary__header">
          <View className="itinerary__heading">
            <View className="itinerary__calendar" aria-hidden="true" />
            <Text className="itinerary__title">今日通勤行程</Text>
          </View>
          <Button className="itinerary__add" onClick={openCreate}>
            ＋ 添加行程
          </Button>
        </View>
        {items.map((item) => (
          <View className="itinerary__item" key={item.id}>
            <View className="itinerary__time-group">
              <Text className="itinerary__time">{item.startTime}</Text>
              <Text className="itinerary__duration">
                {item.durationMinutes % 60 === 0
                  ? `${item.durationMinutes / 60}h`
                  : `${item.durationMinutes}m`}
              </Text>
            </View>
            <View className="itinerary__divider" />
            <View className="itinerary__content">
              <View className="itinerary__scene-line">
                <Text className="itinerary__scene">{item.sceneName}</Text>
                {scenes.find((scene) => scene.id === item.sceneId)?.note ? (
                  <Text className="itinerary__note">
                    {scenes.find((scene) => scene.id === item.sceneId)?.note}
                  </Text>
                ) : null}
              </View>
              <View className="itinerary__meta-line">
                <Text className="itinerary__meta">
                  预估环境：{item.estimatedTemperatureCelsius}°C
                </Text>
                {scenes.find((scene) => scene.id === item.sceneId)?.feel ? (
                  <Text
                    className={`itinerary__feel itinerary__feel--${
                      scenes.find((scene) => scene.id === item.sceneId)!.feel
                    }`}
                  >
                    体感：
                    {
                      {
                        cold: '偏冷',
                        comfortable: '舒适',
                        stuffy: '闷热',
                        cool: '微凉',
                      }[scenes.find((scene) => scene.id === item.sceneId)!.feel]
                    }
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="itinerary__actions">
              <Button
                className="itinerary__edit"
                aria-label={`编辑 ${item.sceneName}`}
                onClick={() => openEdit(item)}
              >
                <Image
                  className="itinerary__action-icon"
                  src="/assets/icons/edit.svg"
                  mode="aspectFit"
                />
              </Button>
              <Button
                className="itinerary__delete"
                aria-label={`删除 ${item.sceneName}`}
                disabled={deleting === item.id}
                onClick={() => handleDelete(item)}
              >
                {deleting === item.id ? (
                  '…'
                ) : (
                  <Image
                    className="itinerary__action-icon"
                    src="/assets/icons/trash.svg"
                    mode="aspectFit"
                  />
                )}
              </Button>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (error) return <Text className="itinerary__error">{error}</Text>;
  return (
    <View className="itinerary">
      <View className="itinerary__header">
        <View className="itinerary__heading">
          <View className="itinerary__calendar" aria-hidden="true" />
          <Text className="itinerary__title">今日通勤行程</Text>
        </View>
        <Button
          className="itinerary__add"
          onClick={() => {
            void loadScenes();
            openCreate();
          }}
        >
          ＋ 添加行程
        </Button>
      </View>
      <View className="itinerary__empty-card">
        <Text className="itinerary__empty">今天还没有行程</Text>
        <Text className="itinerary__empty-hint">
          添加通勤、办公或休闲场景，让建议覆盖全天温差。
        </Text>
      </View>
    </View>
  );
}
