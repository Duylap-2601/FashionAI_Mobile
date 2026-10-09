import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, CheckCircle2, Clock, Package, Check, Truck, XCircle, MapPin, Phone } from 'lucide-react-native';
import { Image } from 'expo-image';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { formatCurrency } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';
import { useOrder, useCancelOrder, useConfirmDelivery } from '../hooks/use-orders';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const STATUS_CONFIG: Record<string, any> = {
  PENDING: { label: 'Chờ duyệt', color: 'text-amber-600', hex: '#d97706', bg: 'bg-amber-100', icon: Clock, step: 0 },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'text-amber-600', hex: '#d97706', bg: 'bg-amber-100', icon: Clock, step: 0 },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-blue-600', hex: '#2563eb', bg: 'bg-blue-100', icon: CheckCircle2, step: 1 },
  PROCESSING: { label: 'Đang chuẩn bị', color: 'text-purple-600', hex: '#9333ea', bg: 'bg-purple-100', icon: Package, step: 1 },
  SHIPPING: { label: 'Đang giao hàng', color: 'text-blue-600', hex: '#2563eb', bg: 'bg-blue-100', icon: Truck, step: 2 },
  DELIVERED: { label: 'Đã giao', color: 'text-emerald-600', hex: '#059669', bg: 'bg-emerald-100', icon: Check, step: 3 },
  COMPLETED: { label: 'Hoàn thành', color: 'text-emerald-600', hex: '#059669', bg: 'bg-emerald-100', icon: CheckCircle2, step: 3 },
  CANCELLED: { label: 'Đã hủy', color: 'text-red-600', hex: '#dc2626', bg: 'bg-red-100', icon: XCircle, step: -1 },
  REFUND_PENDING: { label: 'Chờ hoàn tiền', color: 'text-amber-600', hex: '#d97706', bg: 'bg-amber-100', icon: Clock, step: -1 },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'text-emerald-600', hex: '#059669', bg: 'bg-emerald-100', icon: CheckCircle2, step: -1 }
};

function getProductImage(item: any) {
  const fallbackImg = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=120&h=160&fit=crop&auto=format';
  if (item.product?.images) {
    try {
      const parsed = typeof item.product.images === 'string' ? JSON.parse(item.product.images) : item.product.images;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (typeof first === 'string') return first;
        if (first && typeof first === 'object') {
          return first.url || first.uri || first.imageUrl || fallbackImg;
        }
      }
    } catch (e) {}
  }
  return fallbackImg;
}

export function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { order, isLoading, isError, refetch } = useOrder(orderId);
  const { cancelOrder, isCancelling } = useCancelOrder();
  const { confirmDelivery, isConfirmingDelivery } = useConfirmDelivery();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-lowest">
        <View className="flex-row items-center px-4 py-3 border-b border-surface-line bg-surface-lowest">
          <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full active:bg-surface-line">
            <ArrowLeft size={24} color="#1A1A1A" />
          </Pressable>
          <Text className="flex-1 text-center text-headline-sm font-semibold text-on-surface pr-8">Chi tiết đơn hàng</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#5D1C34" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView className="flex-1 bg-surface-lowest">
        <View className="flex-row items-center px-4 py-3 border-b border-surface-line bg-surface-lowest">
          <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full active:bg-surface-line">
            <ArrowLeft size={24} color="#1A1A1A" />
          </Pressable>
          <Text className="flex-1 text-center text-headline-sm font-semibold text-on-surface pr-8">Chi tiết đơn hàng</Text>
        </View>
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-body-md text-on-surface mb-4">Không thể tải thông tin đơn hàng</Text>
          <Pressable className="px-6 py-3 bg-primary rounded-xl" onPress={() => void refetch()}>
            <Text className="text-white font-bold text-label-md">Thử lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const status = order.status || 'PENDING';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  const orderCode = `ORD-${order.orderNumber || order.orderCode}`;
  const totalAmount = order.total || order.totalAmount || 0;
  const subtotal = order.subtotal || order.subtotalAmount || 0;
  const shippingFee = order.shippingFee || 0;
  const items = order.items || [];

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCancel = () => {
    Alert.alert('Hủy đơn hàng', `Bạn có chắc chắn muốn hủy đơn hàng ${orderCode}?`, [
      { text: 'Không', style: 'cancel' },
      { text: 'Hủy đơn', style: 'destructive', onPress: () => {
        cancelOrder(order.id, {
          onSuccess: () => navigation.goBack()
        });
      }}
    ]);
  };

  const handleConfirmDelivery = () => {
    Alert.alert('Đã nhận hàng', 'Bạn xác nhận đã nhận được hàng và hàng hóa ở trạng thái tốt?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', onPress: () => {
        confirmDelivery({ id: order.id }, {
          onSuccess: () => void refetch()
        });
      }}
    ]);
  };

  const handleProductPress = (productId: string | number) => {
    navigation.navigate('ProductDetail', { productId: String(productId) });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-line bg-surface-lowest">
        <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full active:bg-surface-line">
          <ArrowLeft size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="flex-1 text-center text-headline-sm font-semibold text-on-surface pr-8">
          Chi tiết đơn hàng
        </Text>
      </View>

      <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Status Banner */}
        <View className={`px-4 py-4 ${cfg.bg} border-b border-surface-line`}>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Icon size={20} color={cfg.hex} />
              <Text className={`text-headline-sm font-bold ${cfg.color}`}>{cfg.label}</Text>
            </View>
            <View className="flex-row items-center gap-2 bg-white/50 px-2.5 py-1 rounded-full">
              <Text className="text-body-sm font-semibold text-on-surface">#{orderCode}</Text>
              <Pressable onPress={handleCopyCode}>
                {copied ? <CheckCircle2 size={14} color="#10b981" /> : <Copy size={14} color="#666" />}
              </Pressable>
            </View>
          </View>
          <Text className="text-body-sm text-on-surface/80">
            Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
          </Text>
        </View>

        {/* Shipping Address */}
        <View className="bg-white px-4 py-4 mb-2 border-b border-surface-line">
          <Text className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
            Địa chỉ nhận hàng
          </Text>
          <View className="flex-row gap-3">
            <MapPin size={20} color="#5D1C34" className="mt-0.5" />
            <View className="flex-1">
              <Text className="text-body-md font-semibold text-on-surface mb-1">
                {order.shippingInfo?.name || order.shippingAddress?.fullName || order.shippingAddress?.name || 'Khách hàng'}
              </Text>
              <Text className="text-body-sm text-on-surface-variant mb-1">
                {order.shippingInfo?.phone || order.shippingAddress?.phone}
              </Text>
              <Text className="text-body-sm text-on-surface-variant">
                {order.shippingInfo?.address || order.shippingAddress?.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View className="bg-white px-4 py-4 mb-2 border-y border-surface-line">
          <Text className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
            Sản phẩm đã đặt
          </Text>
          <View className="gap-4">
            {items.map((item: any, idx: number) => (
              <Pressable 
                key={item.id || idx} 
                className="flex-row gap-3"
                onPress={() => handleProductPress(item.productId || (item.product && item.product.id))}
              >
                <View className="w-20 h-24 rounded-lg bg-surface border border-surface-line overflow-hidden">
                  <Image source={{ uri: getProductImage(item) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                </View>
                <View className="flex-1">
                  <Text className="text-body-md font-semibold text-on-surface mb-1" numberOfLines={2}>
                    {item.productName || item.product?.name || 'Sản phẩm'}
                  </Text>
                  {item.color && (
                    <Text className="text-label-sm text-on-surface-variant mb-1">
                      Màu sắc: {item.color}
                    </Text>
                  )}
                  {item.size && (
                    <Text className="text-label-sm text-on-surface-variant mb-1">
                      Kích cỡ: {item.size}
                    </Text>
                  )}
                  <Text className="text-body-sm font-bold text-on-surface mt-auto">
                    {formatCurrency(item.price)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-label-md font-medium text-on-surface">x{item.quantity}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View className="bg-white px-4 py-4 mb-2 border-y border-surface-line">
          <Text className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
            Thanh toán
          </Text>
          <View className="gap-2 mb-3">
            <View className="flex-row justify-between">
              <Text className="text-body-sm text-on-surface-variant">Tạm tính</Text>
              <Text className="text-body-sm font-medium text-on-surface">{formatCurrency(subtotal)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-body-sm text-on-surface-variant">Phí vận chuyển</Text>
              <Text className="text-body-sm font-medium text-on-surface">{formatCurrency(shippingFee)}</Text>
            </View>
            {order.discount > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-body-sm text-on-surface-variant">Giảm giá</Text>
                <Text className="text-body-sm font-medium text-emerald-600">-{formatCurrency(order.discount)}</Text>
              </View>
            )}
          </View>
          <View className="flex-row justify-between pt-3 border-t border-surface-line">
            <Text className="text-body-md font-bold text-on-surface">Tổng cộng</Text>
            <Text className="text-headline-sm font-bold text-primary">{formatCurrency(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Bottom Bar */}
      {((status === 'PENDING' || status === 'PENDING_PAYMENT') || status === 'DELIVERED') && (
        <View className="bg-white px-4 py-3 border-t border-surface-line flex-row justify-end gap-3 shadow-sm">
          {(status === 'PENDING' || status === 'PENDING_PAYMENT') && (
            <Pressable 
              onPress={handleCancel}
              disabled={isCancelling}
              className="flex-1 py-3.5 rounded-xl border border-danger/30 bg-white items-center justify-center"
            >
              <Text className="text-label-lg font-bold text-danger">Hủy đơn hàng</Text>
            </Pressable>
          )}
          {status === 'DELIVERED' && (
            <Pressable 
              onPress={handleConfirmDelivery}
              disabled={isConfirmingDelivery}
              className="flex-1 py-3.5 rounded-xl bg-emerald-600 items-center justify-center shadow-sm"
            >
              {isConfirmingDelivery ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-label-lg font-bold text-white">Xác nhận đã nhận hàng</Text>
              )}
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
