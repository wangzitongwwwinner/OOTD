import { Button, Text, View } from '@tarojs/components';
import { useState } from 'react';

import { useOptionalAuth } from '../auth/AuthGate';
import { feedbackService, type RecommendationRating } from './feedback-service';
import './RecommendationFeedback.scss';

const OPTIONS: Array<{
  rating: RecommendationRating;
  icon: string;
  label: string;
}> = [
  { rating: 'helpful', icon: '👍', label: '有帮助' },
  { rating: 'neutral', icon: '●', label: '一般' },
  { rating: 'unhelpful', icon: '👎', label: '没帮助' },
];

interface Props {
  recommendationId: string;
  service?: Pick<typeof feedbackService, 'save'>;
}

export function RecommendationFeedback({
  recommendationId,
  service = feedbackService,
}: Props) {
  const auth = useOptionalAuth();
  const [selected, setSelected] = useState<RecommendationRating>();
  const [pending, setPending] = useState<RecommendationRating>();
  const [failed, setFailed] = useState<RecommendationRating>();
  const [error, setError] = useState('');

  async function save(rating: RecommendationRating) {
    setPending(rating);
    setFailed(undefined);
    setError('');
    try {
      await service.save(recommendationId, rating);
      setSelected(rating);
    } catch (cause) {
      setFailed(rating);
      setError(cause instanceof Error ? cause.message : '评价保存失败，请重试');
    } finally {
      setPending(undefined);
    }
  }

  function choose(rating: RecommendationRating) {
    if (pending) return;
    if (auth && auth.status !== 'authenticated') {
      auth.requestLogin({
        title: '登录后提交建议评价',
        description:
          '登录成功后将自动提交您刚才选择的评价，当前建议会为您保留。',
        action: () => save(rating),
      });
      return;
    }
    void save(rating);
  }

  return (
    <View className="recommendation-feedback">
      <Text className="recommendation-feedback__title">
        这条穿衣建议对您有帮助吗？
      </Text>
      <Text className="recommendation-feedback__subtitle">
        您的评价会帮助我们持续优化建议
      </Text>
      <View className="recommendation-feedback__options">
        {OPTIONS.map((option) => (
          <Button
            key={option.rating}
            className={`recommendation-feedback__option ${
              selected === option.rating
                ? 'recommendation-feedback__option--selected'
                : ''
            }`}
            disabled={Boolean(pending)}
            onClick={() => choose(option.rating)}
          >
            <Text className="recommendation-feedback__icon">{option.icon}</Text>
            {pending === option.rating ? '保存中…' : option.label}
          </Button>
        ))}
      </View>
      {error ? (
        <Button
          className="recommendation-feedback__retry"
          onClick={() => failed && choose(failed)}
        >
          {error}，点击重试
        </Button>
      ) : selected ? (
        <Text className="recommendation-feedback__saved">
          已保存 · 可随时修改
        </Text>
      ) : null}
    </View>
  );
}
