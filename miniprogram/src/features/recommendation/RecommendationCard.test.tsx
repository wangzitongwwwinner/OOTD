import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { RecommendationCard } from './RecommendationCard';

const city = { cityCode: '101020100', cityName: '上海' };
const result = {
  summary: '洋葱式穿搭',
  layers: [{ type: 'base' as const, description: '棉质 T 恤' }],
  tips: ['随温度穿脱'],
  source: 'llm' as const,
};

it('初始状态由用户主动生成建议', () => {
  render(<RecommendationCard city={city} service={{ generate: vi.fn() }} />);
  expect(screen.getByText('AI 全天穿衣建议')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '生成建议' })).toBeInTheDocument();
});

it('生成时显示规定文案并阻止重复点击', async () => {
  let finish!: (value: typeof result) => void;
  const generate = vi.fn(
    () =>
      new Promise<typeof result>((resolve) => {
        finish = resolve;
      }),
  );
  render(<RecommendationCard city={city} service={{ generate }} />);
  fireEvent.click(screen.getByRole('button', { name: '生成建议' }));
  const loading = screen.getByRole('button', {
    name: '综合全天行程，编排穿脱方案…',
  });
  expect(loading).toBeDisabled();
  fireEvent.click(loading);
  expect(generate).toHaveBeenCalledTimes(1);
  finish(result);
  expect(await screen.findByText('洋葱式穿搭')).toBeInTheDocument();
});

it('展示结构化结果并标识通用策略降级', async () => {
  const rules = { ...result, source: 'rules' as const };
  render(
    <RecommendationCard
      city={city}
      service={{ generate: vi.fn().mockResolvedValue(rules) }}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '生成建议' }));
  expect(await screen.findByText('通用策略')).toBeInTheDocument();
  expect(screen.getByText('棉质 T 恤')).toBeInTheDocument();
  expect(screen.getByText(/随温度穿脱/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '刷新建议' })).toBeInTheDocument();
});

it('失败时显示错误并允许重试', async () => {
  const generate = vi
    .fn()
    .mockRejectedValueOnce(new Error('建议服务暂时不可用'))
    .mockResolvedValueOnce(result);
  render(<RecommendationCard city={city} service={{ generate }} />);
  fireEvent.click(screen.getByRole('button', { name: '生成建议' }));
  expect(await screen.findByText('建议服务暂时不可用')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '重试' }));
  await waitFor(() => expect(generate).toHaveBeenCalledTimes(2));
});
