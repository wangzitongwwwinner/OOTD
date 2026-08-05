import { expect, it, vi } from 'vitest';

import { createFeedbackService } from './feedback-service';

it('按建议 ID 幂等保存评价', async () => {
  const call = vi.fn().mockResolvedValue({ data: {} });
  const service = createFeedbackService(call);
  await expect(service.save('rec-1', 'helpful')).resolves.toBe('helpful');
  expect(call).toHaveBeenCalledWith({
    method: 'PUT',
    path: '/v1/recommendations/rec-1/feedback',
    body: { rating: 'helpful' },
  });
});
