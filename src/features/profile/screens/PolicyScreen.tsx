import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Shield, FileText, RefreshCw, Mail, Phone, Clock, CheckCircle2 } from 'lucide-react-native';

type PolicyType = 'privacy' | 'terms' | 'return';

export function PolicyScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialType: PolicyType = route.params?.type || 'privacy';

  const [activeTab, setActiveTab] = useState<PolicyType>(initialType);

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-surface border-b border-surface-line">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 -ml-1 rounded-full items-center justify-center active:bg-surface-line"
          accessibilityLabel="Quay lại"
        >
          <ArrowLeft size={20} color="#1A1A1A" />
        </Pressable>
        <Text className="flex-1 text-center font-bold text-headline-sm text-on-surface pr-9">
          Chính sách &amp; Điều khoản
        </Text>
      </View>

      {/* Segmented Tab */}
      <View className="flex-row p-2 bg-surface border-b border-surface-line gap-2">
        <Pressable
          onPress={() => setActiveTab('privacy')}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
            activeTab === 'privacy' ? 'bg-primary' : 'bg-surface-lowest'
          }`}
        >
          <Text
            className={`text-[12px] font-bold ${
              activeTab === 'privacy' ? 'text-white' : 'text-on-surface-variant'
            }`}
          >
            Bảo mật
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('terms')}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
            activeTab === 'terms' ? 'bg-primary' : 'bg-surface-lowest'
          }`}
        >
          <Text
            className={`text-[12px] font-bold ${
              activeTab === 'terms' ? 'text-white' : 'text-on-surface-variant'
            }`}
          >
            Điều khoản
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('return')}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
            activeTab === 'return' ? 'bg-primary' : 'bg-surface-lowest'
          }`}
        >
          <Text
            className={`text-[12px] font-bold ${
              activeTab === 'return' ? 'text-white' : 'text-on-surface-variant'
            }`}
          >
            Đổi trả &amp; May đo
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'privacy' && (
          <View className="gap-5">
            <View className="bg-surface p-5 rounded-2xl border border-surface-line shadow-sm">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-3">
                <Shield size={22} color="#5D1C34" />
              </View>
              <Text className="text-xl font-bold text-on-surface mb-2">Chính sách bảo mật</Text>
              <Text className="text-body-sm text-on-surface-variant leading-relaxed mb-4">
                FashionAI cam kết bảo vệ tuyệt đối dữ liệu cá nhân, số đo cơ thể và hình ảnh thử đồ của bạn theo các tiêu chuẩn bảo mật hiện đại.
              </Text>

              <View className="gap-2.5 pt-3 border-t border-surface-line">
                <View className="flex-row items-center gap-2">
                  <CheckCircle2 size={16} color="#059669" />
                  <Text className="text-body-sm text-on-surface font-medium">
                    Không lưu trữ thông tin thẻ, tài khoản ngân hàng
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <CheckCircle2 size={16} color="#059669" />
                  <Text className="text-body-sm text-on-surface font-medium">
                    Hình ảnh camera chỉ dùng tạo kết quả thử đồ
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <CheckCircle2 size={16} color="#059669" />
                  <Text className="text-body-sm text-on-surface font-medium">
                    Không bán dữ liệu người dùng cho bất kỳ bên thứ ba nào
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-surface p-5 rounded-2xl border border-surface-line shadow-sm gap-4">
              <Text className="text-headline-sm font-bold text-on-surface">1. Quyền truy cập thiết bị</Text>
              <Text className="text-body-sm text-on-surface-variant leading-relaxed">
                Ứng dụng chỉ yêu cầu quyền Camera và Thư viện ảnh khi bạn thực hiện các thao tác:
              </Text>
              <View className="pl-2 gap-2 text-body-sm">
                <Text className="text-body-sm text-on-surface">
                  • <Text className="font-semibold">Camera:</Text> Chụp ảnh selfie toàn thân cho tính năng Virtual Try-On và Live Try-On.
                </Text>
                <Text className="text-body-sm text-on-surface">
                  • <Text className="font-semibold">Thư viện ảnh:</Text> Chọn ảnh có sẵn để tải lên thử đồ hoặc đính kèm ảnh minh chứng báo sự cố đơn hàng.
                </Text>
              </View>
            </View>

            <View className="bg-surface p-5 rounded-2xl border border-surface-line shadow-sm gap-4">
              <Text className="text-headline-sm font-bold text-on-surface">2. Quản lý số đo cá nhân</Text>
              <Text className="text-body-sm text-on-surface-variant leading-relaxed">
                Số đo cơ thể được lưu trữ bảo mật trong hồ sơ của bạn và chỉ được gửi tới thợ may trong quy trình hoàn thiện trang phục may đo riêng. Bạn có thể cập nhật hoặc xóa bất cứ lúc nào trong mục Hồ sơ.
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'terms' && (
          <View className="gap-5">
            <View className="bg-surface p-5 rounded-2xl border border-surface-line shadow-sm">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-3">
                <FileText size={22} color="#5D1C34" />
              </View>
              <Text className="text-xl font-bold text-on-surface mb-2">Điều khoản dịch vụ</Text>
              <Text className="text-body-sm text-on-surface-variant leading-relaxed">
                Quy định sử dụng các dịch vụ đặt may theo yêu cầu, thanh toán trực tuyến và các tính năng AI Stylist, Virtual Try-On trên FashionAI.
              </Text>
            </View>

            <View className="bg-surface p-5 rounded-2xl border border-surface-line shadow-sm gap-3">
              <Text className="text-headline-sm font-bold text-on-surface">1. Tài khoản &amp; Trách nhiệm</Text>
              <Text className="text-body-sm text-on-surface-variant leading-relaxed">
                Người dùng chịu trách nhiệm bảo mật mật khẩu và độ chính xác của thông số số đo khi đặt đơn may đo riêng. Đơn hàng sẽ được may theo đúng thông số bạn đã xác nhận.
              </Text>
            </View>

            <View className="bg-surface p-5 rounded-2xl border border-surface-line shadow-sm gap-3">
              <Text className="text-headline-sm font-bold text-on-surface">2. Thanh toán &amp; Hạn mức AI</Text>
              <Text className="text-body-sm text-on-surface-variant leading-relaxed">
                Thanh toán được thực hiện an toàn qua cổng SePay hoặc ZaloPay. Hạn mức lượt dùng AI (Try-On, Stylist, Chatbot) được cấp theo gói dịch vụ (Free, Member, VIP) và tự động làm mới vào 00:00 (UTC+7) mỗi ngày.
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'return' && (
          <View className="gap-5">
            <View className="bg-surface p-5 rounded-2xl border border-surface-line shadow-sm">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-3">
                <RefreshCw size={22} color="#5D1C34" />
              </View>
              <Text className="text-xl font-bold text-on-surface mb-2">Chính sách Đổi trả &amp; Bảo hành</Text>
              <Text className="text-body-sm text-on-surface-variant leading-relaxed">
                Cam kết chất lượng may đo thủ công và quyền lợi tối đa cho khách hàng khi đặt may tại FashionAI.
              </Text>
            </View>

            <View className="bg-surface p-5 rounded-2xl border border-surface-line shadow-sm gap-3">
              <Text className="text-headline-sm font-bold text-on-surface">1. Đổi trả do lỗi kích thước</Text>
              <Text className="text-body-sm text-on-surface-variant leading-relaxed">
                Nếu sản phẩm may thực tế bị lệch quá 2cm so với số đo đã duyệt hoặc gặp lỗi chỉ may, chất liệu vải, bạn có quyền gửi yêu cầu "Báo sự cố" ngay trên màn hình chi tiết đơn hàng trong vòng 7 ngày kể từ khi nhận hàng.
              </Text>
            </View>

            <View className="bg-surface p-5 rounded-2xl border border-surface-line shadow-sm gap-3">
              <Text className="text-headline-sm font-bold text-on-surface">2. May lại hoặc hoàn tiền</Text>
              <Text className="text-body-sm text-on-surface-variant leading-relaxed">
                Bạn có thể lựa chọn đổi hàng 1-1 (xưởng sẽ may sản phẩm mới chuẩn thông số gửi lại miễn phí) hoặc hoàn trả 100% số tiền đơn hàng.
              </Text>
            </View>
          </View>
        )}

        {/* Contact Support Box */}
        <View className="mt-4 p-4 rounded-2xl bg-surface border border-surface-line">
          <Text className="text-label-md font-bold text-on-surface mb-2">Liên hệ hỗ trợ khách hàng</Text>
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Mail size={15} color="#5D1C34" />
              <Text className="text-body-sm text-on-surface">hotro@fashionai.vn</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Phone size={15} color="#5D1C34" />
              <Text className="text-body-sm text-on-surface">1900 8888 (08:00 - 21:00 hàng ngày)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
