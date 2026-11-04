import type { IUnpaidOrder, OrderQuoteResponse } from '@/features/orders/api/orders.api';

export interface ICheckoutSubtotal {
  /** Dòng "Tạm tính": tiền hàng theo giá niêm yết khi có báo giá. */
  subtotal: number;
  /** Dòng "Giảm giá sale": giá niêm yết trừ giá sau sale; 0 thì ẩn dòng. */
  saleDiscount: number;
}

/**
 * Tách "Tạm tính" và "Giảm giá sale" từ báo giá của máy chủ, chỉ để hiển thị.
 *
 * Máy chủ tính `totalAmount = itemsTotal + shippingFee − discountAmount`, trong đó `itemsTotal`
 * đã trừ sale và `listItemsTotal` là giá niêm yết × số lượng. Hiện Tạm tính theo giá niêm yết
 * rồi trừ dòng sale thì các dòng trong tóm tắt cộng lại đúng bằng Tổng cộng.
 * Chưa có báo giá thì dùng tạm tính của giỏ và chưa hiện dòng sale.
 */
export function getCheckoutSubtotal(
  quote: Pick<OrderQuoteResponse, 'itemsTotal' | 'listItemsTotal'> | null | undefined,
  cartSubtotal: number,
): ICheckoutSubtotal {
  if (!quote) return { subtotal: cartSubtotal, saleDiscount: 0 };
  const listTotal = quote.listItemsTotal ?? quote.itemsTotal;
  const saleDiscount = Math.max(0, listTotal - quote.itemsTotal);
  return { subtotal: quote.itemsTotal + saleDiscount, saleDiscount };
}

/** Mã đơn hiển thị cho khách, cùng dạng `ORD-<orderCode>` với danh sách đơn hàng. */
export function getUnpaidOrderCode(order: Pick<IUnpaidOrder, 'orderCode'>): string {
  return `ORD-${order.orderCode}`;
}

/** Tổng tiền đơn: `totalVnd` khi có, đơn cũ thì dùng `amount`. */
export function getUnpaidOrderTotal(order: Pick<IUnpaidOrder, 'totalVnd' | 'amount'>): number {
  return order.totalVnd ?? order.amount ?? 0;
}
