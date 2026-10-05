import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, CheckCircle2, QrCode, Banknote, ShieldCheck, X, MapPin } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { formatCurrency } from '@/utils/format';
import { useQuery, useMutation } from '@tanstack/react-query';
import { shippingApi, Location, WardLocation } from '@/features/shipping/api/shipping.api';
import { ordersApi } from '@/features/orders/api/orders.api';
import { paymentsApi } from '@/features/payments/api/payments.api';
import { useMeasurementsCompleteness } from '@/features/measurements/hooks/use-measurements-completeness';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { EPaymentMethod } from '@/features/orders/types/order';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<EPaymentMethod>(EPaymentMethod.SEPAY);

  // Lấy danh sách sản phẩm thực từ giỏ hàng
  const { items, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  // State cho việc chọn địa chỉ
  const [selectedProvince, setSelectedProvince] = useState<Location | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<Location | null>(null);
  const [selectedWard, setSelectedWard] = useState<WardLocation | null>(null);

  // State cho UI Modal chọn địa chỉ
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [locationStep, setLocationStep] = useState<'PROVINCE' | 'DISTRICT' | 'WARD'>('PROVINCE');

  // Gọi API lấy Tỉnh/Thành
  const { data: provinces, isLoading: isLoadingProvinces } = useQuery({
    queryKey: ['provinces'],
    queryFn: shippingApi.getProvinces,
  });

  // Gọi API lấy Quận/Huyện khi đã chọn Tỉnh
  const { data: districts, isLoading: isLoadingDistricts } = useQuery({
    queryKey: ['districts', selectedProvince?.id],
    queryFn: () => shippingApi.getDistricts(selectedProvince!.id),
    enabled: !!selectedProvince,
  });

  // Gọi API lấy Phường/Xã khi đã chọn Quận
  const { data: wards, isLoading: isLoadingWards } = useQuery({
    queryKey: ['wards', selectedDistrict?.id],
    queryFn: () => shippingApi.getWards(selectedDistrict!.id),
    enabled: !!selectedDistrict,
  });

  const hasFullAddress = selectedProvince && selectedDistrict && selectedWard;

  // Gọi API lấy báo giá đơn hàng (Quote) để tính tổng tiền và phí ship
  const { data: quoteRes, isLoading: isQuoting } = useQuery({
    queryKey: ['orderQuote', items, selectedWard?.code],
    queryFn: () => ordersApi.quote({
      items: items.map(i => ({
        productId: i.productId,
        color: i.color,
        quantity: i.quantity,
        price: i.price
      })),
      shippingInfo: hasFullAddress ? {
        name: user?.fullName || 'Người nhận',
        phone: user?.phone || '0912345678',
        address: `${selectedWard?.name}, ${selectedDistrict?.name}, ${selectedProvince?.name}`,
        provinceName: selectedProvince?.name,
        districtName: selectedDistrict?.name,
        wardName: selectedWard?.name,
        ghnProvinceId: selectedProvince?.id,
        ghnDistrictId: selectedDistrict?.id,
        ghnWardCode: selectedWard?.code,
      } : undefined,
      paymentMethod: paymentMethod === EPaymentMethod.SEPAY ? 'BANK_TRANSFER' : paymentMethod,
    }),
    enabled: items.length > 0 && !!hasFullAddress,
  });

  const shippingFee = quoteRes?.shippingFee ?? 0;

  // Gọi API lấy báo giá đơn hàng (Quote) để tính tổng tiền
  // Fallback tính toán tại máy (local)
  const localSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const localTotal = localSubtotal + shippingFee;

  const displaySubtotal = quoteRes?.itemsTotal ?? localSubtotal;
  const displayTotal = quoteRes?.totalAmount ?? localTotal;

  // Mutation đặt hàng
  const createOrderMutation = useMutation({
    mutationFn: (payload: any) => ordersApi.createOrder(payload)
  });

  // Mutation checkout SePay
  const checkoutSePayMutation = useMutation({
    mutationFn: (orderId: string | number) => paymentsApi.checkout({ orderId })
  });

  const { canOrder, completeness, byCategory } = useMeasurementsCompleteness();

  const handlePlaceOrder = async () => {
    if (!hasFullAddress) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    
    if (completeness && !canOrder) {
      const missingLabels: string[] = [];
      completeness.byCategory.forEach((cat: any) => {
        if (!cat.complete && cat.missing) {
          cat.missing.forEach((m: any) => {
            if (!missingLabels.includes(m.label)) missingLabels.push(m.label);
          });
        }
      });
      
      const missingText = missingLabels.length > 0 ? `\n\nBạn còn thiếu các số đo: ${missingLabels.join(', ')}` : '';
      
      Alert.alert(
        'Lỗi đặt hàng',
        `Vui lòng cập nhật đầy đủ số đo cơ thể trong hồ sơ trước khi đặt may.${missingText}`,
        [{ text: 'Đóng', style: 'cancel' }]
      );
      return;
    }

    try {
      const orderPayload = {
        items: items.map(i => ({
          productId: i.productId,
          color: i.color,
          quantity: i.quantity,
          price: i.price,
        })),
        shippingInfo: {
          name: user?.fullName || 'Người nhận',
          phone: user?.phone || '0912345678',
          address: `${selectedWard?.name}, ${selectedDistrict?.name}, ${selectedProvince?.name}`,
          provinceName: selectedProvince?.name,
          districtName: selectedDistrict?.name,
          wardName: selectedWard?.name,
          ghnProvinceId: selectedProvince?.id,
          ghnDistrictId: selectedDistrict?.id,
          ghnWardCode: selectedWard?.code,
        },
        shippingFee,
        totalAmount: displayTotal,
        quoteToken: quoteRes?.quoteToken,
        paymentMethod: paymentMethod === EPaymentMethod.SEPAY ? 'BANK_TRANSFER' : paymentMethod,
      };

      const newOrder = await createOrderMutation.mutateAsync(orderPayload);
      const orderId = newOrder.id; // Tùy thuộc vào response thực tế

      if (paymentMethod === EPaymentMethod.COD) {
        Alert.alert('Thành công', 'Đặt hàng thành công!');
        // navigation.navigate('OrderSuccess') hoặc xử lý sau
      } else if (paymentMethod === EPaymentMethod.SEPAY) {
        // Mở cổng thanh toán SePay thông qua PaymentScreen
        const checkoutInfo = await checkoutSePayMutation.mutateAsync(orderId);
        if (checkoutInfo.checkoutUrl) {
          navigation.navigate('Payment', {
            checkoutUrl: checkoutInfo.checkoutUrl,
            provider: 'SEPAY'
          });
        }
      }
    } catch (error: any) {
      const details = error.details ? JSON.stringify(error.details) : '';
      Alert.alert('Lỗi đặt hàng', (error.message || 'Có lỗi xảy ra khi tạo đơn hàng') + (details ? `\n${details}` : ''));
    }
  };

  // Helper render danh sách chọn vị trí
  const renderLocationList = () => {
    let data: any[] = [];
    let isLoading = false;
    let onSelect = (item: any) => {};

    if (locationStep === 'PROVINCE') {
      data = provinces || [];
      isLoading = isLoadingProvinces;
      onSelect = (item: Location) => {
        setSelectedProvince(item);
        setSelectedDistrict(null);
        setSelectedWard(null);
        setLocationStep('DISTRICT');
      };
    } else if (locationStep === 'DISTRICT') {
      data = districts || [];
      isLoading = isLoadingDistricts;
      onSelect = (item: Location) => {
        setSelectedDistrict(item);
        setSelectedWard(null);
        setLocationStep('WARD');
      };
    } else if (locationStep === 'WARD') {
      data = wards || [];
      isLoading = isLoadingWards;
      onSelect = (item: WardLocation) => {
        setSelectedWard(item);
        setIsLocationModalVisible(false);
      };
    }

    if (isLoading) {
      return (
        <View className="p-8 items-center justify-center">
          <ActivityIndicator size="large" color="#5D1C34" />
          <Text className="mt-4 text-on-surface-variant">Đang tải dữ liệu...</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item: any) => item.id?.toString() || item.code}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="px-6 py-4 border-b border-surface-line flex-row items-center justify-between active:bg-surface"
            onPress={() => onSelect(item)}
          >
            <Text className="text-body-lg text-on-surface">{item.name}</Text>
            <ChevronRight size={16} color="#CCCCCC" />
          </TouchableOpacity>
        )}
      />
    );
  };

  const handleOpenLocationModal = () => {
    setLocationStep('PROVINCE');
    setIsLocationModalVisible(true);
  };



  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      <View className="flex-row items-center px-4 py-3 bg-surface-lowest border-b border-surface-line">
        <Pressable 
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 rounded-full active:bg-surface-line"
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="flex-1 text-center text-headline-sm text-on-surface font-semibold pr-8">
          Thanh toán
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!canOrder && completeness && (
          <View className="bg-[#FFF1F2] p-4 mx-4 my-2 rounded-xl border border-[#FDA4AF]">
            <Text className="text-body-md font-bold text-[#BE123C] mb-2">Cần bổ sung số đo cơ thể</Text>
            <Text className="text-body-sm text-[#9F1239] mb-3">
              Giỏ hàng của bạn có trang phục may đo. Vui lòng cập nhật đầy đủ các số đo sau:
            </Text>
            <View className="pl-2 mb-3">
              {byCategory.filter(c => !c.complete).map((cat, i) => (
                <View key={i} className="mb-2">
                  <Text className="text-label-sm font-semibold text-[#9F1239] mb-1">
                    {cat.category === 'UPPER' ? 'Áo (Thân trên)' : cat.category === 'LOWER' ? 'Quần/Váy (Thân dưới)' : 'Đồ bộ (Toàn thân)'}:
                  </Text>
                  {cat.missing.map((m, j) => (
                    <Text key={j} className="text-body-sm text-[#9F1239]">• {m.label}</Text>
                  ))}
                </View>
              ))}
            </View>
            <Pressable 
              className="bg-[#BE123C] py-2 px-4 rounded-lg self-start active:bg-[#9F1239]"
              onPress={() => (navigation.navigate as any)('Main', { 
                screen: 'ProfileTab', 
                params: { screen: 'Measurements' } 
              })}
            >
              <Text className="text-white text-label-md font-bold">Cập nhật số đo</Text>
            </Pressable>
          </View>
        )}

        {/* Địa chỉ giao hàng */}
        <View className="bg-surface-lowest p-4 mb-2 border-y border-surface-line mt-2">
          <View className="flex-row justify-between items-center mb-3">
             <Text className="text-headline-sm font-bold text-on-surface">Giao đến</Text>
             <Pressable className="flex-row items-center p-1" onPress={handleOpenLocationModal}>
               <Text className="text-label-md text-primary font-semibold mr-1">
                 {hasFullAddress ? 'Thay đổi' : 'Chọn địa chỉ'}
               </Text>
               <ChevronRight size={16} color="#5D1C34" />
             </Pressable>
          </View>
          
          {hasFullAddress ? (
            <>
              <Text className="text-body-md font-bold text-on-surface mb-1">
                {user?.fullName || 'Người nhận'} • {user?.phone || 'Chưa cập nhật SĐT'}
              </Text>
              <Text className="text-body-sm text-on-surface-variant mb-3">
                {`${selectedWard?.name}, ${selectedDistrict?.name}, ${selectedProvince?.name}`}
              </Text>
              <View className="flex-row items-center">
                <CheckCircle2 size={16} color="#10B981" />
                <Text className="text-label-sm font-medium text-[#10B981] ml-2">GHN hỗ trợ giao đến địa chỉ này</Text>
              </View>
            </>
          ) : (
            <View className="flex-row items-center bg-surface p-3 rounded-lg border border-surface-line">
              <MapPin size={20} color="#666" />
              <Text className="ml-3 text-body-sm text-on-surface-variant">Vui lòng chọn địa chỉ giao hàng để tính phí vận chuyển.</Text>
            </View>
          )}
        </View>

        {/* Sản phẩm */}
        <View className="bg-surface-lowest p-4 mb-2 border-y border-surface-line">
          <View className="flex-row justify-between items-center mb-4">
             <View className="flex-row items-center gap-2">
               <Text className="text-headline-sm font-bold text-on-surface">Sản phẩm</Text>
               <Text className="text-body-sm text-on-surface-variant">({totalItems} món)</Text>
             </View>
             <Pressable onPress={() => navigation.goBack()}>
               <Text className="text-label-md text-on-surface-variant">Xem lại</Text>
             </Pressable>
          </View>
          
          {items.map((item, index) => (
            <View key={index} className="flex-row gap-4 mb-4">
              <View className="w-[72px] h-[72px] rounded-lg bg-surface-container overflow-hidden border border-surface-line">
                 {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />}
              </View>
              <View className="flex-1 justify-center">
                <Text className="text-label-md font-semibold text-on-surface" numberOfLines={1}>{item.productName}</Text>
                <Text className="text-body-sm text-on-surface-variant mt-1">
                  {item.color ? `Màu ${item.color} • ` : ''}Size {item.size || 'Standard'}
                </Text>
                <Text className="text-label-md font-bold text-on-surface mt-2">
                  {item.quantity} × {formatCurrency ? formatCurrency(item.price) : `${item.price.toLocaleString('vi-VN')}đ`}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Giao hàng */}
        <View className="bg-surface-lowest p-4 mb-2 border-y border-surface-line">
          <Text className="text-headline-sm font-bold text-on-surface mb-3">Phương thức giao hàng</Text>
          <View className="flex-row justify-between items-center bg-surface p-3 rounded-xl border border-surface-line">
             <View>
               <View className="flex-row items-center gap-2 mb-1">
                 <Text className="text-label-md font-bold text-on-surface">🚚 GHN Express</Text>
                 {shippingFee === 0 && hasFullAddress && (
                   <View className="bg-[#E6F4EA] px-2 py-0.5 rounded border border-[#34A853]/30">
                     <Text className="text-[10px] font-bold text-[#34A853]">Freeship</Text>
                   </View>
                 )}
               </View>
               <Text className="text-body-sm text-on-surface-variant">Thời gian giao hàng tiêu chuẩn</Text>
             </View>
             <View className="items-end">
               {isQuoting ? (
                 <ActivityIndicator size="small" color="#5D1C34" />
               ) : hasFullAddress ? (
                 <Text className="text-label-md font-bold text-on-surface">
                   {shippingFee === 0 ? 'Miễn phí' : (formatCurrency ? formatCurrency(shippingFee) : `${shippingFee.toLocaleString('vi-VN')}đ`)}
                 </Text>
               ) : (
                 <Text className="text-label-sm text-on-surface-variant italic">Chưa xác định</Text>
               )}
             </View>
          </View>
        </View>

        {/* Thanh toán */}
        <View className="bg-surface-lowest p-4 mb-2 border-y border-surface-line">
          <Text className="text-headline-sm font-bold text-on-surface mb-3">Phương thức thanh toán</Text>
          
          <Pressable 
            onPress={() => setPaymentMethod(EPaymentMethod.SEPAY)}
            className={`flex-row items-center p-4 rounded-xl border mb-3 ${paymentMethod === EPaymentMethod.SEPAY ? 'border-primary bg-primary/5' : 'border-surface-line bg-surface'}`}
          >
            <View className="w-10 h-10 bg-primary/10 rounded-lg items-center justify-center mr-3">
               <QrCode size={20} color="#5D1C34" />
            </View>
            <View className="flex-1">
              <Text className="text-label-md font-bold text-on-surface">Chuyển khoản QR (SePay)</Text>
              <Text className="text-body-sm text-on-surface-variant mt-1">Quét mã QR bằng ứng dụng ngân hàng 24/7</Text>
            </View>
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${paymentMethod === EPaymentMethod.SEPAY ? 'border-primary' : 'border-surface-line'}`}>
              {paymentMethod === EPaymentMethod.SEPAY && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </View>
          </Pressable>

          <Pressable 
            onPress={() => setPaymentMethod(EPaymentMethod.COD)}
            className={`flex-row items-center p-4 rounded-xl border mb-4 ${paymentMethod === EPaymentMethod.COD ? 'border-primary bg-primary/5' : 'border-surface-line bg-surface'}`}
          >
            <View className="w-10 h-10 bg-surface-container rounded-lg items-center justify-center mr-3">
               <Banknote size={20} color="#666" />
            </View>
            <View className="flex-1">
              <Text className="text-label-md font-bold text-on-surface">Thanh toán khi nhận hàng (COD)</Text>
              <Text className="text-body-sm text-on-surface-variant mt-1">Trả tiền mặt khi nhận hàng</Text>
            </View>
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${paymentMethod === EPaymentMethod.COD ? 'border-primary' : 'border-surface-line'}`}>
              {paymentMethod === EPaymentMethod.COD && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </View>
          </Pressable>
        </View>

        {/* Tổng kết */}
        <View className="bg-surface-lowest p-4 pb-32 border-t border-surface-line">
          <Text className="text-headline-sm font-bold text-on-surface mb-4">Chi tiết thanh toán</Text>
          <View className="flex-row justify-between mb-3">
            <Text className="text-body-md text-on-surface-variant">Tạm tính</Text>
            <Text className="text-body-md font-semibold text-on-surface">
              {displaySubtotal !== undefined 
                ? (formatCurrency ? formatCurrency(displaySubtotal) : `${displaySubtotal.toLocaleString('vi-VN')}đ`)
                : 'Đang tính...'}
            </Text>
          </View>
          <View className="flex-row justify-between mb-5">
            <Text className="text-body-md text-on-surface-variant">Phí vận chuyển</Text>
            <Text className="text-body-md font-semibold text-on-surface">
              {!hasFullAddress 
                ? 'Chưa tính' 
                : shippingFee === 0 
                  ? 'Miễn phí' 
                  : (formatCurrency ? formatCurrency(shippingFee) : `${shippingFee.toLocaleString('vi-VN')}đ`)}
            </Text>
          </View>
          <View className="flex-row justify-between items-end">
            <View>
              <Text className="text-body-lg font-bold text-on-surface">Tổng thanh toán</Text>
              <Text className="text-body-sm text-on-surface-variant mt-0.5">(Đã bao gồm VAT)</Text>
            </View>
            {isQuoting && items.length > 0 && !quoteRes ? (
               <ActivityIndicator size="small" color="#5D1C34" />
            ) : (
              <Text className="text-headline-md font-bold text-on-surface">
                 {displayTotal !== undefined 
                    ? (formatCurrency ? formatCurrency(displayTotal) : `${displayTotal.toLocaleString('vi-VN')}đ`)
                    : '---'}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer Mua Hàng */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface-lowest px-4 py-4 border-t border-surface-line flex-row items-center justify-between pb-8 shadow-hard-4">
        <View>
          <Text className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1 font-semibold">
            Tổng thanh toán
          </Text>
          <Text className="text-headline-md font-bold text-on-surface">
             {displayTotal !== undefined 
                ? (formatCurrency ? formatCurrency(displayTotal) : `${displayTotal.toLocaleString('vi-VN')}đ`)
                : '---'}
          </Text>
        </View>
        <Pressable 
          className={`px-8 py-3.5 rounded-xl flex-row items-center justify-center ${hasFullAddress ? 'bg-primary active:bg-primary-strong' : 'bg-surface-line'}`}
          disabled={!hasFullAddress || isQuoting || createOrderMutation.isPending || checkoutSePayMutation.isPending}
          onPress={handlePlaceOrder}
        >
          {createOrderMutation.isPending || checkoutSePayMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text className={`text-label-lg font-bold ${hasFullAddress ? 'text-on-primary' : 'text-on-surface-variant'}`}>
              Đặt hàng
            </Text>
          )}
        </Pressable>
      </View>

      {/* Modal Chọn Địa Chỉ */}
      <Modal visible={isLocationModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsLocationModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-surface-lowest">
          <View className="flex-row items-center px-4 py-4 border-b border-surface-line">
            <Pressable onPress={() => setIsLocationModalVisible(false)} className="p-2 -ml-2 rounded-full">
              <X size={24} color="#1A1A1A" />
            </Pressable>
            <Text className="flex-1 text-center text-headline-sm text-on-surface font-semibold pr-8">
              {locationStep === 'PROVINCE' ? 'Chọn Tỉnh / Thành' : locationStep === 'DISTRICT' ? 'Chọn Quận / Huyện' : 'Chọn Phường / Xã'}
            </Text>
          </View>
          <View className="flex-1">
             {renderLocationList()}
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
