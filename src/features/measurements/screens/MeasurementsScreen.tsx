import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Ruler } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { http } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { measurementsApi } from '@/features/measurements/api/measurements.api';

export function MeasurementsScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [isSaving, setIsSaving] = useState(false);
  
  const { data: fetchedMeasurements, isLoading: isFetching } = useQuery({
    queryKey: ['user-measurements'],
    queryFn: () => measurementsApi.getMeasurements(),
  });

  const [measurements, setMeasurements] = useState({
    height: '',
    weight: '',
    shoulder: '',
    chest: '',
    waist: '',
    hip: '',
    neck: '',
    sleeveLength: '',
    shirtLength: '',
    thigh: '',
    trouserLength: '',
    calf: '',
    inseam: '',
    underbust: '',
  });

  useEffect(() => {
    if (fetchedMeasurements) {
      setMeasurements({
        height: fetchedMeasurements.height?.toString() || '',
        weight: fetchedMeasurements.weight?.toString() || '',
        shoulder: fetchedMeasurements.shoulder?.toString() || '',
        chest: fetchedMeasurements.chest?.toString() || '',
        waist: fetchedMeasurements.waist?.toString() || '',
        hip: fetchedMeasurements.hip?.toString() || '',
        neck: fetchedMeasurements.neck?.toString() || '',
        sleeveLength: fetchedMeasurements.sleeveLength?.toString() || '',
        shirtLength: fetchedMeasurements.shirtLength?.toString() || '',
        thigh: fetchedMeasurements.thigh?.toString() || '',
        trouserLength: fetchedMeasurements.trouserLength?.toString() || '',
        calf: fetchedMeasurements.calf?.toString() || '',
        inseam: fetchedMeasurements.inseam?.toString() || '',
        underbust: fetchedMeasurements.underbust?.toString() || '',
      });
    }
  }, [fetchedMeasurements]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        height: parseFloat(measurements.height) || undefined,
        weight: parseFloat(measurements.weight) || undefined,
        shoulder: parseFloat(measurements.shoulder) || undefined,
        chest: parseFloat(measurements.chest) || undefined,
        waist: parseFloat(measurements.waist) || undefined,
        hip: parseFloat(measurements.hip) || undefined,
        neck: parseFloat(measurements.neck) || undefined,
        sleeveLength: parseFloat(measurements.sleeveLength) || undefined,
        shirtLength: parseFloat(measurements.shirtLength) || undefined,
        thigh: parseFloat(measurements.thigh) || undefined,
        trouserLength: parseFloat(measurements.trouserLength) || undefined,
        calf: parseFloat(measurements.calf) || undefined,
        inseam: parseFloat(measurements.inseam) || undefined,
        underbust: parseFloat(measurements.underbust) || undefined,
      };
      
      await http.put(ENDPOINTS.USERS.MEASUREMENTS, payload);
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ['measurements-completeness'] });
      await queryClient.invalidateQueries({ queryKey: ['user-measurements'] });
      
      Alert.alert('Thành công', 'Đã lưu số đo cơ thể', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const details = error.details ? JSON.stringify(error.details) : '';
      Alert.alert('Lỗi', 'Chưa thể lưu số đo. ' + (error.message || '') + (details ? `\nChi tiết: ${details}` : ''));
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (key: keyof typeof measurements, label: string) => (
    <View className="mb-4">
      <Text className="text-label-md text-on-surface-variant mb-2">{label}</Text>
      <TextInput 
        className="bg-surface-lowest px-4 py-3 rounded-lg text-body-lg text-on-surface font-semibold border border-surface-line"
        keyboardType="numeric"
        placeholder="cm"
        value={measurements[key]}
        onChangeText={(val) => setMeasurements(p => ({...p, [key]: val}))}
      />
    </View>
  );

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
          Số đo cơ thể
        </Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        {isFetching ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#5D1C34" />
            <Text className="mt-4 text-on-surface-variant">Đang tải số đo...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            <View className="flex-row items-center bg-surface p-4 rounded-xl mb-6 border border-surface-line">
            <Ruler size={20} color="#41051F" />
            <Text className="flex-1 ml-3 text-body-sm text-on-surface-variant">
              Điền các số đo bắt buộc theo loại trang phục bạn muốn đặt may. AI sẽ dùng thông tin này để tư vấn.
            </Text>
          </View>

          <View className="bg-white rounded-xl p-5 mb-4 border border-surface-line">
            <Text className="text-headline-sm font-bold text-on-surface mb-4">Cơ bản</Text>
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

          <View className="bg-white rounded-xl p-5 mb-4 border border-surface-line">
            <Text className="text-headline-sm font-bold text-on-surface mb-4">Thân trên</Text>
            {renderField('shoulder', 'Rộng vai (cm)')}
            {renderField('chest', 'Vòng ngực (cm)')}
            {renderField('underbust', 'Vòng chân ngực (cm, váy nữ)')}
            {renderField('waist', 'Vòng eo (cm)')}
            {renderField('neck', 'Vòng cổ (cm)')}
            {renderField('sleeveLength', 'Dài tay (cm)')}
            {renderField('shirtLength', 'Dài áo (cm)')}
          </View>
          
          <View className="bg-white rounded-xl p-5 mb-6 border border-surface-line">
            <Text className="text-headline-sm font-bold text-on-surface mb-4">Thân dưới</Text>
            {renderField('hip', 'Vòng mông (cm)')}
            {renderField('thigh', 'Vòng đùi (cm)')}
            {renderField('calf', 'Vòng bắp chân (cm)')}
            {renderField('trouserLength', 'Dài quần ngoài (Outseam) (cm)')}
            {renderField('inseam', 'Dài đũng quần (Inseam) (cm)')}
          </View>
        </ScrollView>
        )}
      </KeyboardAvoidingView>

      <View className="absolute bottom-0 left-0 right-0 p-4 bg-surface-lowest border-t border-surface-line">
        <Pressable 
          className="bg-primary py-4 rounded-xl flex-row justify-center items-center active:bg-primary-strong"
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text className="text-on-primary text-headline-sm font-bold">Lưu số đo</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
