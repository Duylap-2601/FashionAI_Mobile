import type { IProduct } from '../types/product';
import { matchesGarmentType } from './product-filters';

function buildProduct(
  name: string,
  garmentType: IProduct['garmentType'] = null,
): IProduct {
  return { name, garmentType } as IProduct;
}

describe('matchesGarmentType', () => {
  it('matches every product when no garment type is selected', () => {
    expect(matchesGarmentType(buildProduct('Áo sơ mi trắng'), undefined)).toBe(
      true,
    );
  });

  it('prefers the product garment type', () => {
    expect(
      matchesGarmentType(buildProduct('Sản phẩm không tên', 'VEST'), 'VEST'),
    ).toBe(true);
  });

  it('falls back to the product name', () => {
    expect(matchesGarmentType(buildProduct('Áo sơ mi tay ngắn'), 'SHIRT')).toBe(
      true,
    );
    expect(matchesGarmentType(buildProduct('Áo khoác Blazer'), 'JACKET')).toBe(
      true,
    );
    expect(matchesGarmentType(buildProduct('Chân váy xếp ly'), 'SKIRT')).toBe(
      true,
    );
    expect(matchesGarmentType(buildProduct('Đầm trench'), 'DRESS')).toBe(true);
  });

  it('does not match a different garment type', () => {
    expect(matchesGarmentType(buildProduct('Áo sơ mi tay ngắn'), 'VEST')).toBe(
      false,
    );
  });
});
