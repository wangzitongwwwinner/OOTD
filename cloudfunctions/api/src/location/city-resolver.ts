import type {
  CityLocation,
  ResolveCityRequest,
} from '../../../../packages/contracts/src/index.ts';

export interface CityResolver {
  resolve(location: ResolveCityRequest): Promise<CityLocation>;
}
