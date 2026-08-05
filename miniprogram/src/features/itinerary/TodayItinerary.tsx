import { Button, Text, View } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { Image } from '@tarojs/components';
import { useOptionalAuth } from '../auth/AuthGate';
import { GUEST_SCENES } from '../scenes/guest-scenes';
import { sceneService, type Scene } from '../scenes/scene-service';
import {
  itineraryService,
  type Itinerary,
  type ItineraryCreateInput,
} from './itinerary-service';
import { ItineraryForm } from './ItineraryForm';
import { GUEST_ITINERARIES } from './guest-itineraries';
import './TodayItinerary.scss';

type SceneDataService = Pick<typeof sceneService, 'list'>;
type ItineraryDataService = typeof itineraryService;

interface TodayItineraryProps {
  sceneDataService?: SceneDataService;
  itineraryDataService?: ItineraryDataService;
}

export function TodayItinerary({
  sceneDataService = sceneService,
  itineraryDataService = itineraryService,
}: TodayItineraryProps = {}) {
  const auth = useOptionalAuth();
  const isGuest = Boolean(auth && auth.status !== 'authenticated');
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
      setItems(await itineraryDataService.listToday());
    } catch (e) {
      setError(e instanceof Error ? e.message : '行程加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadScenes() {
    try {
      setScenes(await sceneDataService.list());
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (isGuest) return;
    let a = true;
    itineraryDataService
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
  }, [isGuest, itineraryDataService]);
  useEffect(() => {
    if (isGuest) return;
    let active = true;
    sceneDataService
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
  }, [isGuest, sceneDataService]);

  function handleCreate(input: ItineraryCreateInput) {
    if (isGuest && auth) {
      auth.requestLogin({
        title: '\u767b\u5f55\u540e\u6dfb\u52a0\u4eca\u65e5\u884c\u7a0b',
        description:
          '\u767b\u5f55\u6210\u529f\u540e\u5c06\u81ea\u52a8\u6dfb\u52a0\u60a8\u5df2\u586b\u5199\u7684\u884c\u7a0b\u3002',
        action: () => persistCreate(input),
      });
      return;
    }
    void persistCreate(input);
  }

  async function persistCreate(input: ItineraryCreateInput) {
    setSaving(true);
    setFormError('');
    try {
      await itineraryDataService.create(input);
      setShowForm(false);
      setEditing(undefined);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '添加失败');
    } finally {
      setSaving(false);
    }
  }

  function handleUpdate(input: ItineraryCreateInput) {
    if (!editing) return;
    const item = editing;
    if (isGuest && auth) {
      auth.requestLogin({
        title: '\u767b\u5f55\u540e\u4fdd\u5b58\u884c\u7a0b\u4fee\u6539',
        description:
          '\u767b\u5f55\u6210\u529f\u540e\u5c06\u81ea\u52a8\u4fdd\u5b58\u60a8\u5bf9\u5f53\u524d\u884c\u7a0b\u7684\u4fee\u6539\u3002',
        action: () => persistUpdate(item, input),
      });
      return;
    }
    void persistUpdate(item, input);
  }

  async function persistUpdate(item: Itinerary, input: ItineraryCreateInput) {
    setSaving(true);
    setFormError('');
    try {
      await itineraryDataService.update(item.id, {
        ...input,
        expectedVersion: item.version,
      });
      setShowForm(false);
      setEditing(undefined);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '\u4fdd\u5b58\u5931\u8d25');
    } finally {
      setSaving(false);
    }
  }

  async function openCreate() {
    setEditing(undefined);
    setFormError('');
    if (!isGuest) await loadScenes();
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

  function handleDelete(item: Itinerary) {
    if (isGuest && auth) {
      auth.requestLogin({
        title: '\u767b\u5f55\u540e\u5220\u9664\u884c\u7a0b',
        description:
          '\u767b\u5f55\u6210\u529f\u540e\u5c06\u81ea\u52a8\u5220\u9664\u201c' +
          item.sceneName +
          '\u201d\uff0c\u53d6\u6d88\u767b\u5f55\u4e0d\u4f1a\u4ea7\u751f\u4fee\u6539\u3002',
        action: () => persistDelete(item),
      });
      return;
    }
    void persistDelete(item);
  }

  async function persistDelete(item: Itinerary) {
    setDeleting(item.id);
    try {
      await itineraryDataService.delete(item.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '\u5220\u9664\u5931\u8d25');
    } finally {
      setDeleting(undefined);
    }
  }

  const displayedItems = isGuest ? GUEST_ITINERARIES : items;
  const displayedScenes = isGuest ? GUEST_SCENES : scenes;

  if (loading && !displayedItems)
    return <Text className="itinerary__loading">正在加载行程…</Text>;

  if (showForm) {
    return (
      <View className="itinerary">
        <ItineraryForm
          mode={editing ? 'edit' : 'create'}
          item={editing}
          scenes={[...displayedScenes]}
          onSave={editing ? handleUpdate : handleCreate}
          onClose={closeForm}
          saving={saving}
          error={formError}
        />
      </View>
    );
  }

  if (displayedItems?.length) {
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
              void openCreate();
            }}
          >
            ＋ 添加行程
          </Button>
        </View>
        {displayedItems.map((item) => (
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
                {displayedScenes.find((scene) => scene.id === item.sceneId)
                  ?.note ? (
                  <Text className="itinerary__note">
                    {
                      displayedScenes.find((scene) => scene.id === item.sceneId)
                        ?.note
                    }
                  </Text>
                ) : null}
              </View>
              <View className="itinerary__meta-line">
                <Text className="itinerary__meta">
                  预估环境：{item.estimatedTemperatureCelsius}°C
                </Text>
                {displayedScenes.find((scene) => scene.id === item.sceneId)
                  ?.feel ? (
                  <Text
                    className={`itinerary__feel itinerary__feel--${
                      displayedScenes.find(
                        (scene) => scene.id === item.sceneId,
                      )!.feel
                    }`}
                  >
                    体感：
                    {
                      {
                        cold: '偏冷',
                        comfortable: '舒适',
                        stuffy: '闷热',
                        cool: '微凉',
                      }[
                        displayedScenes.find(
                          (scene) => scene.id === item.sceneId,
                        )!.feel
                      ]
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
            void openCreate();
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
