import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ruler,
  Info,
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
import { ProfileStackParamList } from '@/navigation/types';
import { COLORS } from '@/constants/theme';
import { BodyDiagram } from '../components/BodyDiagram';

type Tab = 'measurements' | 'sizes';
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

const labelClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink';
const eyebrowClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink';
const cardClass = 'rounded-subtle border border-landing-line bg-ivory';
const primaryButtonTextClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper';
const secondaryButtonTextClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian';

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
    <View className="mb-3.5">
      <View className="mb-1.5 flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
          <Text className="font-sans text-body-sm font-medium text-landing-obsidian">
            {field.label}
          </Text>
          {field.requiredFor && (
            <Text className="border border-landing-line px-1.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-brass-ink">
              {field.requiredFor}
            </Text>
          )}
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Xem hướng dẫn đo ${field.label}`}
          onPress={() => onHelp(field)}
          className="-mr-2 h-11 w-11 items-center justify-center active:opacity-60"
        >
          <HelpCircle size={15} strokeWidth={1.75} color={COLORS.muted} />
        </TouchableOpacity>
      </View>

      <View
        className={`h-11 flex-row items-center justify-between rounded-subtle border bg-landing-paper/60 px-3.5 ${
          validStatus === false
            ? 'border-danger'
            : validStatus === true
              ? 'border-sage-ink/50'
              : 'border-landing-line'
        }`}
      >
        <TextInput
          value={value}
          onChangeText={(v) => onChange(field.id, v)}
          placeholder="—"
          placeholderTextColor={COLORS.muted}
          keyboardType="numeric"
          className="h-full flex-1 font-mono text-body-md text-landing-obsidian"
        />
        <View className="flex-row items-center gap-1.5 pl-2">
          {validStatus === true && (
            <CheckCircle2 size={15} strokeWidth={1.75} color={COLORS.sageInk} />
          )}
          {validStatus === false && (
            <AlertCircle size={15} strokeWidth={1.75} color={COLORS.danger} />
          )}
          <Text className="font-mono text-[11px] uppercase tracking-[0.08em] text-landing-muted">
            {field.unit}
          </Text>
        </View>
      </View>

      <Text
        className={`mt-1 font-mono text-[10.5px] ${
          validStatus === false ? 'text-danger' : 'text-landing-muted'
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

const SIZE_GUIDE: Record<string, { chest: string; waist: string; hip: string }> = {
  XS: { chest: '80–84', waist: '63–67', hip: '86–90' },
  S: { chest: '84–88', waist: '67–71', hip: '90–94' },
  M: { chest: '88–92', waist: '71–75', hip: '94–98' },
  L: { chest: '92–96', waist: '75–79', hip: '98–102' },
  XL: { chest: '96–100', waist: '79–83', hip: '102–106' },
  XXL: { chest: '100–106', waist: '83–89', hip: '106–112' },
  '3XL': { chest: '106–112', waist: '89–95', hip: '112–118' },
};

const SIZE_MEASURE_KEYS = ['chest', 'waist', 'hip'] as const;
type SizeMeasureKey = (typeof SIZE_MEASURE_KEYS)[number];

const SIZE_MEASURE_LABELS: Record<SizeMeasureKey, string> = {
  chest: 'vòng ngực',
  waist: 'vòng eo',
  hip: 'vòng hông',
};

function parseSizeRange(range: string): [number, number] | null {
  const [min, max] = range.split(/[–-]/).map((part) => Number(part.trim()));
  return Number.isFinite(min) && Number.isFinite(max) ? [min, max] : null;
}

function findClosestSize(
  values: Partial<Record<SizeMeasureKey, string>>
): { size: string; basedOn: SizeMeasureKey[]; exact: boolean } | null {
  const known = SIZE_MEASURE_KEYS.filter((key) => Number(values[key]) > 0);
  if (known.length === 0) return null;

  let best: { size: string; distance: number } | null = null;
  for (const size of SHIRT_SIZES) {
    const guide = SIZE_GUIDE[size];
    if (!guide) continue;
    let distance = 0;
    for (const key of known) {
      const range = parseSizeRange(guide[key]);
      const value = Number(values[key]);
      if (!range) continue;
      if (value < range[0]) distance += range[0] - value;
      else if (value > range[1]) distance += value - range[1];
    }
    if (!best || distance < best.distance) best = { size, distance };
  }

  return best ? { size: best.size, basedOn: known, exact: best.distance === 0 } : null;
}

function SectionBlock({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <View>
      <View className="mb-3 gap-1">
        <Text className={labelClass}>{label}</Text>
        {description ? (
          <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'measurements', label: 'Số đo cơ thể' },
  { id: 'sizes', label: 'Bảng cỡ tham khảo' },
];

export function MeasurementsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'Measurements'>>();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>(
    route.params?.tab === 'sizes' ? 'sizes' : 'measurements'
  );
  const [activeHelpField, setActiveHelpField] = useState<FieldDef | null>(null);

  // Query measurements
  const { data: fetchedMeasurements } = useQuery({
    queryKey: ['user-measurements'],
    queryFn: () => measurementsApi.getMeasurements(),
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

  const closestSize = useMemo(
    () =>
      findClosestSize({
        chest: initialMeasurements.chest || '',
        waist: initialMeasurements.waist || '',
        hip: initialMeasurements.hip || '',
      }),
    [initialMeasurements]
  );

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

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      {showSavedToast && (
        <View
          style={{ top: insets.top + 60 }}
          className="absolute left-4 right-4 z-50 flex-row items-center gap-2 border-l-2 border-sage-ink bg-ivory px-4 py-2"
        >
          <CheckCircle2 size={16} strokeWidth={1.75} color={COLORS.sageInk} />
          <Text
            numberOfLines={1}
            className="flex-1 font-sans text-body-sm font-medium text-sage-ink"
          >
            Đã lưu số đo cơ thể thành công!
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Đóng thông báo"
            onPress={() => setShowSavedToast(false)}
            className="-mr-2 h-11 w-11 items-center justify-center active:opacity-60"
          >
            <X size={16} strokeWidth={1.75} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
      )}

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
        <BackButton onPress={() => navigation.goBack()} />

        <View className="mt-4 mb-5 gap-2 border-b border-landing-line pb-5">
          <Text className={eyebrowClass}>Tài khoản</Text>
          <Text
            accessibilityRole="header"
            className="font-display text-headline-lg text-landing-obsidian"
          >
            Số đo & chi tiết
          </Text>
          <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
            Số đo cơ thể dùng cho đơn may đo. Lưu một lần, mỗi đơn sẽ chụp lại số đo tại thời điểm đặt.
          </Text>
        </View>

        <View className="mb-6 flex-row gap-6 border-b border-landing-line">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                onPress={() => setActiveTab(tab.id)}
                className="relative h-11 justify-center active:opacity-70"
              >
                <Text
                  className={`font-sans text-sm ${
                    isActive
                      ? 'font-medium text-oxblood'
                      : 'text-landing-obsidian/70'
                  }`}
                >
                  {tab.label}
                </Text>
                {isActive ? (
                  <View className="absolute -bottom-px left-0 right-0 h-0.5 bg-oxblood" />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'measurements' && (
          <View className={`${cardClass} mb-6 gap-5 p-5`}>
            <View className="gap-2 border-b border-landing-line pb-4">
              <View className="flex-row items-center gap-2">
                <Ruler size={14} strokeWidth={1.75} color={COLORS.brassInk} />
                <Text className={eyebrowClass}>Số đo cơ thể</Text>
              </View>
              <Text className="font-display text-headline-sm text-landing-obsidian">
                Số đo của bạn
              </Text>
              <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                Giúp AI thử đồ chính xác và gợi ý size phù hợp.
              </Text>
            </View>

            <View className="flex-row items-start gap-3 border-l-2 border-brass bg-landing-paper/60 px-4 py-3">
              <Info size={15} strokeWidth={1.75} color={COLORS.brassInk} />
              <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-muted">
                Dùng thước dây mềm, đo sát người nhưng không siết. Nhờ người khác đo giúp sẽ cho kết quả chính xác hơn.
              </Text>
            </View>

            <View className="rounded-subtle border border-landing-line bg-landing-paper/60 p-4">
              <BodyDiagram values={deferredMeasurements} />
            </View>

            <SectionBlock label="Tổng quan" description="Thông tin cơ bản về cơ thể">
              <View>
                {OVERVIEW_FIELD_DEFS.map((f) => (
                  <MeasurementField
                    key={f.id}
                    field={f}
                    value={measurements[f.id] || ''}
                    onChange={handleMeasurementChange}
                    onHelp={handleHelpField}
                  />
                ))}
              </View>
            </SectionBlock>

            <SectionBlock label="Dáng người" description="Giúp AI tối ưu kết quả thử đồ">
              <View className="flex-row flex-wrap gap-2">
                {BODY_TYPES.map((bt) => {
                  const isSelected = bodyType === bt.id;
                  return (
                    <TouchableOpacity
                      key={bt.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setBodyType(bt.id)}
                      className={`w-[48%] min-h-20 justify-center gap-1 rounded-subtle border px-3.5 py-3 ${
                        isSelected
                          ? 'border-oxblood bg-ivory'
                          : 'border-landing-line bg-landing-paper/60'
                      }`}
                    >
                      <Text
                        className={`font-sans text-body-md font-medium ${
                          isSelected ? 'text-oxblood' : 'text-landing-obsidian'
                        }`}
                      >
                        {bt.label}
                      </Text>
                      <Text className="font-sans text-[11px] text-landing-muted">{bt.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </SectionBlock>

            <SectionBlock label="Thân trên" description="Áo sơ mi, blazer, vest">
              <View>
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
            </SectionBlock>

            <SectionBlock label="Thân dưới" description="Quần tây, chân váy">
              <View>
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
            </SectionBlock>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleSaveMeasurements}
              disabled={hasInvalidMeasurements || isSavingMeasurements || !isMeasurementsDirty}
              className={`h-12 flex-row items-center justify-center gap-2 rounded-subtle ${
                isMeasurementsDirty && !hasInvalidMeasurements && !isSavingMeasurements
                  ? 'bg-oxblood active:bg-landing-obsidian'
                  : 'border border-landing-line bg-landing-paper/60'
              }`}
            >
              {isSavingMeasurements ? (
                <ActivityIndicator size="small" color={COLORS.paper} />
              ) : (
                <>
                  <Save
                    size={15}
                    strokeWidth={1.75}
                    color={
                      isMeasurementsDirty && !hasInvalidMeasurements
                        ? COLORS.paper
                        : COLORS.muted
                    }
                  />
                  <Text
                    className={`font-sans text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      isMeasurementsDirty && !hasInvalidMeasurements
                        ? 'text-landing-paper'
                        : 'text-landing-muted'
                    }`}
                  >
                    {hasInvalidMeasurements ? 'Số đo chưa hợp lệ' : 'Lưu số đo'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'sizes' && (
          <View className="mb-6 gap-8">
            <View className="gap-2">
              <Text className={labelClass}>Cỡ gần nhất với số đo đã lưu</Text>
              {closestSize ? (
                <>
                  <Text className="font-display text-[44px] leading-none text-oxblood">
                    {closestSize.size}
                  </Text>
                  <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                    {`Theo ${closestSize.basedOn
                      .map((key) => SIZE_MEASURE_LABELS[key])
                      .join(', ')}${closestSize.exact ? '.' : ', số đo của bạn nằm giữa hai cỡ.'} Đơn may đo vẫn may theo số đo thật của bạn.`}
                  </Text>
                </>
              ) : (
                <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                  Nhập vòng ngực, vòng eo hoặc vòng hông ở tab Số đo cơ thể để xem cỡ gần nhất.
                </Text>
              )}
            </View>

            <View className="border border-landing-line">
              <View className="flex-row items-center border-b border-landing-line bg-ivory/60">
                <View className="w-14 justify-center px-2.5 py-3">
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
                    Cỡ
                  </Text>
                </View>
                {['Vòng ngực', 'Vòng eo', 'Vòng hông'].map((heading) => (
                  <View key={heading} className="flex-1 justify-center px-2.5 py-3">
                    <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
                      {heading}
                    </Text>
                  </View>
                ))}
              </View>

              {SHIRT_SIZES.map((size, index) => {
                const guide = SIZE_GUIDE[size];
                if (!guide) return null;
                const isClosest = closestSize?.size === size;
                return (
                  <View
                    key={size}
                    accessible
                    accessibilityLabel={`Cỡ ${size}: vòng ngực ${guide.chest}, vòng eo ${guide.waist}, vòng hông ${guide.hip} cm`}
                    className={`min-h-11 flex-row items-center ${
                      isClosest ? 'bg-oxblood/[0.06]' : ''
                    } ${index === SHIRT_SIZES.length - 1 ? '' : 'border-b border-landing-line/60'}`}
                  >
                    <View className="w-14 px-2.5">
                      <View className={isClosest ? 'border-l-2 border-oxblood pl-2' : ''}>
                        <Text
                          className={`font-mono text-[12px] ${
                            isClosest ? 'text-oxblood' : 'text-landing-obsidian'
                          }`}
                        >
                          {size}
                        </Text>
                      </View>
                    </View>
                    <Text className="flex-1 px-2.5 font-mono text-[12px] text-landing-obsidian/85">
                      {guide.chest}
                    </Text>
                    <Text className="flex-1 px-2.5 font-mono text-[12px] text-landing-obsidian/85">
                      {guide.waist}
                    </Text>
                    <Text className="flex-1 px-2.5 font-mono text-[12px] text-landing-obsidian/85">
                      {guide.hip}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text className="font-mono text-[10.5px] leading-relaxed text-landing-muted">
              Đơn vị: cm. Số đo cơ thể, không phải số đo thành phẩm.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!activeHelpField}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveHelpField(null)}
      >
        <View className="flex-1 items-center justify-center bg-landing-obsidian/50 px-5">
          <View className="w-full max-w-sm gap-4 rounded-subtle border border-landing-line bg-ivory p-5">
            <View className="flex-row items-start justify-between gap-3 border-b border-landing-line pb-3">
              <View className="flex-1 gap-1">
                <View className="flex-row items-center gap-2">
                  <HelpCircle size={14} strokeWidth={1.75} color={COLORS.brassInk} />
                  <Text className={eyebrowClass}>Hướng dẫn đo</Text>
                </View>
                <Text className="font-display text-headline-sm text-landing-obsidian">
                  {activeHelpField?.label}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Đóng hướng dẫn"
                onPress={() => setActiveHelpField(null)}
                className="-mr-1 -mt-1 h-11 w-11 items-center justify-center active:opacity-60"
              >
                <X size={16} strokeWidth={1.75} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
              {activeHelpField?.desc}
            </Text>

            <View className="border-l-2 border-brass bg-landing-paper/60 px-4 py-3">
              <Text className="font-sans text-body-sm text-landing-muted">
                Khoảng số đo hợp lệ:{' '}
                <Text className="font-mono text-[12px] text-oxblood">
                  {activeHelpField?.min} – {activeHelpField?.max} {activeHelpField?.unit}
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setActiveHelpField(null)}
              className="h-11 items-center justify-center rounded-subtle bg-oxblood active:bg-landing-obsidian"
            >
              <Text className={primaryButtonTextClass}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {bannerVisible && (
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          className="absolute bottom-0 left-0 right-0 z-30 flex-row items-center justify-between border-t border-landing-line bg-landing-paper px-4 pt-3"
        >
          <View className="mr-3 flex-1 flex-row items-center gap-2">
            <AlertCircle
              size={16}
              strokeWidth={1.75}
              color={hasInvalidMeasurements ? COLORS.danger : COLORS.brassInk}
            />
            <Text
              numberOfLines={1}
              className={`flex-1 font-sans text-body-sm ${
                hasInvalidMeasurements ? 'text-danger' : 'text-landing-obsidian'
              }`}
            >
              {hasInvalidMeasurements ? 'Số đo chưa hợp lệ' : 'Bạn có thay đổi chưa lưu'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Hủy thay đổi số đo"
              disabled={isSavingMeasurements}
              onPress={() => setMeasurements({ ...initialMeasurements })}
              className="h-11 items-center justify-center rounded-subtle border border-landing-line bg-ivory px-4 active:opacity-70"
            >
              <Text className={secondaryButtonTextClass}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Lưu số đo"
              disabled={hasInvalidMeasurements || isSavingMeasurements}
              onPress={handleSaveMeasurements}
              className={`h-11 items-center justify-center rounded-subtle bg-oxblood px-4 ${
                hasInvalidMeasurements || isSavingMeasurements
                  ? 'opacity-40'
                  : 'active:bg-landing-obsidian'
              }`}
            >
              {isSavingMeasurements ? (
                <ActivityIndicator size="small" color={COLORS.paper} />
              ) : (
                <Text className={primaryButtonTextClass}>Lưu số đo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}
