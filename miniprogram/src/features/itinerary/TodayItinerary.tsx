import { Button, Text, View } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { sceneService, type Scene } from '../scenes/scene-service';
import {
  itineraryService,
  type Itinerary,
  type ItineraryCreateInput,
} from './itinerary-service';
import { ItineraryForm } from './ItineraryForm';

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
          <Text className="itinerary__title">今天行程</Text>
          <Button className="itinerary__add" onClick={openCreate}>
            新增
          </Button>
        </View>
        {items.map((item) => (
          <View className="itinerary__item" key={item.id}>
            <View>
              <Text className="itinerary__time">{item.startTime}</Text>
              <Text className="itinerary__scene">{item.sceneName}</Text>
              <Text className="itinerary__meta">
                {item.estimatedTemperatureCelsius +
                  '°C · ' +
                  item.durationMinutes +
                  '分钟'}
              </Text>
            </View>
            <View>
              <Button
                className="itinerary__edit"
                onClick={() => openEdit(item)}
              >
                编辑
              </Button>
              <Button
                className="itinerary__delete"
                disabled={deleting === item.id}
                onClick={() => handleDelete(item)}
              >
                {deleting === item.id ? '删除中…' : '删除'}
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
      <Text className="itinerary__empty">还没有行程</Text>
      <Button
        className="itinerary__add-first"
        onClick={() => {
          void loadScenes();
          openCreate();
        }}
      >
        添加今天行程
      </Button>
    </View>
  );
}
