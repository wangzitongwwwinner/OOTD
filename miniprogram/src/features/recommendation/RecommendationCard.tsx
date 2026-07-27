import { Button, Image, Text, View } from '@tarojs/components';
import { useState } from 'react';
import type { CityLocation } from '../weather/location-service';
import { RecommendationFeedback } from './RecommendationFeedback';
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
    <View
      className={`recommendation-card ${
        recommendation
          ? 'recommendation-card--result'
          : 'recommendation-card--empty'
      }`}
    >
      <View className="recommendation-card__header">
        <View className="recommendation-card__heading">
          {recommendation ? (
            <Image
              className="recommendation-card__robot-image"
              src="/assets/icons/robot-black-v2.svg"
              mode="aspectFit"
            />
          ) : (
            <Text className="recommendation-card__brain">♧</Text>
          )}
          <Text className="recommendation-card__title">
            {recommendation ? 'AI 智能穿衣建议' : '点击生成 AI 全天通勤建议'}
          </Text>
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
          <View className="recommendation-card__outfit">
            <Text className="recommendation-card__eyebrow">
              今日穿配叠穿方案
            </Text>
            <Text className="recommendation-card__summary">
              {recommendation.summary}
            </Text>
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
          <Text className="recommendation-card__section-title">
            气温与层叠逻辑依据
          </Text>
          <Text className="recommendation-card__logic">
            全天温差与不同场景体感均已纳入建议，采用可灵活穿脱的分层方案。
          </Text>
          {recommendation.tips.length ? (
            <View className="recommendation-card__tips">
              <Text className="recommendation-card__section-title">
                全天通勤细节贴士
              </Text>
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
          融合当前城市的室外气温、空气湿度、紫外线及您今日的整套多场景行程，推荐最合理的穿脱搭配组合。
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
        {loading ? (
          <View className="recommendation-card__loading">
            <View className="recommendation-card__spinner" />
            <Text>
              {recommendation ? '正在重新分析今日搭配…' : '正在生成全天建议…'}
            </Text>
          </View>
        ) : error ? (
          '重试'
        ) : recommendation ? (
          '重新分析今日搭配'
        ) : (
          '生成穿衣决策'
        )}
      </Button>
      {recommendation ? (
        <RecommendationFeedback
          key={recommendation.recommendationId}
          recommendationId={recommendation.recommendationId}
        />
      ) : null}
    </View>
  );
}
