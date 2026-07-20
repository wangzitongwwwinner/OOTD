import { failure, itineraryListSchema, success, type ApiEnvelope, type ItineraryList } from '../../../../packages/contracts/src/index.ts';
import type { TrustedIdentity } from '../context.ts';
import type { ItineraryRepository } from './repository.ts';

export async function getTodayItineraries(
  identity: TrustedIdentity,
  repository: ItineraryRepository,
  requestId: string,
  clock: () => Date = () => new Date(),
): Promise<ApiEnvelope<ItineraryList>> {
  try {
    const today = clock().toISOString().slice(0, 10);
    const items = await repository.findByDate(today, identity);
    return success(itineraryListSchema.parse({ items }), requestId);
  } catch {
    return failure('INTERNAL_ERROR', '行程加载失败，请稍后重试', true, requestId);
  }
}
