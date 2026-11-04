import {
  getCheckoutSubtotal,
  getUnpaidOrderCode,
  getUnpaidOrderTotal,
} from './checkout-display';

describe('getCheckoutSubtotal', () => {
  it('uses the cart subtotal and no sale line before the quote arrives', () => {
    expect(getCheckoutSubtotal(undefined, 1200000)).toEqual({ subtotal: 1200000, saleDiscount: 0 });
    expect(getCheckoutSubtotal(null, 0)).toEqual({ subtotal: 0, saleDiscount: 0 });
  });

  it('shows the list total as Tạm tính and the sale as its own line', () => {
    const quote = { itemsTotal: 800000, listItemsTotal: 1000000 };

    expect(getCheckoutSubtotal(quote, 800000)).toEqual({ subtotal: 1000000, saleDiscount: 200000 });
  });

  it('keeps the visible lines adding up to the backend total', () => {
    const quote = {
      itemsTotal: 1350000,
      listItemsTotal: 1500000,
      shippingFee: 32000,
      discountAmount: 50000,
      totalAmount: 1350000 + 32000 - 50000,
    };

    const { subtotal, saleDiscount } = getCheckoutSubtotal(quote, 0);

    expect(subtotal - saleDiscount + quote.shippingFee - quote.discountAmount).toBe(quote.totalAmount);
  });

  it('has no sale line when the quote has no list total or no sale', () => {
    expect(getCheckoutSubtotal({ itemsTotal: 500000 }, 450000)).toEqual({ subtotal: 500000, saleDiscount: 0 });
    expect(getCheckoutSubtotal({ itemsTotal: 500000, listItemsTotal: 500000 }, 0)).toEqual({
      subtotal: 500000,
      saleDiscount: 0,
    });
  });

  it('never shows a negative sale when the list total is below the items total', () => {
    expect(getCheckoutSubtotal({ itemsTotal: 500000, listItemsTotal: 400000 }, 0)).toEqual({
      subtotal: 500000,
      saleDiscount: 0,
    });
  });
});

describe('getUnpaidOrderCode', () => {
  it('formats the order code like the orders list', () => {
    expect(getUnpaidOrderCode({ orderCode: 9027452 })).toBe('ORD-9027452');
  });
});

describe('getUnpaidOrderTotal', () => {
  it('prefers totalVnd and falls back to amount', () => {
    expect(getUnpaidOrderTotal({ totalVnd: 610500, amount: 600000 })).toBe(610500);
    expect(getUnpaidOrderTotal({ totalVnd: null, amount: 600000 })).toBe(600000);
    expect(getUnpaidOrderTotal({})).toBe(0);
  });
});
