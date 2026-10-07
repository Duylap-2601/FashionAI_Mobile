import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, ShoppingBag, MapPin, Phone, Copy, CheckCircle2, ChevronDown, ChevronUp, Clock, Package, Check, Truck, XCircle, Star, ExternalLink } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { formatCurrency } from '@/utils/format';
import { useOrders, useCancelOrder, useConfirmDelivery } from '../hooks/use-orders';
import { IOrder, EOrderStatus } from '../types/order';

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ duyệt', icon: Clock },
  { id: 'processing', label: 'Đang chuẩn bị', icon: Package },
  { id: 'shipping', label: 'Đang giao', icon: Truck },
  { id: 'delivered', label: 'Đã giao', icon: Check },
  { id: 'cancelled', label: 'Đã hủy', icon: XCircle }
];

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

function OrderCard({ order }: { order: IOrder }) {
  const navigation = useNavigation<any>();
  const [copied, setCopied] = useState(false);

  const status = order.status || 'PENDING';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  const orderCode = `ORD-${order.orderNumber || (order as any).orderCode}`;

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const totalAmount = order.total || (order as any).totalAmount || 0;
  const items = order.items || [];
  
  return (
    <View className="bg-white rounded-2xl border border-surface-line shadow-sm overflow-hidden mb-4">
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-surface-line">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-body-sm font-semibold text-on-surface">#{orderCode}</Text>
          <Pressable onPress={handleCopyCode} className="p-1">
            {copied ? <CheckCircle2 size={14} color="#10b981" /> : <Copy size={14} color="#999" />}
          </Pressable>
        </View>
        <View className={`px-2.5 py-1 rounded-full flex-row items-center gap-1.5 ${cfg.bg}`}>
          <Icon size={12} color={cfg.hex} className={cfg.color} />
          <Text className={`text-label-sm font-semibold ${cfg.color}`}>{cfg.label}</Text>
        </View>
      </View>

      {/* Preview Items */}
      <Pressable 
        className="px-4 py-4 flex-row items-center gap-3"
        onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
      >
        <View className="flex-row -space-x-3">
          {items.slice(0, 3).map((item, idx) => (
            <View key={item.id || idx} className="w-12 h-14 rounded-lg bg-surface border-2 border-white overflow-hidden shadow-sm">
              <Image source={{ uri: getProductImage(item) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            </View>
          ))}
          {items.length > 3 && (
            <View className="w-12 h-14 rounded-lg bg-surface-container border-2 border-white flex items-center justify-center">
              <Text className="text-label-sm font-semibold text-on-surface-variant">+{items.length - 3}</Text>
            </View>
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-body-sm font-medium text-on-surface" numberOfLines={1}>
            {items[0]?.productName || (items[0] as any)?.product?.name || 'Sản phẩm'}
          </Text>
          {items.length > 1 && (
            <Text className="text-label-sm text-on-surface-variant">và {items.length - 1} sản phẩm khác</Text>
          )}
        </View>

        <View className="items-end pl-2">
          <Text className="text-body-md font-bold text-primary">{formatCurrency(totalAmount)}</Text>
        </View>
      </Pressable>
    </View>
  );
}

export function OrdersScreen() {
  const navigation = useNavigation();
  const { orders, isLoading } = useOrders();
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredOrders = orders.filter((o: any) => {
    const status = o.status || 'PENDING';
    
    // Status filter
    let matchFilter = false;
    if (activeFilter === 'all') matchFilter = true;
    else if (activeFilter === 'pending') matchFilter = ['PENDING', 'PENDING_PAYMENT'].includes(status);
    else if (activeFilter === 'processing') matchFilter = ['CONFIRMED', 'PROCESSING'].includes(status);
    else if (activeFilter === 'shipping') matchFilter = status === 'SHIPPING';
    else if (activeFilter === 'delivered') matchFilter = ['DELIVERED', 'COMPLETED'].includes(status);
    else if (activeFilter === 'cancelled') matchFilter = ['CANCELLED', 'REFUND_PENDING', 'REFUNDED'].includes(status);

    // Search filter
    const orderCode = `ORD-${o.orderCode || o.orderNumber}`;
    const matchSearch = !search || 
      orderCode.toUpperCase().includes(search.toUpperCase()) ||
      (o.items || []).some((i: any) => (i.product?.name || i.productName || '').toLowerCase().includes(search.toLowerCase()));

    return matchFilter && matchSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-line bg-surface-lowest">
        <Pressable 
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 rounded-full active:bg-surface-line"
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="flex-1 text-center text-headline-sm font-semibold text-on-surface pr-8">
          Đơn hàng của tôi
        </Text>
      </View>

      {/* Search */}
      <View className="px-4 py-3 bg-surface-lowest">
        <View className="flex-row items-center bg-surface-container rounded-xl px-3 h-10">
          <Search size={18} color="#666" />
          <TextInput 
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm mã đơn, sản phẩm..."
            className="flex-1 ml-2 text-body-sm text-on-surface"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-surface-lowest border-b border-surface-line">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2" contentContainerStyle={{ paddingRight: 16, paddingBottom: 12 }}>
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveFilter(tab.id)}
                className={`mx-1 px-4 py-2 rounded-full flex-row items-center gap-1.5 border ${
                  isActive ? 'bg-primary border-primary' : 'bg-white border-surface-line'
                }`}
              >
                <Text className={`text-label-sm font-semibold ${isActive ? 'text-white' : 'text-on-surface-variant'}`}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#5D1C34" />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
            <ShoppingBag size={40} color="#999" />
          </View>
          <Text className="text-headline-sm font-bold text-on-surface mb-2">Chưa có đơn hàng nào</Text>
          <Text className="text-body-sm text-on-surface-variant text-center mb-6">
            Bạn chưa có đơn hàng nào trong trạng thái này.
          </Text>
          <Pressable 
            className="px-6 py-3 bg-primary rounded-xl"
            onPress={() => (navigation as any).navigate('Main', { screen: 'ShopTab' })}
          >
            <Text className="text-white font-bold text-label-md">Tiếp tục mua sắm</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView className="flex-1 bg-surface px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          {filteredOrders.map((order: any) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
