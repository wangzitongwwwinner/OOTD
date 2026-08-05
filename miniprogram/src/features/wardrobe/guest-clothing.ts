import jacketImage from '../../assets/guest-clothing/jacket.png';
import pantsImage from '../../assets/guest-clothing/pants.png';
import shoesImage from '../../assets/guest-clothing/shoes.png';

import type { PublicClothing } from './clothing-service';

const STABLE_AT = '2026-07-29T05:16:40.771Z';

export const GUEST_CLOTHING: readonly PublicClothing[] = [
  clothing('preset_clothing_shoes', '阿甘鞋', 'shoes', '白色', shoesImage),
  clothing('preset_clothing_jacket', '皮衣', 'top', '黑色', jacketImage),
  clothing('preset_clothing_pants', '卫裤', 'bottom', '灰色', pantsImage),
];

function clothing(
  id: string,
  name: string,
  category: PublicClothing['category'],
  color: string,
  processedFileId: string,
): PublicClothing {
  return {
    id,
    name,
    category,
    color,
    sourceFileId: processedFileId,
    processedFileId,
    processingStatus: 'ready',
    createdAt: STABLE_AT,
    updatedAt: STABLE_AT,
    version: 1,
  };
}
