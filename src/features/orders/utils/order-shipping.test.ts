import { getCarrierLabel, getShippingLabel, getTransferContent, shipmentStatusLabel } from './order-shipping';

describe('shipmentStatusLabel', () => {
  it('prefers the raw GHN status', () => {
    expect(shipmentStatusLabel('SHIPPING', 'transporting')).toBe('Đang trung chuyển');
    expect(shipmentStatusLabel('SHIPPING', ' Delivering ')).toBe('Đang giao hàng');
  });

  it('falls back to the normalized status, then to the raw text', () => {
    expect(shipmentStatusLabel('READY_TO_PICK', null)).toBe('Chờ lấy hàng');
    expect(shipmentStatusLabel(null, 'new_ghn_code')).toBe('new_ghn_code');
    expect(shipmentStatusLabel(null, null)).toBe('Chưa cập nhật');
  });
});

describe('carrier and shipping labels', () => {
  it('uses the GHN display status but not the order one', () => {
    expect(getCarrierLabel({ displayStatus: { source: 'GHN', label: 'Đã lấy hàng' } })).toBe('Đã lấy hàng');
    expect(getCarrierLabel({ displayStatus: { source: 'ORDER', label: 'Đang may' } })).toBeNull();
    expect(getCarrierLabel({})).toBeNull();
  });

  it('falls back to the current shipment, then to no shipment', () => {
    expect(getShippingLabel({ displayStatus: { source: 'GHN', label: 'Đang giao hàng' } })).toBe('Đang giao hàng');
    expect(getShippingLabel({ currentShipment: { status: 'PICKED' } })).toBe('Đã lấy hàng');
    expect(getShippingLabel({})).toBe('Chưa tạo vận đơn');
  });
});

describe('getTransferContent', () => {
  it('matches the backend SePay pattern FAI<orderCode>', () => {
    expect(getTransferContent({ orderCode: 15560998 })).toBe('FAI15560998');
    expect(getTransferContent({ orderCode: null })).toBeNull();
  });
});
