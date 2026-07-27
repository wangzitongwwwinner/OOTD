import Taro from '@tarojs/taro';

export type RecommendationRating = 'helpful' | 'neutral' | 'unhelpful';

type Call = (request: {
  method: 'PUT';
  path: string;
  body: { rating: RecommendationRating };
}) => Promise<unknown>;

export function createFeedbackService(call: Call) {
  return {
    async save(recommendationId: string, rating: RecommendationRating) {
      let result: unknown;
      try {
        result = await call({
          method: 'PUT',
          path: `/v1/recommendations/${recommendationId}/feedback`,
          body: { rating },
        });
      } catch {
        throw new Error('网络连接失败，请稍后重试');
      }
      if (typeof result === 'object' && result !== null && 'error' in result) {
        const error = result.error;
        throw new Error(
          typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof error.message === 'string'
            ? error.message
            : '评价保存失败，请稍后重试',
        );
      }
      return rating;
    },
  };
}

export const feedbackService = createFeedbackService(async (data) => {
  const response = await Taro.cloud.callFunction({ name: 'api', data });
  return response.result;
});
