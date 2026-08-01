import { describe, expect, it, vi } from 'vitest';
import { createRecommendationService } from './recommendation-service';

const city = { cityCode: '101020100', cityName: '上海' };
const recommendation = {
  summary: '分层穿着',
  layers: [{ type: 'base' as const, description: '棉质 T 恤' }],
  tips: ['随温度穿脱'],
  source: 'llm' as const,
};

describe('recommendation service', () => {
  it('接受上身、下身和鞋履的结构化建议', async () => {
    const structured = {
      summary: '短袖配轻薄长裤，雨天穿防滑鞋',
      layers: [
        { type: 'upper', description: '短袖 T 恤' },
        { type: 'lower', description: '轻薄长裤' },
        { type: 'footwear', description: '防滑耐水的鞋' },
      ],
      tips: ['带伞'],
      source: 'llm',
    };
    const service = createRecommendationService(
      vi.fn().mockResolvedValue({ data: structured, requestId: 'req_new' }),
    );

    await expect(service.generate(city)).resolves.toMatchObject({
      ...structured,
      recommendationId: 'req_new',
    });
  });

  it('只提交城市级触发信息', async () => {
    const call = vi
      .fn()
      .mockResolvedValue({ data: recommendation, requestId: 'req_1' });
    const result = await createRecommendationService(call).generate(city);
    expect(result).toEqual({
      ...recommendation,
      recommendationId: 'req_1',
    });
    expect(call).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/recommendations',
      body: city,
    });
  });

  it('向用户传递友好错误且拒绝异常响应', async () => {
    const failed = createRecommendationService(
      vi.fn().mockResolvedValue({ error: { message: '建议服务暂时不可用' } }),
    );
    await expect(failed.generate(city)).rejects.toThrow('建议服务暂时不可用');
    const malformed = createRecommendationService(
      vi.fn().mockResolvedValue({ data: { summary: '' } }),
    );
    await expect(malformed.generate(city)).rejects.toThrow('建议响应异常');
    const offline = createRecommendationService(
      vi.fn().mockRejectedValue(new Error('secret')),
    );
    await expect(offline.generate(city)).rejects.toThrow('网络连接失败');
  });

  it('未定位时请求不依赖账号和天气的通用建议', async () => {
    const call = vi
      .fn()
      .mockResolvedValue({ data: recommendation, requestId: 'req_guest' });
    const result = await createRecommendationService(call).generate();
    expect(result).toEqual({
      ...recommendation,
      recommendationId: 'req_guest',
    });
    expect(call).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/recommendations/generic',
    });
  });
});
