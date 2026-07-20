import type { Itinerary } from '../../../../packages/contracts/src/index.ts';
import type { TrustedIdentity } from '../context.ts';

export interface ItineraryRepository {
  findByDate(date: string, identity: TrustedIdentity): Promise<Itinerary[]>;
}
