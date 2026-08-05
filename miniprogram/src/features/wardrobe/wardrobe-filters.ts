import type { ClothingCategory, PublicClothing } from './clothing-service';

export interface WardrobeFilters {
  query: string;
  category: ClothingCategory | '';
  color: string;
}

export function filterClothing(
  items: PublicClothing[],
  filters: WardrobeFilters,
): PublicClothing[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return items.filter(
    (item) =>
      item.processingStatus === 'ready' &&
      (!query || item.name.toLocaleLowerCase().includes(query)) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.color || item.color === filters.color),
  );
}
