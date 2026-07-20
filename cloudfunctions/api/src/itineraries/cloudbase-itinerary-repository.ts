import type { Db } from '@cloudbase/database';
import { itinerarySchema, type Itinerary } from '../../../../packages/contracts/src/index.ts';
import type { TrustedIdentity } from '../context.ts';
import type { ItineraryRepository } from './repository.ts';

export class CloudBaseItineraryRepository implements ItineraryRepository {
  constructor(private readonly database: Db) {}

  async findByDate(date: string, identity: TrustedIdentity): Promise<Itinerary[]> {
    const users = await this.database
      .collection('users')
      .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
      .limit(1)
      .get();
    const user = users.data[0] as { id?: unknown } | undefined;
    if (!user || typeof user.id !== 'string') return [];

    try {
      const result = await this.database
        .collection('itineraries')
      .where({ userId: user.id, localDate: date })
      .orderBy('startTime', 'asc')
      .limit(100)
      .get();

      return result.data.map((stored: unknown) => toPublic(stored));
    } catch {
      return [];
    }
  }
}

function toPublic(stored: unknown): Itinerary {
  if (typeof stored !== 'object' || stored === null) throw new Error('Invalid itinerary');
  const { userId: _u, _id: _d, localDate: _ld, ...itinerary } = stored as Record<string, unknown>;
  void _u; void _d; void _ld;
  return itinerarySchema.parse(itinerary);
}
