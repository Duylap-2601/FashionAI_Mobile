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
import { CheckCircle2, AlertCircle, HelpCircle, X, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { measurementsApi } from '@/features/measurements/api/measurements.api';
import { ProfileStackParamList } from '@/navigation/types';
import { COLORS } from '@/constants/theme';
import { BodyDiagram } from '../components/BodyDiagram';
import {
  LOWER_FIELD_DEFS,
  OVERVIEW_FIELD_DEFS,
  SHIRT_SIZE_GUIDE,
  SHIRT_SIZES,
  UPPER_FIELD_DEFS,
  type MeasurementFieldDef,
} from '../constants/measurement-fields';

type Tab = 'measurements' | 'sizes';
type BodyType = 'slim' | 'regular' | 'athletic' | 'plus';

type FieldDef = MeasurementFieldDef;

const labelClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink';
const eyebrowClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink';
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
  isDirty: boolean;
  onChange: (id: string, value: string) => void;
  onHelp: (field: FieldDef) => void;
}

// Ô nhập số đo kiểu FE measurement-input.tsx: nhãn, chấm oxblood khi đã sửa, ô ivory viền mảnh.
const MeasurementField = React.memo(function MeasurementField({
  field,
  value,
  isDirty,
  onChange,
  onHelp,
}: MeasurementFieldProps) {
  const validStatus = isMeasurementFieldValid(field, value);

  return (
    <View className="mb-5">
      <View className="mb-1 flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <Text className="font-sans text-sm text-landing-obsidian">{field.label}</Text>
          {field.requiredFor ? (
            <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-brass-ink">
              {field.requiredFor}
            </Text>
          ) : null}
          {isDirty ? (
            <View
              accessible
              accessibilityLabel="Đã sửa, chưa lưu"
              className="h-1.5 w-1.5 self-center rounded-full bg-oxblood"
            />
          ) : null}
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Cách đo ${field.label.toLowerCase()}`}
          onPress={() => onHelp(field)}
          className="-mr-2 h-11 w-11 items-center justify-center"
        >
          <HelpCircle size={16} strokeWidth={1.75} color={COLORS.muted} />
        </TouchableOpacity>
      </View>

      <View
        className={`h-11 flex-row items-center justify-between rounded-subtle border bg-landing-ivory/80 px-3 ${
          validStatus === false ? 'border-danger' : 'border-landing-line'
        }`}
      >
        <TextInput
          value={value}
          onChangeText={(v) => onChange(field.id, v)}
          accessibilityLabel={`${field.label} (${field.unit})`}
          accessibilityHint={`Từ ${field.min} đến ${field.max} ${field.unit}`}
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
        className={`mt-1 font-sans text-xs ${
          validStatus === false ? 'text-danger' : 'text-landing-muted'
        }`}
      >
        {validStatus === false
          ? `Nhập từ ${field.min} đến ${field.max} ${field.unit}.`
          : `${field.min}–${field.max} ${field.unit}`}
      </Text>
    </View>
  );
});

const ALL_MEASUREMENT_DEFS = [...OVERVIEW_FIELD_DEFS, ...UPPER_FIELD_DEFS, ...LOWER_FIELD_DEFS];

const MEASUREMENT_DEFS_BY_ID = new Map(ALL_MEASUREMENT_DEFS.map((f) => [f.id, f]));

const BODY_TYPES: { id: BodyType; label: string; desc: string }[] = [
  { id: 'slim', label: 'Mảnh mai', desc: 'Vai hẹp, eo thon' },
  { id: 'regular', label: 'Cân đối', desc: 'Tỷ lệ hài hòa' },
  { id: 'athletic', label: 'Thể thao', desc: 'Vai rộng, cơ bắp' },
  { id: 'plus', label: 'Plus size', desc: 'Dáng đầy đặn' },
];

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
    const guide = SHIRT_SIZE_GUIDE[size];
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

// Đầu nhóm kiểu FE section-header.tsx: tiêu đề serif + đường mảnh kéo dài.
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
      <View className="mb-5">
        <View className="flex-row items-center gap-4">
          <Text accessibilityRole="header" className="font-display text-xl leading-tight text-landing-obsidian">
            {label}
          </Text>
          <View className="h-px flex-1 bg-landing-line" />
        </View>
        {description ? (
          <Text className="mt-1 font-sans text-xs text-landing-muted">{description}</Text>
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
  const { data: fetchedMeasurements, isLoading: isLoadingMeasurements } = useQuery({
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

  const changedCount = useMemo(
    () =>
      ALL_MEASUREMENT_DEFS.filter(
        (f) => (measurements[f.id] || '') !== (initialMeasurements[f.id] || '')
      ).length,
    [measurements, initialMeasurements]
  );
  const isMeasurementsDirty = changedCount > 0;

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

  // Toast "Đã lưu số đo" tự ẩn sau 3.5s, có nút X tắt ngay.
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
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{ top: insets.top + 60 }}
          className="absolute left-4 right-4 z-50 flex-row items-center gap-2 border-l-2 border-sage-ink bg-ivory px-4 py-1"
        >
          <CheckCircle2 size={16} strokeWidth={1.75} color={COLORS.sageInk} />
          <Text
            numberOfLines={1}
            className="flex-1 font-sans text-body-sm font-medium text-sage-ink"
          >
            Đã lưu số đo
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Đóng thông báo"
            onPress={() => setShowSavedToast(false)}
            className="-mr-2 h-11 w-11 items-center justify-center"
          >
            <X size={16} strokeWidth={1.75} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName={`px-lg pt-lg ${bannerVisible ? 'pb-[110px]' : 'pb-10'}`}
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

        <View accessibilityRole="tablist" className="mb-8 flex-row gap-6 border-b border-landing-line">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                onPress={() => setActiveTab(tab.id)}
                className="relative h-11 justify-center"
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

        {activeTab === 'measurements' && isLoadingMeasurements ? (
          <View className="mb-6 items-center gap-3 py-16">
            <ActivityIndicator size="large" color={COLORS.oxblood} />
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
              Đang tải số đo
            </Text>
          </View>
        ) : null}

        {activeTab === 'measurements' && !isLoadingMeasurements && (
          <View className="mb-6 gap-10">
            <View className="gap-6">
              <View className="border border-landing-line bg-landing-ivory/50 px-3 pb-4 pt-3">
                <BodyDiagram values={deferredMeasurements} />
              </View>
              <Text className="border-l-2 border-landing-brass pl-3 font-sans text-xs leading-relaxed text-landing-muted">
                Dùng thước dây mềm, đo sát người nhưng không siết. Nhờ người khác đo giúp sẽ chính xác hơn.
              </Text>
            </View>

            <SectionBlock label="Tổng quan" description="Chiều cao, cân nặng">
              <View>
                {OVERVIEW_FIELD_DEFS.map((f) => (
                  <MeasurementField
                    key={f.id}
                    field={f}
                    value={measurements[f.id] || ''}
                    isDirty={(measurements[f.id] || '') !== (initialMeasurements[f.id] || '')}
                    onChange={handleMeasurementChange}
                    onHelp={handleHelpField}
                  />
                ))}
              </View>
            </SectionBlock>

            <SectionBlock label="Dáng người" description="Giúp AI tối ưu kết quả thử đồ">
              <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
                {BODY_TYPES.map((bt) => {
                  const isSelected = bodyType === bt.id;
                  return (
                    <TouchableOpacity
                      key={bt.id}
                      accessibilityRole="radio"
                      accessibilityLabel={`${bt.label}, ${bt.desc}`}
                      accessibilityState={{ checked: isSelected }}
                      onPress={() => setBodyType(bt.id)}
                      className={`min-h-20 w-[48%] justify-center gap-1 rounded-subtle border px-3.5 py-3 ${
                        isSelected
                          ? 'border-oxblood bg-landing-ivory'
                          : 'border-landing-line bg-landing-ivory/50'
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
                    isDirty={(measurements[f.id] || '') !== (initialMeasurements[f.id] || '')}
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
                    isDirty={(measurements[f.id] || '') !== (initialMeasurements[f.id] || '')}
                    onChange={handleMeasurementChange}
                    onHelp={handleHelpField}
                  />
                ))}
              </View>
            </SectionBlock>

            <View className="gap-3 border-t border-landing-line pt-6">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Lưu số đo"
                accessibilityState={{
                  disabled: hasInvalidMeasurements || isSavingMeasurements || !isMeasurementsDirty,
                  busy: isSavingMeasurements,
                }}
                onPress={handleSaveMeasurements}
                disabled={hasInvalidMeasurements || isSavingMeasurements || !isMeasurementsDirty}
                className={`h-12 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood ${
                  hasInvalidMeasurements || isSavingMeasurements || !isMeasurementsDirty
                    ? 'opacity-50'
                    : ''
                }`}
              >
                {isSavingMeasurements ? (
                  <ActivityIndicator size="small" color={COLORS.paper} />
                ) : null}
                <Text className={primaryButtonTextClass}>
                  {isSavingMeasurements ? 'Đang lưu số đo' : 'Lưu số đo'}
                </Text>
              </TouchableOpacity>
              {hasInvalidMeasurements ? (
                <Text accessibilityRole="alert" className="font-sans text-xs text-danger">
                  Sửa các ô đang báo lỗi trước khi lưu.
                </Text>
              ) : null}
            </View>
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
              <TouchableOpacity
                accessibilityRole="link"
                accessibilityLabel="Xem hướng dẫn chọn size"
                onPress={() => navigation.navigate('Policy', { type: 'size-guide' })}
                className="min-h-11 flex-row items-center gap-1.5 self-start active:opacity-60"
              >
                <Text className="font-sans text-body-sm text-oxblood">
                  Hướng dẫn chọn size
                </Text>
                <ArrowRight size={14} strokeWidth={1.75} color={COLORS.oxblood} />
              </TouchableOpacity>
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
                const guide = SHIRT_SIZE_GUIDE[size];
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
        <View className="flex-1 items-center justify-center bg-landing-obsidian/45 px-5">
          <View className="w-full max-w-sm gap-4 rounded-subtle border border-landing-line bg-landing-paper p-5">
            <View className="flex-row items-start justify-between gap-3 border-b border-landing-line pb-3">
              <View className="flex-1 gap-1">
                <View className="flex-row items-center gap-2">
                  <HelpCircle size={14} strokeWidth={1.75} color={COLORS.brassInk} />
                  <Text className={eyebrowClass}>Hướng dẫn đo</Text>
                </View>
                <Text
                  accessibilityRole="header"
                  className="font-display text-headline-sm text-landing-obsidian"
                >
                  {activeHelpField?.label}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Đóng hướng dẫn"
                onPress={() => setActiveHelpField(null)}
                className="-mr-2 -mt-2 h-11 w-11 items-center justify-center"
              >
                <X size={16} strokeWidth={1.75} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
              {activeHelpField?.desc}
            </Text>

            <View className="border-l-2 border-landing-brass bg-landing-ivory px-4 py-3">
              <Text className="font-sans text-body-sm text-landing-muted">
                Khoảng số đo hợp lệ:{' '}
                <Text className="font-mono text-[12px] text-oxblood">
                  {activeHelpField?.min} – {activeHelpField?.max} {activeHelpField?.unit}
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Đã hiểu"
              onPress={() => setActiveHelpField(null)}
              className="h-11 items-center justify-center rounded-subtle bg-oxblood"
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
          <View
            accessibilityLiveRegion="polite"
            className="mr-3 flex-1 flex-row items-center gap-2"
          >
            {hasInvalidMeasurements ? (
              <AlertCircle size={16} strokeWidth={1.75} color={COLORS.danger} />
            ) : (
              <View className="h-1.5 w-1.5 rounded-full bg-oxblood" />
            )}
            <Text
              numberOfLines={1}
              className={`flex-1 font-sans text-body-sm ${
                hasInvalidMeasurements ? 'text-danger' : 'text-landing-obsidian'
              }`}
            >
              {hasInvalidMeasurements ? (
                'Số đo chưa hợp lệ'
              ) : (
                <>
                  <Text className="font-mono">{changedCount}</Text> số đo chưa lưu
                </>
              )}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Hoàn tác thay đổi số đo"
              accessibilityState={{ disabled: isSavingMeasurements }}
              disabled={isSavingMeasurements}
              onPress={() => setMeasurements({ ...initialMeasurements })}
              className="h-11 items-center justify-center rounded-subtle border border-landing-line px-3.5"
            >
              <Text className={secondaryButtonTextClass}>Hoàn tác</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Lưu số đo"
              accessibilityState={{
                disabled: hasInvalidMeasurements || isSavingMeasurements,
                busy: isSavingMeasurements,
              }}
              disabled={hasInvalidMeasurements || isSavingMeasurements}
              onPress={handleSaveMeasurements}
              className={`h-11 items-center justify-center rounded-subtle bg-oxblood px-4 ${
                hasInvalidMeasurements || isSavingMeasurements ? 'opacity-50' : ''
              }`}
            >
              {isSavingMeasurements ? (
                <ActivityIndicator size="small" color={COLORS.paper} />
              ) : (
                <Text className={primaryButtonTextClass}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}
