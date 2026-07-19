import type { Scene } from '../../../../packages/contracts/src/index.ts';
import type { TrustedIdentity } from '../context.ts';

export interface SceneRepository {
  findCustomByIdentity(identity: TrustedIdentity): Promise<Scene[]>;
}
