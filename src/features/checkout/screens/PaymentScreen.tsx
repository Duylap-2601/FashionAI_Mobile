import React from 'react';
import { View, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';

export function PaymentScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  
  const { checkoutUrl, provider } = route.params || {};

  if (!checkoutUrl) {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center items-center">
        <Text className="text-on-surface">Không tìm thấy link thanh toán</Text>
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
          body: bodyParts.join('&'),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        };
      }
    }
  } catch (error) {
    console.warn('Lỗi phân tích checkoutUrl:', error);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <WebView 
        source={source}
        style={{ flex: 1 }}
        startInLoadingState={true}
        renderLoading={() => (
          <View className="absolute inset-0 justify-center items-center bg-surface">
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
