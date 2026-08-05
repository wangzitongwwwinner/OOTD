import { describe, expect, it } from 'vitest';

import { GUEST_CLOTHING } from './guest-clothing';

describe('GUEST_CLOTHING', () => {
  it('uses bundled local assets so guest try-on does not depend on cloud URLs', () => {
    for (const item of GUEST_CLOTHING) {
      expect(item.processedFileId).toMatch(/guest-clothing\/.+\.png$/);
      expect(item.sourceFileId).toBe(item.processedFileId);
      expect(item.processedFileId).not.toMatch(/^(?:cloud:|https?:)/);
    }
  });
});
