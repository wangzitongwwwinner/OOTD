import { Button, Text, View } from '@tarojs/components';
import { useState } from 'react';
import type { CityLocation } from '../weather/location-service';
import {
  recommendationService,
  type Recommendation,
  type RecommendationLayerType,
} from './recommendation-service';
import './RecommendationCard.scss';

const LAYER_LABELS: Record<RecommendationLayerType, string> = {
  base: '基础层',
  mid: '中间层',
  outer: '外层',
  accessory: '配件',
};

interface Props {
  city: CityLocation;
  service?: Pick<typeof recommendationService, 'generate'>;
}

export function RecommendationCard({
  city,
  service = recommendationService,
}: Props) {
  const [recommendation, setRecommendation] = useState<Recommendation>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      setRecommendation(await service.generate(city));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '建议服务暂时不可用，请稍后重试',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="recommendation-card">
      <View className="recommendation-card__header">
        <View>
          <Text className="recommendation-card__eyebrow">AI 全天穿衣建议</Text>
          <Text className="recommendation-card__title">随温度灵活穿脱</Text>
        </View>
        {recommendation ? (
          <Text
            className={`recommendation-card__source recommendation-card__source--${recommendation.source}`}
          >
            {recommendation.source === 'rules' ? '通用策略' : 'AI 建议'}
          </Text>
        ) : null}
      </View>
      {recommendation ? (
        <View className="recommendation-card__result">
          <Text className="recommendation-card__summary">
            {recommendation.summary}
          </Text>
          <View className="recommendation-card__layers">
            {recommendation.layers.map((layer, index) => (
              <View
                className="recommendation-card__layer"
                key={`${layer.type}-${index}`}
              >
                <Text className="recommendation-card__layer-label">
                  {LAYER_LABELS[layer.type]}
                </Text>
                <Text>{layer.description}</Text>
              </View>
            ))}
          </View>
          {recommendation.tips.length ? (
            <View className="recommendation-card__tips">
              {recommendation.tips.map((tip, index) => (
                <Text className="recommendation-card__tip" key={index}>
                  · {tip}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <Text className="recommendation-card__empty">
          结合当地天气、今日行程和体感偏好，生成一套全天方案。
        </Text>
      )}
      {error ? (
        <Text className="recommendation-card__error">{error}</Text>
      ) : null}
      <Button
        className="recommendation-card__action"
        disabled={loading}
        onClick={() => void generate()}
      >
        {loading
          ? '综合全天行程，编排穿脱方案…'
          : error
            ? '重试'
            : recommendation
              ? '刷新建议'
              : '生成建议'}
      </Button>
    </View>
  );
}
