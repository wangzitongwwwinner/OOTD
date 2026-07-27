import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { RecommendationCard } from './RecommendationCard';

const city = { cityCode: '101020100', cityName: '上海' };
const result = {
  recommendationId: 'rec-1',
  summary: '洋葱式穿搭',
  layers: [{ type: 'base' as const, description: '棉质 T 恤' }],
  tips: ['随温度穿脱'],
  source: 'llm' as const,
};

it('初始状态由用户主动生成建议', () => {
  render(<RecommendationCard city={city} service={{ generate: vi.fn() }} />);
  expect(screen.getByText('点击生成 AI 全天通勤建议')).toBeInTheDocument();
  expect(
    screen.getByText(
      '融合当前城市的室外气温、空气湿度、紫外线及您今日的整套多场景行程，推荐最合理的穿脱搭配组合。',
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: '生成穿衣决策' }),
  ).toBeInTheDocument();
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
  fireEvent.click(screen.getByRole('button', { name: '生成穿衣决策' }));
  const loading = screen.getByRole('button', {
    name: '正在生成全天建议…',
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
  fireEvent.click(screen.getByRole('button', { name: '生成穿衣决策' }));
  expect(await screen.findByText('通用策略')).toBeInTheDocument();
  expect(screen.getByText('今日穿配叠穿方案')).toBeInTheDocument();
  expect(screen.getByText('气温与层叠逻辑依据')).toBeInTheDocument();
  expect(screen.getByText('全天通勤细节贴士')).toBeInTheDocument();
  expect(screen.getByText('棉质 T 恤')).toBeInTheDocument();
  expect(screen.getByText(/随温度穿脱/)).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: '重新分析今日搭配' }),
  ).toBeInTheDocument();
});

it('重新分析时展示可见的加载状态', async () => {
  let finishAgain!: (value: typeof result) => void;
  const generate = vi
    .fn()
    .mockResolvedValueOnce(result)
    .mockImplementationOnce(
      () =>
        new Promise<typeof result>((resolve) => {
          finishAgain = resolve;
        }),
    );
  render(<RecommendationCard city={city} service={{ generate }} />);
  fireEvent.click(screen.getByRole('button', { name: '生成穿衣决策' }));
  const again = await screen.findByRole('button', {
    name: '重新分析今日搭配',
  });
  fireEvent.click(again);
  expect(
    screen.getByRole('button', { name: '正在重新分析今日搭配…' }),
  ).toBeDisabled();
  finishAgain(result);
});

it('失败时显示错误并允许重试', async () => {
  const generate = vi
    .fn()
    .mockRejectedValueOnce(new Error('建议服务暂时不可用'))
    .mockResolvedValueOnce(result);
  render(<RecommendationCard city={city} service={{ generate }} />);
  fireEvent.click(screen.getByRole('button', { name: '生成穿衣决策' }));
  expect(await screen.findByText('建议服务暂时不可用')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '重试' }));
  await waitFor(() => expect(generate).toHaveBeenCalledTimes(2));
});
