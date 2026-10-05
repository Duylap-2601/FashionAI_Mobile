import React from 'react';
import { View, ActivityIndicator, Text, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { Image } from 'expo-image';
import { formatCurrency } from '@/utils/format';

export function PaymentScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  
  const { checkoutUrl, provider, qrCode, orderCode, totalAmount } = route.params || {};

  React.useEffect(() => {
    navigation.setOptions({
      title: provider === 'ZALOPAY' ? 'Thanh toán ZaloPay' : 'Thanh toán SePay',
    });
  }, [navigation, provider]);

  if (!checkoutUrl) {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center items-center">
        <Text className="text-on-surface">Không tìm thấy link thanh toán</Text>
      </SafeAreaView>
    );
  }

  // Nếu là ZALOPAY, hiển thị UI lấy mã QR
  if (provider === 'ZALOPAY') {
    return (
      <SafeAreaView className="flex-1 bg-surface-lowest">
        <View className="flex-1 items-center px-4 py-8">
          <View className="w-full bg-surface p-6 rounded-2xl items-center border border-surface-line shadow-sm mb-6">
            <Text className="text-headline-sm font-bold text-on-surface mb-2">Quét mã để thanh toán</Text>
            <Text className="text-body-sm text-on-surface-variant text-center mb-6">
              Sử dụng ứng dụng ZaloPay hoặc ứng dụng ngân hàng để quét mã
            </Text>
            
            <View className="bg-white p-4 rounded-xl border border-surface-line shadow-sm mb-6">
              {qrCode ? (
                <QRCode value={qrCode} size={200} />
              ) : (
                <View className="w-[200px] h-[200px] bg-surface-line items-center justify-center rounded-lg">
                  <Text className="text-on-surface-variant">Không có mã QR</Text>
                </View>
              )}
            </View>

            <Text className="text-body-md text-on-surface-variant mb-1">Thanh toán đơn hàng {orderCode ? `#${orderCode}` : ''}</Text>
            <Text className="text-[32px] font-bold text-[#0068FF] mb-2">
              {formatCurrency ? formatCurrency(totalAmount || 0) : `${(totalAmount || 0).toLocaleString('vi-VN')}đ`}
            </Text>
          </View>

          <Pressable 
            onPress={() => Linking.openURL(checkoutUrl)}
            className="w-full h-14 bg-[#0068FF] rounded-xl flex-row items-center justify-center active:bg-[#0052cc]"
          >
            <Text className="text-white font-bold text-label-lg">Mở ứng dụng ZaloPay</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Xử lý tạo POST request cho SePay nếu cần thiết
  let source: any = { uri: checkoutUrl };

  try {
    if (provider === 'SEPAY') {
      const urlObj = new URL(checkoutUrl);
      if (
        (urlObj.hostname.includes('sepay.vn') || urlObj.pathname.includes('/checkout/init')) &&
        urlObj.searchParams.size > 0
      ) {
        // Build URL-encoded body từ query params
        const bodyParts: string[] = [];
        urlObj.searchParams.forEach((value, key) => {
          bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        });
        
        // SePay yêu cầu POST form data tới URL gốc (bỏ query params)
        source = {
          uri: `${urlObj.origin}${urlObj.pathname}`,
          method: 'POST',
          body: bodyParts.join('&')
        };
      }
    }
  } catch (error) {
    console.warn('Lỗi phân tích checkoutUrl:', error);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      <WebView 
        source={source}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        startInLoadingState={true}
        renderLoading={() => (
          <View className="absolute inset-0 justify-center items-center bg-surface-lowest">
            <ActivityIndicator size="large" color="#5D1C34" />
            <Text className="mt-4 text-on-surface-variant">Đang kết nối cổng thanh toán...</Text>
          </View>
        )}
        onNavigationStateChange={(navState) => {
          // Xử lý redirect thành công hoặc thất bại nếu có scheme trả về
          if (navState.url.includes('success')) {
            // navigation.navigate('OrderSuccess');
          }
        }}
      />
    </SafeAreaView>
  );
}
