import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Check, ChevronRight, Ruler } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { measurementsApi } from '@/features/measurements/api/measurements.api';
import { useMeasurementsCompleteness } from '@/features/measurements/hooks/use-measurements-completeness';
import type { GarmentCategory } from '../types/product';

const SUMMARY_FIELDS = [
  { label: 'Ngực', key: 'chest', unit: 'cm' },
  { label: 'Eo', key: 'waist', unit: 'cm' },
  { label: 'Hông', key: 'hip', unit: 'cm' },
  { label: 'Vai', key: 'shoulder', unit: 'cm' },
  { label: 'Cao', key: 'height', unit: 'cm' },
  { label: 'Nặng', key: 'weight', unit: 'kg' },
] as const;

interface ProductMeasurementSummaryProps {
  category: GarmentCategory;
  onPressMeasurements: () => void;
}

function formatMeasurementValue(value?: number | string | null): string {
  if (value === null || value === undefined || value === '') {
    return '--';
  }
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return '--';
  }
  return Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(1);
}

export function ProductMeasurementSummary({
  category,
  onPressMeasurements,
}: ProductMeasurementSummaryProps) {
  const { getCategoryCompleteness, isLoading } = useMeasurementsCompleteness();
  const measurementsQuery = useQuery({
    queryKey: ['user-measurements'],
    queryFn: ({ signal }) => measurementsApi.getMeasurements({ signal }),
  });
  const categoryCompleteness = getCategoryCompleteness(category);
  const measurements = measurementsQuery.data;
  const isComplete = categoryCompleteness?.complete ?? false;
  const isChecking = isLoading && !categoryCompleteness;

  return (
    <View className="gap-md">
      <View className="flex-row flex-wrap items-center justify-between gap-sm">
        <View className="min-w-0 flex-1 flex-row items-start gap-sm">
          <Ruler size={16} color={COLORS.oxblood} strokeWidth={1.75} />
          <Text className="flex-1 font-sans text-body-sm leading-relaxed text-obsidian">
            <Text className="font-semibold">Hình thức: </Text>
            <Text className="text-oxblood">May đo theo số đo cơ thể</Text>
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cập nhật số đo cơ thể"
          onPress={onPressMeasurements}
          className="min-h-11 flex-row items-center gap-xs px-xs active:opacity-70"
        >
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood">
            Cập nhật số đo
          </Text>
          <ChevronRight size={12} strokeWidth={1.75} color={COLORS.oxblood} />
        </Pressable>
      </View>

      {isChecking ? (
        <View className="rounded-subtle border border-landing-line bg-ivory p-md">
          <Text className="font-sans text-body-sm text-landing-muted">
            Đang kiểm tra số đo...
          </Text>
        </View>
      ) : isComplete ? (
        <View className="gap-sm rounded-subtle border border-landing-line bg-ivory p-md">
          <View className="flex-row items-start gap-sm">
            <Check size={14} color={COLORS.sageInk} strokeWidth={2} />
            <View className="flex-1 gap-xs">
              <Text className="font-sans text-body-sm font-semibold text-sage-ink">
                Số đo đã sẵn sàng cho may đo
              </Text>
              <Text className="font-sans text-label-md text-landing-muted">
                Tự động áp dụng khi đặt hàng
              </Text>
            </View>
          </View>
          <View className="flex-row flex-wrap rounded-subtle border border-landing-line bg-paper p-xs">
            {SUMMARY_FIELDS.map((field) => (
              <View key={field.key} className="w-1/3 gap-xs px-xs py-xs">
                <Text className="font-sans text-2xs uppercase tracking-[0.12em] text-landing-muted">
                  {field.label}
                </Text>
                <Text className="font-mono text-body-sm tabular-nums text-obsidian">
                  {formatMeasurementValue(measurements?.[field.key])}
                  {field.unit}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View className="gap-sm rounded-subtle border border-danger/30 bg-ivory p-md">
          <View className="flex-row items-start gap-sm">
            <AlertCircle size={16} color={COLORS.danger} strokeWidth={1.75} />
            <View className="flex-1 gap-xs">
              <Text className="font-sans text-body-sm font-semibold text-obsidian">
                Cần bổ sung số đo trước khi đặt may
              </Text>
              <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                Còn thiếu:{' '}
                <Text className="font-semibold text-obsidian">
                  {categoryCompleteness?.missing
                    ?.map((item) => item.label)
                    .join(', ') || 'số đo bắt buộc'}
                </Text>
                .
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bổ sung số đo cơ thể"
            onPress={onPressMeasurements}
            className="min-h-11 flex-row items-center justify-center gap-sm rounded-subtle bg-oxblood px-md active:opacity-90"
          >
            <Ruler size={14} color={COLORS.paper} strokeWidth={1.75} />
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-paper">
              Bổ sung số đo
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
