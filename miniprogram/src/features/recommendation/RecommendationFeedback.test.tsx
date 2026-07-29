import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { RecommendationFeedback } from './RecommendationFeedback';

it('界面第二人称统一使用敬称', () => {
  const { container } = render(
    <RecommendationFeedback
      recommendationId="rec-honorific"
      service={{ save: vi.fn() }}
    />,
  );

  expect(container.textContent).toContain('您');
  expect(container.textContent).not.toContain('你');
});

it('提交评价并允许修改', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <RecommendationFeedback recommendationId="rec-1" service={{ save }} />,
  );
  fireEvent.click(screen.getByRole('button', { name: /有帮助/ }));
  await waitFor(() => expect(save).toHaveBeenCalledWith('rec-1', 'helpful'));
  expect(await screen.findByText('已保存 · 可随时修改')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /一般/ }));
  await waitFor(() =>
    expect(save).toHaveBeenLastCalledWith('rec-1', 'neutral'),
  );
});

it('失败后保留重试入口', async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error('评价保存失败'))
    .mockResolvedValueOnce(undefined);
  render(
    <RecommendationFeedback recommendationId="rec-1" service={{ save }} />,
  );
  fireEvent.click(screen.getByRole('button', { name: /没帮助/ }));
  const retry = await screen.findByRole('button', {
    name: '评价保存失败，点击重试',
  });
  fireEvent.click(retry);
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
});
