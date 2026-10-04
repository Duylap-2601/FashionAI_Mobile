import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Ruler } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function MeasurementsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [measurements, setMeasurements] = useState({
    height: '165',
    weight: '55',
    chest: '85',
    waist: '64',
    hips: '92',
  });

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      <View className="flex-row items-center px-4 py-3 bg-surface-lowest border-b border-surface-line">
        <Pressable 
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 rounded-full active:bg-surface-line"
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="flex-1 text-center text-headline-sm text-on-surface">
          Số đo cơ thể
        </Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="flex-row items-center bg-surface p-4 rounded-xl mb-6 shadow-sm border border-surface-line">
            <Ruler size={20} color="#41051F" />
            <Text className="flex-1 ml-3 text-body-sm text-on-surface-variant">
              Dùng thước dây mềm, đo sát người nhưng không siết để AI gợi ý size chính xác nhất.
            </Text>
          </View>

          <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-surface-line">
            <Text className="text-headline-sm font-semibold text-on-surface mb-4">Tổng quan</Text>
            
            <View className="flex-row gap-4 mb-2">
              <View className="flex-1">
                <Text className="text-label-md text-on-surface-variant mb-2">Chiều cao (cm)</Text>
                <TextInput 
                  className="bg-surface-lowest px-4 py-3 rounded-lg text-body-lg text-on-surface font-semibold border border-surface-line"
                  keyboardType="numeric"
                  value={measurements.height}
                  onChangeText={(val) => setMeasurements(p => ({...p, height: val}))}
                />
              </View>
              <View className="flex-1">
                <Text className="text-label-md text-on-surface-variant mb-2">Cân nặng (kg)</Text>
                <TextInput 
                  className="bg-surface-lowest px-4 py-3 rounded-lg text-body-lg text-on-surface font-semibold border border-surface-line"
                  keyboardType="numeric"
                  value={measurements.weight}
                  onChangeText={(val) => setMeasurements(p => ({...p, weight: val}))}
                />
              </View>
            </View>
          </View>

          <View className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-surface-line">
            <Text className="text-headline-sm font-semibold text-on-surface mb-4">Chi tiết ba vòng</Text>
            
            <View className="space-y-4 gap-4">
              <View>
                <Text className="text-label-md text-on-surface-variant mb-2">Vòng ngực (cm)</Text>
                <TextInput 
                  className="bg-surface-lowest px-4 py-3 rounded-lg text-body-lg text-on-surface font-semibold border border-surface-line"
                  keyboardType="numeric"
                  value={measurements.chest}
                  onChangeText={(val) => setMeasurements(p => ({...p, chest: val}))}
                />
              </View>
              <View>
                <Text className="text-label-md text-on-surface-variant mb-2">Vòng eo (cm)</Text>
                <TextInput 
                  className="bg-surface-lowest px-4 py-3 rounded-lg text-body-lg text-on-surface font-semibold border border-surface-line"
                  keyboardType="numeric"
                  value={measurements.waist}
                  onChangeText={(val) => setMeasurements(p => ({...p, waist: val}))}
                />
              </View>
              <View>
                <Text className="text-label-md text-on-surface-variant mb-2">Vòng mông (cm)</Text>
                <TextInput 
                  className="bg-surface-lowest px-4 py-3 rounded-lg text-body-lg text-on-surface font-semibold border border-surface-line"
                  keyboardType="numeric"
                  value={measurements.hips}
                  onChangeText={(val) => setMeasurements(p => ({...p, hips: val}))}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="absolute bottom-0 left-0 right-0 p-4 bg-surface-lowest border-t border-surface-line shadow-hard-4">
        <Pressable 
          className="bg-primary py-4 rounded-xl flex-row justify-center items-center active:bg-primary-strong"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-on-primary text-headline-sm">Lưu số đo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
