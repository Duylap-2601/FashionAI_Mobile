import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Ruler,
  Shirt,
  Camera,
  Package,
  Pencil,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Info,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { measurementsApi } from '@/features/measurements/api/measurements.api';
import { usersApi } from '@/features/profile/api/users.api';
import { ProfileStackParamList } from '@/navigation/types';
import { COLORS } from '@/constants/theme';
import { BodyDiagram } from '../components/BodyDiagram';

type Tab = 'profile' | 'measurements' | 'sizes';
type BodyType = 'slim' | 'regular' | 'athletic' | 'plus';

interface FieldDef {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  desc: string;
  requiredFor?: string;
}

function isMeasurementFieldValid(field: FieldDef, value: string): boolean | null {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num >= field.min && num <= field.max;
}

interface MeasurementFieldProps {
  field: FieldDef;
  value: string;
  onChange: (id: string, value: string) => void;
  onHelp: (field: FieldDef) => void;
}

const MeasurementField = React.memo(function MeasurementField({
  field,
  value,
  onChange,
  onHelp,
}: MeasurementFieldProps) {
  const validStatus = isMeasurementFieldValid(field, value);

  return (
    <View className="mb-4">
      {/* Top Label Row */}
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center gap-1.5 flex-wrap">
          <Text className="text-[14px] font-bold text-[#1B1C1B]">{field.label}</Text>
          {field.requiredFor && (
            <View className="px-2 py-0.5 rounded-full bg-[#5D1C34]/10">
              <Text className="text-[10.5px] font-semibold text-[#5D1C34]">
                {field.requiredFor}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => onHelp(field)}
          className="p-1 rounded-full active:bg-[#F3EFEA]"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <HelpCircle size={15} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Input Container */}
      <View
        className={`h-12 flex-row items-center justify-between px-3.5 rounded-xl border ${
          validStatus === false
            ? 'border-[#DC2626] bg-[#FEF2F2]'
            : validStatus === true
            ? 'border-[#10B981] bg-white'
            : 'border-[#D1D5DB] bg-white'
        }`}
      >
        <TextInput
          value={value}
          onChangeText={(v) => onChange(field.id, v)}
          placeholder="—"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          className="flex-1 text-[15px] font-semibold text-[#1B1C1B] h-full"
        />
        <View className="flex-row items-center gap-1.5 pl-2">
          {validStatus === true && <CheckCircle2 size={16} color="#059669" />}
          {validStatus === false && <AlertCircle size={16} color="#DC2626" />}
          <Text className="text-[13px] font-medium text-[#6B7280]">{field.unit}</Text>
        </View>
      </View>

      {/* Helper / Range text */}
      <Text
        className={`text-[11.5px] mt-1 ${
          validStatus === false ? 'text-[#DC2626] font-medium' : 'text-[#9CA3AF]'
        }`}
      >
        {validStatus === false
          ? `Phải từ ${field.min}–${field.max} ${field.unit}`
          : `${field.min}–${field.max} ${field.unit}`}
      </Text>
    </View>
  );
});

const OVERVIEW_FIELD_DEFS: FieldDef[] = [
  { id: 'height', label: 'Chiều cao', unit: 'cm', min: 100, max: 250, desc: 'Từ gót chân đến đỉnh đầu', requiredFor: 'Bắt buộc tất cả' },
  { id: 'weight', label: 'Cân nặng', unit: 'kg', min: 30, max: 250, desc: 'Cân nặng cơ thể tính theo kilogam' },
];

const UPPER_FIELD_DEFS: FieldDef[] = [
  { id: 'shoulder', label: 'Rộng vai', unit: 'cm', min: 30, max: 80, desc: 'Từ đầu vai trái đến vai phải', requiredFor: 'Áo & Đồ liền' },
  { id: 'chest', label: 'Vòng ngực', unit: 'cm', min: 50, max: 200, desc: 'Vòng lớn nhất của ngực', requiredFor: 'Áo & Đồ liền' },
  { id: 'shirtLength', label: 'Dài thân áo', unit: 'cm', min: 50, max: 85, desc: 'Từ điểm vai đến lai áo', requiredFor: 'Áo & Đồ liền' },
  { id: 'sleeveLength', label: 'Dài tay áo', unit: 'cm', min: 45, max: 80, desc: 'Từ vai đến cổ tay', requiredFor: 'Áo' },
  { id: 'neck', label: 'Vòng cổ', unit: 'cm', min: 28, max: 55, desc: 'Vòng quanh cổ, cách cổ áo 2cm' },
  { id: 'underbust', label: 'Vòng ngực dưới', unit: 'cm', min: 55, max: 130, desc: 'Ngay dưới chân ngực (dành cho nữ)' },
  { id: 'wrist', label: 'Vòng cổ tay', unit: 'cm', min: 12, max: 25, desc: 'Vòng quanh khớp cổ tay' },
];

const LOWER_FIELD_DEFS: FieldDef[] = [
  { id: 'waist', label: 'Vòng eo', unit: 'cm', min: 50, max: 200, desc: 'Phần thắt nhỏ nhất của eo', requiredFor: 'Quần & Váy' },
  { id: 'hip', label: 'Vòng hông', unit: 'cm', min: 50, max: 200, desc: 'Vòng lớn nhất của mông', requiredFor: 'Quần & Váy' },
  { id: 'trouserLength', label: 'Dài quần', unit: 'cm', min: 80, max: 120, desc: 'Từ cạp xuống gấu quần', requiredFor: 'Quần & Váy' },
  { id: 'thigh', label: 'Vòng đùi', unit: 'cm', min: 35, max: 90, desc: 'Vòng lớn nhất của đùi', requiredFor: 'Quần & Váy' },
  { id: 'inseam', label: 'Dài đũng quần', unit: 'cm', min: 55, max: 95, desc: 'Từ đáy đũng quần đến mắt cá chân' },
  { id: 'knee', label: 'Vòng đầu gối', unit: 'cm', min: 25, max: 55, desc: 'Vòng quanh khớp đầu gối' },
  { id: 'calf', label: 'Vòng bắp chân', unit: 'cm', min: 25, max: 55, desc: 'Vòng lớn nhất của bắp chân' },
];

const ALL_MEASUREMENT_DEFS = [...OVERVIEW_FIELD_DEFS, ...UPPER_FIELD_DEFS, ...LOWER_FIELD_DEFS];

const MEASUREMENT_DEFS_BY_ID = new Map(ALL_MEASUREMENT_DEFS.map((f) => [f.id, f]));

const BODY_TYPES: { id: BodyType; label: string; desc: string }[] = [
  { id: 'slim', label: 'Mảnh mai', desc: 'Vai hẹp, eo thon' },
  { id: 'regular', label: 'Cân đối', desc: 'Tỷ lệ hài hòa' },
  { id: 'athletic', label: 'Thể thao', desc: 'Vai rộng, cơ bắp' },
  { id: 'plus', label: 'Plus size', desc: 'Dáng đầy đặn' },
];

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const TROUSER_SIZES = ['28', '29', '30', '31', '32', '33', '34', '36'];
const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

const SIZE_GUIDE: Record<string, { chest: string; waist: string; hip: string }> = {
  XS: { chest: '80–84', waist: '63–67', hip: '86–90' },
  S: { chest: '84–88', waist: '67–71', hip: '90–94' },
  M: { chest: '88–92', waist: '71–75', hip: '94–98' },
  L: { chest: '92–96', waist: '75–79', hip: '98–102' },
  XL: { chest: '96–100', waist: '79–83', hip: '102–106' },
  XXL: { chest: '100–106', waist: '83–89', hip: '106–112' },
  '3XL': { chest: '106–112', waist: '89–95', hip: '112–118' },
};

export function MeasurementsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'Measurements'>>();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>(route.params?.tab ?? 'measurements');
  const [activeHelpField, setActiveHelpField] = useState<FieldDef | null>(null);

  // Profile Form States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    birthday: (user as any)?.birthday || '',
    gender: ((user as any)?.gender || 'female') as 'female' | 'male' | 'other',
    job: (user as any)?.job || '',
    company: (user as any)?.company || '',
    address: (user as any)?.address || '',
    city: (user as any)?.city || '',
  });

  // Query measurements
  const { data: fetchedMeasurements } = useQuery({
    queryKey: ['user-measurements'],
    queryFn: () => measurementsApi.getMeasurements(),
  });

  // Query Try-On Quota
  const { data: tryOnQuota } = useQuery({
    queryKey: ['quota', 'TRY_ON'],
    queryFn: () => usersApi.getQuota('TRY_ON'),
  });

  // Measurements Form & BodyType States
  const [isSavingMeasurements, setIsSavingMeasurements] = useState(false);
  const [bodyType, setBodyType] = useState<BodyType>('regular');
  const [initialMeasurements, setInitialMeasurements] = useState<Record<string, string>>({});
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [measurements, setMeasurements] = useState<Record<string, string>>({
    height: '',
    weight: '',
    shoulder: '',
    chest: '',
    shirtLength: '',
    sleeveLength: '',
    neck: '',
    underbust: '',
    wrist: '',
    waist: '',
    hip: '',
    trouserLength: '',
    thigh: '',
    inseam: '',
    knee: '',
    calf: '',
  });

  const [selectedShirt, setSelectedShirt] = useState('M');
  const [selectedTrouser, setSelectedTrouser] = useState('30');
  const [selectedShoe, setSelectedShoe] = useState('38');
  const [fitPreference, setFitPreference] = useState<'slim' | 'regular' | 'relaxed'>('regular');
  const [styleNote, setStyleNote] = useState('');

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        birthday: (user as any)?.birthday || '',
        gender: ((user as any)?.gender || 'female') as 'female' | 'male' | 'other',
        job: (user as any)?.job || '',
        company: (user as any)?.company || '',
        address: (user as any)?.address || '',
        city: (user as any)?.city || '',
      });
    }
  }, [user]);

  const prefillDone = useRef(false);

  useEffect(() => {
    if (prefillDone.current) return;
    if (fetchedMeasurements) {
      prefillDone.current = true;
      const formatted: Record<string, string> = {
        height: fetchedMeasurements.height != null ? String(fetchedMeasurements.height) : '',
        weight: fetchedMeasurements.weight != null ? String(fetchedMeasurements.weight) : '',
        shoulder: fetchedMeasurements.shoulder != null ? String(fetchedMeasurements.shoulder) : '',
        chest: fetchedMeasurements.chest != null ? String(fetchedMeasurements.chest) : '',
        shirtLength: (fetchedMeasurements.shirtLength ?? (fetchedMeasurements as any).bodyLength) != null
          ? String(fetchedMeasurements.shirtLength ?? (fetchedMeasurements as any).bodyLength)
          : '',
        sleeveLength: fetchedMeasurements.sleeveLength != null ? String(fetchedMeasurements.sleeveLength) : '',
        neck: fetchedMeasurements.neck != null ? String(fetchedMeasurements.neck) : '',
        underbust: fetchedMeasurements.underbust != null ? String(fetchedMeasurements.underbust) : '',
        wrist: (fetchedMeasurements as any).wrist != null ? String((fetchedMeasurements as any).wrist) : '',
        waist: fetchedMeasurements.waist != null ? String(fetchedMeasurements.waist) : '',
        hip: (fetchedMeasurements.hip ?? fetchedMeasurements.hips) != null
          ? String(fetchedMeasurements.hip ?? fetchedMeasurements.hips)
          : '',
        trouserLength: (fetchedMeasurements.trouserLength ?? fetchedMeasurements.outseam) != null
          ? String(fetchedMeasurements.trouserLength ?? fetchedMeasurements.outseam)
          : '',
        thigh: fetchedMeasurements.thigh != null ? String(fetchedMeasurements.thigh) : '',
        inseam: fetchedMeasurements.inseam != null ? String(fetchedMeasurements.inseam) : '',
        knee: (fetchedMeasurements as any).knee != null ? String((fetchedMeasurements as any).knee) : '',
        calf: fetchedMeasurements.calf != null ? String(fetchedMeasurements.calf) : '',
      };
      setInitialMeasurements(formatted);
      setMeasurements(formatted);
      if (fetchedMeasurements.bodyType) {
        setBodyType(fetchedMeasurements.bodyType as BodyType);
      }
    }
  }, [fetchedMeasurements]);

  const deferredMeasurements = useDeferredValue(measurements);

  const isMeasurementsDirty = useMemo(() => {
    return ALL_MEASUREMENT_DEFS.some(
      (f) => (measurements[f.id] || '') !== (initialMeasurements[f.id] || '')
    );
  }, [measurements, initialMeasurements]);

  const bannerVisible = isMeasurementsDirty && activeTab === 'measurements';

  const handleMeasurementChange = useCallback((id: string, value: string) => {
    setMeasurements((p) => ({ ...p, [id]: value }));
  }, []);

  const handleHelpField = useCallback((field: FieldDef) => {
    setActiveHelpField(field);
  }, []);

  // Có field nào đã nhập mà vượt khoảng hợp lệ → nút Lưu trên banner bị mờ,
  // tránh gửi số đo sai để BE trả lỗi.
  const hasInvalidMeasurements = useMemo(
    () =>
      Object.entries(measurements).some(([id, v]) => {
        if (!v || v.trim() === '') return false;
        const def = MEASUREMENT_DEFS_BY_ID.get(id);
        if (!def) return false;
        const num = parseFloat(v);
        return isNaN(num) || num < def.min || num > def.max;
      }),
    [measurements]
  );

  // Toast "Đã lưu số đo cơ thể thành công!" tự ẩn sau 3.5s, có nút X tắt ngay.
  useEffect(() => {
    if (!showSavedToast) return;
    const timer = setTimeout(() => setShowSavedToast(false), 3500);
    return () => clearTimeout(timer);
  }, [showSavedToast]);

  // Handle Save Profile
  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      await usersApi.updateMe({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || undefined,
        birthday: profileForm.birthday.trim() || undefined,
        gender: profileForm.gender,
        job: profileForm.job.trim() || undefined,
        company: profileForm.company.trim() || undefined,
        address: profileForm.address.trim() || undefined,
        city: profileForm.city.trim() || undefined,
      });
      await refreshUser();
      setIsEditingProfile(false);
      Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật.');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể lưu thông tin. Vui lòng thử lại.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Save Measurements
  const handleSaveMeasurements = async () => {
    if (hasInvalidMeasurements) {
      Alert.alert('Chưa hợp lệ', 'Vui lòng kiểm tra lại các số đo nằm ngoài khoảng cho phép.');
      return;
    }
    try {
      setIsSavingMeasurements(true);
      const snapshot = { ...measurements };
      const payload: Record<string, any> = {};
      Object.entries(snapshot).forEach(([k, v]) => {
        if (v && v.trim() !== '' && !isNaN(parseFloat(v))) {
          payload[k] = parseFloat(v);
        }
      });

      // Đồng bộ aliases để tương thích 100% với backend & web
      if (payload.shirtLength !== undefined) payload.bodyLength = payload.shirtLength;
      if (payload.trouserLength !== undefined) payload.outseam = payload.trouserLength;

      await measurementsApi.update(payload as any);
      setInitialMeasurements(snapshot);
      setShowSavedToast(true);

      // Invalidate và refresh ở background (không chặn UI để tránh đơ app)
      void refreshUser();
      void queryClient.invalidateQueries({ queryKey: ['user-measurements'] });
      void queryClient.invalidateQueries({ queryKey: ['measurements-completeness'] });
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Chưa thể lưu số đo.');
    } finally {
      setIsSavingMeasurements(false);
    }
  };

  const tier = (user?.tier || 'FREE').toUpperCase();
  const tierLabel = tier === 'VIP' ? 'VIP MEMBER' : tier === 'MEMBER' ? 'GOLD MEMBER' : 'FREE ACCOUNT';
  const avatarInitial = (user?.name || 'U').charAt(0).toUpperCase();

  const quotaUsed = tryOnQuota?.used ?? 0;
  const quotaLimit = tryOnQuota?.limit ?? 0;
  const quotaPct = quotaLimit > 0 ? Math.min(100, Math.round((quotaUsed / quotaLimit) * 100)) : 100;

  return (
    <View className="flex-1 bg-[#FBF9F7]">
      <AppHeader />

      {/* ── Toast "Đã lưu số đo cơ thể thành công!" (Floating Overlay) ── */}
      {showSavedToast && (
        <View
          style={{ top: insets.top + 60 }}
          className="absolute left-4 right-4 z-50 flex-row items-center gap-2.5 rounded-2xl border border-success/40 bg-white px-4 py-3 shadow-xl"
        >
          <CheckCircle2 size={18} color={COLORS.success} />
          <Text className="flex-1 text-sm font-semibold text-[#10B981]" numberOfLines={1}>
            Đã lưu số đo cơ thể thành công!
          </Text>
          <TouchableOpacity
            accessibilityLabel="Đóng thông báo"
            onPress={() => setShowSavedToast(false)}
            className="min-h-9 min-w-9 items-center justify-center rounded-full active:bg-[#F3F4F6]"
          >
            <X size={16} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Scrollable Body ── */}
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: bannerVisible ? 110 : 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Heading ── */}
        <BackButton onPress={() => navigation.goBack()} />
        <Text className="mb-1 text-[26px] font-bold text-[#5D1C34]">Hồ sơ & Số đo</Text>
        <Text className="mb-5 text-[13px] text-[#6B7280]">
          Quản lý thông tin cá nhân và số đo cơ thể của bạn
        </Text>

        {/* ── User Profile Card ── */}
        <View className="bg-white rounded-3xl border border-[#ECE8E3] p-6 items-center shadow-sm mb-4">
          <View className="w-16 h-16 rounded-full bg-[#5D1C34] items-center justify-center overflow-hidden mb-3 shadow-xs">
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Text className="text-[24px] font-bold text-white">{avatarInitial}</Text>
            )}
          </View>
          <Text className="text-[17px] font-bold text-[#1B1C1B]">{user?.name || 'Người dùng'}</Text>
          <Text className="text-[13px] text-[#6B7280] mt-0.5">{user?.email}</Text>
          <View className="mt-3 px-3.5 py-1 rounded-full bg-[#EFECE6] border border-[#E5DFD5]">
            <Text className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              {tierLabel}
            </Text>
          </View>
        </View>

        {/* ── Sub-Tab Navigation Menu ── */}
        <View className="bg-white rounded-3xl border border-[#ECE8E3] p-2 shadow-sm mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="flex-row items-center gap-3 px-3.5 py-3 rounded-xl active:bg-[#F9FAFB]"
          >
            <User size={18} color="#4B5563" />
            <Text className="text-[13.5px] font-semibold text-[#4B5563]">Tổng quan hồ sơ</Text>
          </TouchableOpacity>

          <View className="h-px bg-[#F3F4F6] my-1" />

          {/* Tab 1: Profile */}
          <TouchableOpacity
            onPress={() => setActiveTab('profile')}
            className={`relative flex-row items-center gap-3 px-3.5 py-3 rounded-xl ${
              activeTab === 'profile' ? 'bg-[#5D1C34]/10' : 'active:bg-[#F9FAFB]'
            }`}
          >
            {activeTab === 'profile' && (
              <View className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#5D1C34] rounded-r-full" />
            )}
            <User size={18} color={activeTab === 'profile' ? '#5D1C34' : '#4B5563'} />
            <Text
              className={`text-[13.5px] ${
                activeTab === 'profile' ? 'font-bold text-[#5D1C34]' : 'font-semibold text-[#4B5563]'
              }`}
            >
              Thông tin cá nhân
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Measurements */}
          <TouchableOpacity
            onPress={() => setActiveTab('measurements')}
            className={`relative flex-row items-center gap-3 px-3.5 py-3 rounded-xl ${
              activeTab === 'measurements' ? 'bg-[#5D1C34]/10' : 'active:bg-[#F9FAFB]'
            }`}
          >
            {activeTab === 'measurements' && (
              <View className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#5D1C34] rounded-r-full" />
            )}
            <Ruler size={18} color={activeTab === 'measurements' ? '#5D1C34' : '#4B5563'} />
            <Text
              className={`text-[13.5px] ${
                activeTab === 'measurements'
                  ? 'font-bold text-[#5D1C34]'
                  : 'font-semibold text-[#4B5563]'
              }`}
            >
              Số đo cơ thể
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Sizes */}
          <TouchableOpacity
            onPress={() => setActiveTab('sizes')}
            className={`relative flex-row items-center gap-3 px-3.5 py-3 rounded-xl ${
              activeTab === 'sizes' ? 'bg-[#5D1C34]/10' : 'active:bg-[#F9FAFB]'
            }`}
          >
            {activeTab === 'sizes' && (
              <View className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#5D1C34] rounded-r-full" />
            )}
            <Shirt size={18} color={activeTab === 'sizes' ? '#5D1C34' : '#4B5563'} />
            <Text
              className={`text-[13.5px] ${
                activeTab === 'sizes' ? 'font-bold text-[#5D1C34]' : 'font-semibold text-[#4B5563]'
              }`}
            >
              Cỡ tham khảo
            </Text>
          </TouchableOpacity>

          <View className="h-px bg-[#F3F4F6] my-1" />

          {/* History */}
          <TouchableOpacity
            onPress={() => navigation.navigate('TryOnHistory')}
            className="flex-row items-center gap-3 px-3.5 py-3 rounded-xl active:bg-[#F9FAFB]"
          >
            <Camera size={18} color="#4B5563" />
            <Text className="text-[13.5px] font-semibold text-[#4B5563]">Lịch sử Try-On</Text>
          </TouchableOpacity>

          {/* Orders */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Orders')}
            className="flex-row items-center gap-3 px-3.5 py-3 rounded-xl active:bg-[#F9FAFB]"
          >
            <Package size={18} color="#4B5563" />
            <Text className="text-[13.5px] font-semibold text-[#4B5563]">Đơn hàng</Text>
          </TouchableOpacity>
        </View>

        {/* ── Quota Mini Card ("TRY-ON HÔM NAY") ── */}
        <View className="bg-white rounded-3xl border border-[#ECE8E3] p-4 shadow-sm mb-4">
          <Text className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
            TRY-ON HÔM NAY
          </Text>
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-[13px] text-[#374151]">Đã dùng</Text>
            <Text className="text-[14px] font-bold text-[#5D1C34]">
              {quotaUsed} / {quotaLimit} lượt
            </Text>
          </View>
          <View className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden my-1">
            <View className="h-full bg-[#5D1C34] rounded-full" style={{ width: `${quotaPct}%` }} />
          </View>
          <Text className="text-[11px] text-[#9CA3AF] mt-1">Reset lúc 00:00 hằng ngày</Text>
        </View>

        {/* ─────────────────── TAB 1: THÔNG TIN CÁ NHÂN ─────────────────── */}
        {activeTab === 'profile' && (
          <View className="bg-white rounded-3xl border border-[#ECE8E3] p-6 shadow-sm mb-6">
            <View className="flex-row items-center justify-between pb-4 border-b border-[#F3F4F6] mb-5">
              <View>
                <Text className="text-[20px] font-bold text-[#1B1C1B]">Thông tin cá nhân</Text>
                <Text className="text-[13px] text-[#6B7280] mt-0.5">
                  Thông tin hiển thị và dùng cho đơn hàng
                </Text>
              </View>
              {!isEditingProfile ? (
                <TouchableOpacity
                  onPress={() => setIsEditingProfile(true)}
                  className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D1D5DB] active:bg-[#F9FAFB]"
                >
                  <Pencil size={13} color="#4B5563" />
                  <Text className="text-[12px] font-semibold text-[#4B5563]">Chỉnh sửa</Text>
                </TouchableOpacity>
              ) : (
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setIsEditingProfile(false)}
                    className="px-3 py-1.5 rounded-xl border border-[#D1D5DB]"
                  >
                    <Text className="text-[12px] font-semibold text-[#4B5563]">Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-[#5D1C34]"
                  >
                    {isSavingProfile ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Check size={13} color="#FFFFFF" />
                        <Text className="text-[12px] font-semibold text-white">Lưu</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Section 1: Thông tin cơ bản */}
            <View className="mb-6">
              <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-[14px] font-bold text-[#1B1C1B]">Thông tin cơ bản</Text>
                <View className="flex-1 h-px bg-[#ECE8E3]" />
              </View>

              <View className="py-2.5 border-b border-[#F3F4F6]">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <User size={13} color="#6B7280" />
                  <Text className="text-[12px] text-[#6B7280]">Họ và tên</Text>
                </View>
                {isEditingProfile ? (
                  <TextInput
                    value={profileForm.name}
                    onChangeText={(val) => setProfileForm((p) => ({ ...p, name: val }))}
                    className="h-10 px-3 border border-[#D1D5DB] rounded-xl text-[14px] text-[#1B1C1B] bg-white"
                  />
                ) : (
                  <Text className="text-[14px] font-semibold text-[#1B1C1B]">
                    {profileForm.name || '—'}
                  </Text>
                )}
              </View>

              <View className="py-2.5 border-b border-[#F3F4F6]">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Phone size={13} color="#6B7280" />
                  <Text className="text-[12px] text-[#6B7280]">Số điện thoại</Text>
                </View>
                {isEditingProfile ? (
                  <TextInput
                    value={profileForm.phone}
                    onChangeText={(val) => setProfileForm((p) => ({ ...p, phone: val }))}
                    keyboardType="phone-pad"
                    className="h-10 px-3 border border-[#D1D5DB] rounded-xl text-[14px] text-[#1B1C1B] bg-white"
                  />
                ) : (
                  <Text className="text-[14px] text-[#1B1C1B]">{profileForm.phone || '—'}</Text>
                )}
              </View>

              <View className="py-2.5 border-b border-[#F3F4F6]">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Mail size={13} color="#6B7280" />
                  <Text className="text-[12px] text-[#6B7280]">Email (Không thể thay đổi)</Text>
                </View>
                <Text className="text-[14px] text-[#1B1C1B]">{profileForm.email}</Text>
              </View>

              <View className="py-2.5 border-b border-[#F3F4F6]">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Calendar size={13} color="#6B7280" />
                  <Text className="text-[12px] text-[#6B7280]">Ngày sinh</Text>
                </View>
                {isEditingProfile ? (
                  <TextInput
                    value={profileForm.birthday}
                    onChangeText={(val) => setProfileForm((p) => ({ ...p, birthday: val }))}
                    placeholder="YYYY-MM-DD"
                    className="h-10 px-3 border border-[#D1D5DB] rounded-xl text-[14px] text-[#1B1C1B] bg-white"
                  />
                ) : (
                  <Text className="text-[14px] text-[#1B1C1B]">{profileForm.birthday || '—'}</Text>
                )}
              </View>

              <View className="pt-2.5">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <User size={13} color="#6B7280" />
                  <Text className="text-[12px] text-[#6B7280]">Giới tính</Text>
                </View>
                <View className="flex-row gap-2.5">
                  {(
                    [
                      { id: 'female', label: 'Nữ' },
                      { id: 'male', label: 'Nam' },
                      { id: 'other', label: 'Khác' },
                    ] as const
                  ).map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      disabled={!isEditingProfile}
                      onPress={() => setProfileForm((p) => ({ ...p, gender: opt.id }))}
                      className={`px-5 py-2 rounded-xl border ${
                        profileForm.gender === opt.id
                          ? 'bg-[#5D1C34] border-[#5D1C34]'
                          : 'bg-white border-[#D1D5DB]'
                      }`}
                    >
                      <Text
                        className={`text-[13px] font-semibold ${
                          profileForm.gender === opt.id ? 'text-white' : 'text-[#4B5563]'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Section 2: Nghề nghiệp */}
            <View className="mb-6">
              <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-[14px] font-bold text-[#1B1C1B]">Nghề nghiệp</Text>
                <View className="flex-1 h-px bg-[#ECE8E3]" />
              </View>

              <View className="py-2.5 border-b border-[#F3F4F6]">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <User size={13} color="#6B7280" />
                  <Text className="text-[12px] text-[#6B7280]">Chức danh</Text>
                </View>
                {isEditingProfile ? (
                  <TextInput
                    value={profileForm.job}
                    onChangeText={(val) => setProfileForm((p) => ({ ...p, job: val }))}
                    placeholder="Chức danh công việc"
                    className="h-10 px-3 border border-[#D1D5DB] rounded-xl text-[14px] text-[#1B1C1B] bg-white"
                  />
                ) : (
                  <Text className="text-[14px] text-[#1B1C1B]">{profileForm.job || '—'}</Text>
                )}
              </View>

              <View className="py-2.5 border-b border-[#F3F4F6]">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <User size={13} color="#6B7280" />
                  <Text className="text-[12px] text-[#6B7280]">Công ty</Text>
                </View>
                {isEditingProfile ? (
                  <TextInput
                    value={profileForm.company}
                    onChangeText={(val) => setProfileForm((p) => ({ ...p, company: val }))}
                    placeholder="Tên công ty"
                    className="h-10 px-3 border border-[#D1D5DB] rounded-xl text-[14px] text-[#1B1C1B] bg-white"
                  />
                ) : (
                  <Text className="text-[14px] text-[#1B1C1B]">{profileForm.company || '—'}</Text>
                )}
              </View>
            </View>

            {/* Section 3: Địa chỉ giao hàng */}
            <View className="mb-2">
              <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-[14px] font-bold text-[#1B1C1B]">Địa chỉ giao hàng</Text>
                <View className="flex-1 h-px bg-[#ECE8E3]" />
              </View>

              <View className="py-2.5 border-b border-[#F3F4F6]">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <MapPin size={13} color="#6B7280" />
                  <Text className="text-[12px] text-[#6B7280]">Địa chỉ</Text>
                </View>
                {isEditingProfile ? (
                  <TextInput
                    value={profileForm.address}
                    onChangeText={(val) => setProfileForm((p) => ({ ...p, address: val }))}
                    placeholder="Số nhà, tên đường..."
                    className="h-10 px-3 border border-[#D1D5DB] rounded-xl text-[14px] text-[#1B1C1B] bg-white"
                  />
                ) : (
                  <Text className="text-[14px] text-[#1B1C1B]">{profileForm.address || '—'}</Text>
                )}
              </View>

              <View className="py-2.5">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <MapPin size={13} color="#6B7280" />
                  <Text className="text-[12px] text-[#6B7280]">Tỉnh / Thành phố</Text>
                </View>
                {isEditingProfile ? (
                  <TextInput
                    value={profileForm.city}
                    onChangeText={(val) => setProfileForm((p) => ({ ...p, city: val }))}
                    placeholder="Tỉnh hoặc Thành phố"
                    className="h-10 px-3 border border-[#D1D5DB] rounded-xl text-[14px] text-[#1B1C1B] bg-white"
                  />
                ) : (
                  <Text className="text-[14px] text-[#1B1C1B]">{profileForm.city || '—'}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ─────────────────── TAB 2: SỐ ĐO CƠ THỂ ─────────────────── */}
        {activeTab === 'measurements' && (
          <View>
            {/* Info Banner */}
            <View className="flex-row items-start gap-2.5 p-3.5 bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl mb-4">
              <Info size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
              <Text className="text-[12.5px] text-[#1E40AF] leading-4.5 flex-1">
                Dùng thước dây mềm, đo sát người nhưng không siết. Nhờ người khác đo giúp sẽ cho kết quả chính xác hơn.
              </Text>
            </View>

            {/* Main Card */}
            <View className="bg-white rounded-3xl border border-[#ECE8E3] p-5 shadow-sm mb-6">
              <View className="pb-4 border-b border-[#F3F4F6] mb-5">
                <Text className="text-[20px] font-bold text-[#1B1C1B]">Số đo cơ thể</Text>
                <Text className="text-[13px] text-[#6B7280] mt-0.5">
                  Giúp AI thử đồ chính xác và gợi ý size phù hợp
                </Text>
              </View>

              {/* Mannequin Vector Diagram */}
              <View className="bg-[#FAF8F5] rounded-2xl border border-[#ECE8E3] p-4 mb-6">
                <BodyDiagram values={deferredMeasurements} gender={profileForm.gender} />
              </View>

              {/* Section 1: Tổng quan */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-[15px] font-bold text-[#1B1C1B]">Tổng quan</Text>
                  <View className="flex-1 h-px bg-[#ECE8E3]" />
                </View>
                <Text className="text-[12px] text-[#6B7280] mb-3.5">
                  Thông tin cơ bản về cơ thể
                </Text>

                {OVERVIEW_FIELD_DEFS.map((f) => (
                  <MeasurementField
                    key={f.id}
                    field={f}
                    value={measurements[f.id] || ''}
                    onChange={handleMeasurementChange}
                    onHelp={handleHelpField}
                  />
                ))}

                {/* Sub-Section: Dáng người */}
                <View className="mt-2 mb-2">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-[15px] font-bold text-[#1B1C1B]">Dáng người</Text>
                    <View className="flex-1 h-px bg-[#ECE8E3]" />
                  </View>
                  <Text className="text-[12px] text-[#6B7280] mb-3">
                    Giúp AI tối ưu kết quả thử đồ
                  </Text>
                  <View className="flex-row flex-wrap gap-2.5">
                    {BODY_TYPES.map((bt) => {
                      const isSelected = bodyType === bt.id;
                      return (
                        <TouchableOpacity
                          key={bt.id}
                          onPress={() => setBodyType(bt.id)}
                          className={`w-[48%] p-3.5 rounded-2xl border items-center text-center ${
                            isSelected
                              ? 'border-2 border-[#5D1C34] bg-[#5D1C34]/5'
                              : 'border border-[#E5E7EB] bg-white'
                          }`}
                        >
                          <Text
                            className={`text-[13.5px] font-bold ${
                              isSelected ? 'text-[#5D1C34]' : 'text-[#1B1C1B]'
                            }`}
                          >
                            {bt.label}
                          </Text>
                          <Text className="text-[11px] text-[#6B7280] mt-0.5 text-center">
                            {bt.desc}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Section 2: Thân trên */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-[15px] font-bold text-[#1B1C1B]">Thân trên</Text>
                  <View className="flex-1 h-px bg-[#ECE8E3]" />
                </View>
                <Text className="text-[12px] text-[#6B7280] mb-3.5">
                  Áo sơ mi, blazer, vest
                </Text>

                {UPPER_FIELD_DEFS.map((f) => (
                  <MeasurementField
                    key={f.id}
                    field={f}
                    value={measurements[f.id] || ''}
                    onChange={handleMeasurementChange}
                    onHelp={handleHelpField}
                  />
                ))}
              </View>

              {/* Section 3: Thân dưới */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-[15px] font-bold text-[#1B1C1B]">Thân dưới</Text>
                  <View className="flex-1 h-px bg-[#ECE8E3]" />
                </View>
                <Text className="text-[12px] text-[#6B7280] mb-3.5">
                  Quần tây, chân váy
                </Text>

                {LOWER_FIELD_DEFS.map((f) => (
                  <MeasurementField
                    key={f.id}
                    field={f}
                    value={measurements[f.id] || ''}
                    onChange={handleMeasurementChange}
                    onHelp={handleHelpField}
                  />
                ))}
              </View>

              {/* Bottom Action Button: Lưu số đo */}
              <TouchableOpacity
                onPress={handleSaveMeasurements}
                disabled={hasInvalidMeasurements || isSavingMeasurements || !isMeasurementsDirty}
                className={`w-full py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${
                  isMeasurementsDirty && !hasInvalidMeasurements && !isSavingMeasurements
                    ? 'bg-[#5D1C34] active:bg-[#5D1C34]/90 shadow-sm'
                    : 'bg-[#EFECE6]'
                }`}
              >
                {isSavingMeasurements ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save
                      size={16}
                      color={isMeasurementsDirty && !hasInvalidMeasurements ? '#FFFFFF' : '#6B7280'}
                    />
                    <Text
                      className={`text-[14px] font-bold ${
                        isMeasurementsDirty && !hasInvalidMeasurements ? 'text-white' : 'text-[#6B7280]'
                      }`}
                    >
                      {hasInvalidMeasurements ? 'Số đo chưa hợp lệ' : 'Lưu số đo'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─────────────────── TAB 3: CỠ THAM KHẢO ─────────────────── */}
        {activeTab === 'sizes' && (
          <View className="bg-white rounded-3xl border border-[#ECE8E3] p-6 shadow-sm mb-6">
            <View className="pb-4 border-b border-[#F3F4F6] mb-5">
              <Text className="text-[20px] font-bold text-[#1B1C1B]">Cỡ tham khảo</Text>
              <Text className="text-[13px] text-[#6B7280] mt-0.5">
                Kết hợp với số đo để gợi ý size chính xác hơn
              </Text>
            </View>

            {/* Size Áo */}
            <View className="mb-6">
              <Text className="text-[14px] font-bold text-[#1B1C1B] mb-0.5">Size áo</Text>
              <Text className="text-[12px] text-[#6B7280] mb-3">Áo sơ mi, blazer, vest</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {SHIRT_SIZES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSelectedShirt(s)}
                    className={`px-4 py-2 rounded-xl border ${
                      selectedShirt === s
                        ? 'bg-[#5D1C34] border-[#5D1C34]'
                        : 'bg-white border-[#D1D5DB]'
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        selectedShirt === s ? 'text-white' : 'text-[#4B5563]'
                      }`}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {SIZE_GUIDE[selectedShirt] && (
                <View className="flex-row items-center justify-around p-3.5 bg-[#5D1C34]/5 rounded-2xl border border-[#5D1C34]/15">
                  <View className="items-center">
                    <Text className="text-[11px] text-[#6B7280]">Vòng ngực</Text>
                    <Text className="text-[13px] font-bold text-[#5D1C34] mt-0.5">
                      {SIZE_GUIDE[selectedShirt].chest} cm
                    </Text>
                  </View>
                  <View className="w-px h-6 bg-[#D1D5DB]" />
                  <View className="items-center">
                    <Text className="text-[11px] text-[#6B7280]">Vòng eo</Text>
                    <Text className="text-[13px] font-bold text-[#5D1C34] mt-0.5">
                      {SIZE_GUIDE[selectedShirt].waist} cm
                    </Text>
                  </View>
                  <View className="w-px h-6 bg-[#D1D5DB]" />
                  <View className="items-center">
                    <Text className="text-[11px] text-[#6B7280]">Vòng hông</Text>
                    <Text className="text-[13px] font-bold text-[#5D1C34] mt-0.5">
                      {SIZE_GUIDE[selectedShirt].hip} cm
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Kiểu dáng ưa thích */}
            <View className="mb-6">
              <Text className="text-[14px] font-bold text-[#1B1C1B] mb-0.5">Kiểu dáng ưa thích</Text>
              <Text className="text-[12px] text-[#6B7280] mb-3">Ảnh hưởng đến gợi ý size</Text>
              <View className="flex-row gap-2.5">
                {(
                  [
                    { id: 'slim', label: 'Slim Fit', desc: 'Ôm sát người' },
                    { id: 'regular', label: 'Regular Fit', desc: 'Vừa vặn chuẩn' },
                    { id: 'relaxed', label: 'Relaxed Fit', desc: 'Rộng thoải mái' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setFitPreference(opt.id)}
                    className={`flex-1 p-3 rounded-2xl border items-center text-center ${
                      fitPreference === opt.id
                        ? 'border-[#5D1C34] bg-[#5D1C34]/10'
                        : 'border-[#E5E7EB] bg-white'
                    }`}
                  >
                    <Text
                      className={`text-[12.5px] font-bold ${
                        fitPreference === opt.id ? 'text-[#5D1C34]' : 'text-[#1B1C1B]'
                      }`}
                    >
                      {opt.label}
                    </Text>
                    <Text className="text-[10.5px] text-[#6B7280] mt-0.5 text-center">
                      {opt.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Size Quần */}
            <View className="mb-6">
              <Text className="text-[14px] font-bold text-[#1B1C1B] mb-0.5">Size quần</Text>
              <Text className="text-[12px] text-[#6B7280] mb-3">
                Quần tây, quần âu (số inch eo)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {TROUSER_SIZES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSelectedTrouser(s)}
                    className={`px-4 py-2 rounded-xl border ${
                      selectedTrouser === s
                        ? 'bg-[#5D1C34] border-[#5D1C34]'
                        : 'bg-white border-[#D1D5DB]'
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        selectedTrouser === s ? 'text-white' : 'text-[#4B5563]'
                      }`}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Size Giày */}
            <View className="mb-6">
              <Text className="text-[14px] font-bold text-[#1B1C1B] mb-0.5">Cỡ giày</Text>
              <Text className="text-[12px] text-[#6B7280] mb-3">Cỡ Việt Nam</Text>
              <View className="flex-row flex-wrap gap-2">
                {SHOE_SIZES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSelectedShoe(s)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      selectedShoe === s
                        ? 'bg-[#5D1C34] border-[#5D1C34]'
                        : 'bg-white border-[#D1D5DB]'
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        selectedShoe === s ? 'text-white' : 'text-[#4B5563]'
                      }`}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Ghi chú phong cách */}
            <View className="mb-6">
              <Text className="text-[14px] font-bold text-[#1B1C1B] mb-0.5">Ghi chú phong cách</Text>
              <Text className="text-[12px] text-[#6B7280] mb-3">
                Yêu cầu đặc biệt khi mua hoặc gợi ý
              </Text>
              <TextInput
                multiline
                numberOfLines={3}
                placeholder="Ví dụ: Thích màu trung tính, không dùng vải len, ưu tiên chất liệu thoáng mát..."
                placeholderTextColor="#9CA3AF"
                value={styleNote}
                onChangeText={setStyleNote}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
                className="w-full px-4 py-3 rounded-2xl border border-[#D1D5DB] text-[13.5px] text-[#1B1C1B] bg-white"
              />
            </View>

            {/* Save Sizes Button */}
            <TouchableOpacity
              onPress={() => Alert.alert('Thành công', 'Đã lưu thông tin cỡ tham khảo.')}
              className="self-start px-6 py-3 rounded-2xl bg-[#5D1C34] items-center justify-center flex-row gap-2 active:bg-[#5D1C34]/90 shadow-sm"
            >
              <Save size={16} color="#FFFFFF" />
              <Text className="text-[14px] font-bold text-white">Lưu cỡ</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Help / Field Guide Modal ── */}
      <Modal
        visible={!!activeHelpField}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveHelpField(null)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-5">
          <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <View className="flex-row items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
              <View className="flex-row items-center gap-2">
                <HelpCircle size={18} color="#5D1C34" />
                <Text className="text-[16px] font-bold text-[#1B1C1B]">
                  {activeHelpField?.label}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveHelpField(null)}
                className="w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center"
              >
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-[13.5px] text-[#4B5563] leading-5 mb-4">
              {activeHelpField?.desc}
            </Text>
            <View className="p-3 bg-[#FAF8F5] rounded-xl border border-[#ECE8E3] mb-5">
              <Text className="text-[12px] text-[#6B7280]">
                Khoảng số đo hợp lệ:{' '}
                <Text className="font-bold text-[#5D1C34]">
                  {activeHelpField?.min} – {activeHelpField?.max} {activeHelpField?.unit}
                </Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setActiveHelpField(null)}
              className="w-full py-3 bg-[#5D1C34] rounded-xl items-center justify-center"
            >
              <Text className="text-[13.5px] font-semibold text-white">Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Floating Action Bar "Bạn có thay đổi chưa lưu" (Docked Bottom) ── */}
      {bannerVisible && (
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-[#ECE8E3] px-4 pt-3 flex-row items-center justify-between shadow-2xl z-30"
        >
          <View className="flex-row items-center gap-2 flex-1 mr-3">
            <AlertCircle size={18} color={hasInvalidMeasurements ? '#DC2626' : COLORS.warning} />
            <Text className="flex-1 text-[13px] font-medium text-on-surface-strong" numberOfLines={1}>
              {hasInvalidMeasurements ? 'Số đo chưa hợp lệ' : 'Bạn có thay đổi chưa lưu'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              accessibilityLabel="Hủy thay đổi số đo"
              disabled={isSavingMeasurements}
              onPress={() => setMeasurements({ ...initialMeasurements })}
              className="min-h-10 justify-center px-3.5 rounded-xl border border-[#D1D5DB] active:bg-[#F9FAFB]"
            >
              <Text className="text-[12.5px] font-semibold text-on-surface-variant">Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Lưu số đo"
              disabled={hasInvalidMeasurements || isSavingMeasurements}
              onPress={handleSaveMeasurements}
              className={`min-h-10 justify-center rounded-xl bg-[#5D1C34] px-4 ${
                hasInvalidMeasurements || isSavingMeasurements ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {isSavingMeasurements ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-[12.5px] font-semibold text-white">Lưu số đo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

