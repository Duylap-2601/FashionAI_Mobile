import type { GarmentType, IProduct } from '../types/product';

export function matchesGarmentType(
  product: IProduct,
  garmentType?: GarmentType,
): boolean {
  if (!garmentType) return true;

  if (
    product.garmentType &&
    product.garmentType.toUpperCase() === garmentType.toUpperCase()
  ) {
    return true;
  }

  const name = (product.name || '').toLowerCase();

  switch (garmentType) {
    case 'SHIRT':
      return name.includes('sơ mi') || name.includes('shirt');
    case 'VEST':
      return (
        name.includes('gile') ||
        name.includes('ghi lê') ||
        (name.includes('vest') && !name.includes('blazer'))
      );
    case 'JACKET':
      return (
        name.includes('blazer') ||
        name.includes('khoác') ||
        name.includes('jacket') ||
        name.includes('kaki') ||
        name.includes('cardigan')
      );
    case 'PANTS':
      return (
        name.includes('quần') ||
        name.includes('pant') ||
        name.includes('trouser')
      );
    case 'SKIRT':
      return (
        name.includes('chân váy') ||
        name.includes('skirt') ||
        (name.includes('váy') &&
          !name.includes('đầm') &&
          !name.includes('dress'))
      );
    case 'DRESS':
      return name.includes('đầm') || name.includes('dress');
    case 'JUMPSUIT':
      return name.includes('jumpsuit');
    default:
      return false;
  }
}
