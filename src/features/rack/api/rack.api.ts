import type { HttpOptions } from '@/api/http';
import { http } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { mapBackendRackItem } from '../mappers/rack.mapper';
import type {
  BackendRackItem,
  IClearRackResult,
  IRackItem,
  IRemoveRackItemResult,
} from '../types/rack';

function requireId(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new TypeError(`${label} is required`);
  }
  return normalized;
}

export async function getRackItems(
  options?: Pick<HttpOptions, 'signal'>,
): Promise<IRackItem[]> {
  const items = await http.get<BackendRackItem[]>(ENDPOINTS.RACK.BASE, options);
  return items.map(mapBackendRackItem);
}

export async function pinProductToRack(
  productId: string,
  options?: Pick<HttpOptions, 'signal'>,
): Promise<IRackItem> {
  const id = requireId(productId, 'Product ID');
  const item = await http.post<BackendRackItem>(
    ENDPOINTS.RACK.BASE,
    { productId: id },
    options,
  );
  return mapBackendRackItem(item);
}

export function removeRackItem(
  rackItemId: string,
  options?: Pick<HttpOptions, 'signal'>,
): Promise<IRemoveRackItemResult> {
  const id = requireId(rackItemId, 'Rack item ID');
  return http.delete<IRemoveRackItemResult>(ENDPOINTS.RACK.ITEM(id), options);
}

export function clearRack(
  options?: Pick<HttpOptions, 'signal'>,
): Promise<IClearRackResult> {
  return http.delete<IClearRackResult>(ENDPOINTS.RACK.ALL, options);
}
