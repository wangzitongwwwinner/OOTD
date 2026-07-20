import { Text, View } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { itineraryService, type Itinerary } from './itinerary-service';

export function TodayItinerary() {
  const [items, setItems] = useState<Itinerary[]>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setItems(await itineraryService.listToday());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '行程加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { let active = true; itineraryService.listToday().then(i => { if (active) { setItems(i); setLoading(false); } }).catch(e => { if (active) { setError(e instanceof Error ? e.message : '加载失败'); setLoading(false); } }); return () => { active = false; }; }, []);

  if (loading) return <Text className='itinerary__loading'>正在加载行程…</Text>;
  if (items?.length) {
    return (
      <View className='itinerary'>
        <Text className='itinerary__title'>今天行程</Text>
        {items.map(item => (
          <View className='itinerary__item' key={item.id}>
            <Text className='itinerary__time'>{item.startTime}</Text>
            <Text className='itinerary__scene'>{item.sceneName}</Text>
            <Text className='itinerary__meta'>{item.estimatedTemperatureCelsius + '°C · ' + item.durationMinutes + '分钟'}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (error) return <Text className='itinerary__error'>{error}</Text>;
  return <Text className='itinerary__empty'>还没有行程，去场景库添加吧</Text>;
}
