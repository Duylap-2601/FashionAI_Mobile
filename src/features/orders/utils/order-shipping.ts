const SHIPMENT_RAW_STATUS_LABELS: Record<string, string> = {
  ready_to_pick: 'Chờ lấy hàng',
  picking: 'Đang lấy hàng',
  money_collect_picking: 'Đang thu tiền khi lấy hàng',
  picked: 'Đã lấy hàng',
  storing: 'Đang lưu kho',
  sorting: 'Đang phân loại',
  transporting: 'Đang trung chuyển',
  delivering: 'Đang giao hàng',
  money_collect_delivering: 'Đang thu tiền khi giao hàng',
  delivered: 'Đã giao hàng',
  delivery_fail: 'Giao hàng không thành công',
  waiting_to_return: 'Chờ hoàn hàng',
  return: 'Đang hoàn hàng',
  return_transporting: 'Đang trung chuyển hoàn hàng',
  return_sorting: 'Đang phân loại hoàn hàng',
  returning: 'Đang trả hàng',
  return_fail: 'Hoàn hàng không thành công',
  returned: 'Đã hoàn hàng',
  cancel: 'Vận đơn đã hủy',
  exception: 'Vận đơn gặp sự cố',
  lost: 'Thất lạc hàng',
  damage: 'Hàng bị hư hỏng',
  scrap: 'Hàng bị hủy',
};

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ tạo vận đơn',
  UNKNOWN: 'Chưa rõ',
  CREATED: 'Đã tạo vận đơn',
  READY_TO_PICK: 'Chờ lấy hàng',
  PICKING: 'Đang lấy hàng',
  PICKED: 'Đã lấy hàng',
  SHIPPING: 'Đang vận chuyển',
  IN_TRANSIT: 'Đang vận chuyển',
  DELIVERING: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  DELIVERY_FAILED: 'Giao hàng không thành công',
  RETURNING: 'Đang hoàn hàng',
  RETURNED: 'Đã hoàn hàng',
  CANCELLED: 'Đã hủy',
  FAILED: 'Tạo vận đơn thất bại',
};

/** Nhãn trạng thái vận đơn: ưu tiên mã thô của GHN, rồi trạng thái chuẩn hóa của BE. */
export function shipmentStatusLabel(status?: string | null, rawStatus?: string | null): string {
  const raw = (rawStatus ?? '').trim().toLowerCase();
  if (raw) return SHIPMENT_RAW_STATUS_LABELS[raw] ?? raw;
  if (!status) return 'Chưa cập nhật';
  return SHIPMENT_STATUS_LABELS[status] ?? status;
}

interface DisplayStatusLike {
  source?: string | null;
  label?: string | null;
}

interface ShipmentLike {
  status?: string | null;
  rawStatus?: string | null;
}

/**
 * Trạng thái vận chuyển BE gửi kèm đơn (`displayStatus`, đi theo GHN). Chỉ trả nhãn khi
 * nguồn không phải chính trạng thái đơn, để không lặp lại nhãn đơn.
 */
export function getCarrierLabel(order: { displayStatus?: DisplayStatusLike | null }): string | null {
  const display = order.displayStatus;
  return display && display.source !== 'ORDER' && display.label ? display.label : null;
}

/** Dòng "Vận chuyển" ở chi tiết đơn, khớp web. */
export function getShippingLabel(order: {
  displayStatus?: DisplayStatusLike | null;
  currentShipment?: ShipmentLike | null;
}): string {
  const carrier = getCarrierLabel(order);
  if (carrier) return carrier;
  if (order.currentShipment) {
    return shipmentStatusLabel(order.currentShipment.status, order.currentShipment.rawStatus);
  }
  return 'Chưa tạo vận đơn';
}

/** Nội dung chuyển khoản BE dùng để tự khớp giao dịch SePay (`\bFAI(\d+)\b`). */
export function getTransferContent(order: { orderCode?: string | number | null }): string | null {
  return order.orderCode !== undefined && order.orderCode !== null && order.orderCode !== ''
    ? `FAI${order.orderCode}`
    : null;
}
