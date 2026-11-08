import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { getErrorMessage } from '@/utils/error-message';
import {
  LOWER_FIELD_DEFS,
  OVERVIEW_FIELD_DEFS,
  UPPER_FIELD_DEFS,
  type MeasurementFieldDef,
} from '@/features/measurements/constants/measurement-fields';
import { useUpdateItemMeasurement } from '../hooks/use-orders';
import type { IOrderDetailItem } from '../types/order';

const ALL_FIELDS: MeasurementFieldDef[] = [
  ...OVERVIEW_FIELD_DEFS,
  ...UPPER_FIELD_DEFS,
  ...LOWER_FIELD_DEFS,
];

const SNAPSHOT_ALIASES: Record<string, string> = {
  shirtLength: 'bodyLength',
  trouserLength: 'outseam',
};

const FIELD_LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink';

function toInputString(value: unknown): string {
  if (value === null || value === undefined) return '';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(numeric) : '';
}

function readSnapshotValue(
  snapshot: Record<string, unknown>,
  fieldId: string,
): string {
  const direct = toInputString(snapshot[fieldId]);
  if (direct) return direct;
  const alias = SNAPSHOT_ALIASES[fieldId];
  return alias ? toInputString(snapshot[alias]) : '';
}

interface Props {
  item: IOrderDetailItem;
  orderId: string | number;
}

/** Form khách gửi lại số đo khi shop mở yêu cầu kiểm tra (measurementReview OPEN). */
export function OrderMeasurementReview({ item, orderId }: Props) {
  const review = item.measurementReview;
  const snapshot = useMemo(
    () => (item.measurementSnapshot ?? {}) as Record<string, unknown>,
    [item.measurementSnapshot],
  );

  const requiredIds = useMemo(
    () => new Set(item.measurementRequiredFields ?? []),
    [item.measurementRequiredFields],
  );
  const requestedIds = useMemo(
    () => new Set(review?.requestedFields ?? review?.fields ?? []),
    [review?.fields, review?.requestedFields],
  );
  const missingIds = useMemo(
    () => new Set(item.measurementMissingFields ?? []),
    [item.measurementMissingFields],
  );

  const fields = useMemo(() => {
    const knownIds = new Set(ALL_FIELDS.map((field) => field.id));
    const availableIds = Object.keys(snapshot).filter((key) => knownIds.has(key));
    const ids = new Set<string>([...requiredIds, ...requestedIds, ...availableIds]);
    const ordered = ALL_FIELDS.filter((field) => ids.has(field.id));
    const requestedFirst = ordered.filter((field) => requestedIds.has(field.id));
    const rest = ordered.filter((field) => !requestedIds.has(field.id));
    return [...requestedFirst, ...rest];
  }, [requestedIds, requiredIds, snapshot]);

  const initialValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const field of fields) {
      values[field.id] = readSnapshotValue(snapshot, field.id);
    }
    return values;
  }, [fields, snapshot]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [syncToProfile, setSyncToProfile] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { updateItemMeasurement, isUpdatingMeasurement } = useUpdateItemMeasurement();

  if (!review || !['OPEN', 'SUBMITTED'].includes(review.status ?? '')) return null;

  if (review.status === 'SUBMITTED') {
    return (
      <View className="flex-row items-center gap-2 rounded-subtle border border-landing-line bg-landing-ivory px-3 py-2.5">
        <View className="h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
        <Text className="font-sans text-[12px] text-sage-ink">Đã gửi số đo, chờ shop duyệt lại.</Text>
      </View>
    );
  }

  if (review.editable === false) return null;
  if (fields.length === 0) return null;

  const mandatoryIds = new Set<string>([...requiredIds, ...requestedIds]);
  const primaryFields = fields.filter(
    (field) => requestedIds.has(field.id) || missingIds.has(field.id),
  );
  const activeFields = primaryFields.length > 0 ? primaryFields : fields;
  const otherFields = fields.filter(
    (field) => !activeFields.some((active) => active.id === field.id),
  );

  const handleSubmit = () => {
    const emptyRequired = fields.filter(
      (field) => mandatoryIds.has(field.id) && !(values[field.id] ?? '').trim(),
    );
    const invalid = fields.filter((field) => {
      const raw = (values[field.id] ?? '').trim();
      if (!raw) return false;
      const numeric = Number(raw);
      return !Number.isFinite(numeric) || numeric < field.min || numeric > field.max;
    });

    if (emptyRequired.length > 0) {
      setErrorMsg(
        `Vui lòng điền đủ số đo shop yêu cầu/bắt buộc: ${emptyRequired
          .map((field) => field.label)
          .join(', ')}.`,
      );
      return;
    }
    if (invalid.length > 0) {
      setErrorMsg(
        `Có số đo chưa hợp lệ: ${invalid
          .map((field) => `${field.label} (${field.min}–${field.max}${field.unit})`)
          .join(', ')}.`,
      );
      return;
    }

    const measurementSnapshot: Record<string, number | null> = {};
    for (const field of fields) {
      const raw = (values[field.id] ?? '').trim();
      measurementSnapshot[field.id] = raw ? Number(raw) : null;
    }

    setErrorMsg(null);
    updateItemMeasurement(
      { orderId, itemId: item.id ?? '', measurementSnapshot, syncToProfile },
      {
        onSuccess: () => setErrorMsg(null),
        onError: (error) =>
          setErrorMsg(getErrorMessage(error, 'Không thể gửi số đo. Vui lòng thử lại.')),
      },
    );
  };

  const renderField = (field: MeasurementFieldDef) => {
    const requested = requestedIds.has(field.id);
    const missing = missingIds.has(field.id);

    return (
      <View key={field.id} className="w-[48%] gap-1">
        <View className="flex-row items-center gap-1.5">
          <Text className={FIELD_LABEL_CLASS}>{field.label}</Text>
          {requested ? (
            <Text className="font-sans text-[9.5px] font-semibold uppercase tracking-[0.08em] text-oxblood">
              Shop yêu cầu
            </Text>
          ) : missing ? (
            <Text className="font-sans text-[9.5px] font-semibold uppercase tracking-[0.08em] text-brass-ink">
              Cần bổ sung
            </Text>
          ) : null}
        </View>
        <TextInput
          value={values[field.id] ?? ''}
          onChangeText={(text) => {
            setValues((current) => ({ ...current, [field.id]: text }));
            if (errorMsg) setErrorMsg(null);
          }}
          keyboardType="numeric"
          placeholder={`${field.min}–${field.max} ${field.unit}`}
          placeholderTextColor={COLORS.muted}
          accessibilityLabel={field.label}
          className={`h-11 rounded-subtle border bg-landing-ivory px-3 font-mono text-[13px] text-landing-obsidian ${
            requested || missing ? 'border-oxblood' : 'border-landing-line'
          }`}
        />
      </View>
    );
  };

  return (
    <View className="rounded-subtle border border-landing-line bg-landing-ivory">
      <View className="flex-row items-start justify-between gap-3 border-b border-landing-line px-3.5 py-3">
        <View className="min-w-0 flex-1">
          <Text className={FIELD_LABEL_CLASS}>Shop cần bạn xem lại số đo</Text>
          {review.message ? (
            <Text className="mt-1 font-sans text-[12px] leading-relaxed text-landing-obsidian">
              {review.message}
            </Text>
          ) : null}
        </View>
        <View className="shrink-0 rounded-subtle border border-landing-line px-2 py-0.5">
          <Text className="font-mono text-[10px] font-semibold text-brass-ink">
            {requestedIds.size > 0 ? `${requestedIds.size} yêu cầu` : `${fields.length} ô`}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-x-3 gap-y-3 px-3.5 py-3.5">
        {activeFields.map(renderField)}
      </View>

      {otherFields.length > 0 ? (
        <View className="border-t border-landing-line px-3.5 py-2.5">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showOthers }}
            onPress={() => setShowOthers((value) => !value)}
            className="min-h-11 flex-row items-center justify-between gap-3 active:opacity-60"
          >
            <Text className="font-sans text-[12px] font-medium text-landing-obsidian">
              Các số đo khác
            </Text>
            <Text className="font-sans text-[11px] text-landing-muted">
              {otherFields.length} ô · {showOthers ? 'thu gọn' : 'chỉnh nếu cần'}
            </Text>
          </Pressable>
          {showOthers ? (
            <View className="mt-3 flex-row flex-wrap gap-x-3 gap-y-3">
              {otherFields.map(renderField)}
            </View>
          ) : null}
        </View>
      ) : null}

      {errorMsg ? (
        <View accessibilityRole="alert" className="border-t border-danger bg-landing-paper px-3.5 py-2">
          <Text className="font-sans text-[12px] leading-relaxed text-danger">{errorMsg}</Text>
        </View>
      ) : null}

      <View className="flex-row flex-wrap items-center justify-between gap-3 border-t border-landing-line px-3.5 py-3">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: syncToProfile }}
          onPress={() => setSyncToProfile((value) => !value)}
          className="min-h-11 flex-row items-center gap-2 active:opacity-70"
        >
          <View
            className={`h-4 w-4 items-center justify-center rounded-subtle border ${
              syncToProfile ? 'border-oxblood bg-oxblood' : 'border-taupe bg-landing-paper'
            }`}
          >
            {syncToProfile ? <Check size={11} strokeWidth={3} color={COLORS.paper} /> : null}
          </View>
          <Text className="font-sans text-[11px] text-landing-muted">Lưu vào hồ sơ số đo</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gửi số đo"
          accessibilityState={{ disabled: isUpdatingMeasurement }}
          disabled={isUpdatingMeasurement}
          onPress={handleSubmit}
          className="h-11 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood px-4 active:opacity-90 disabled:opacity-60"
        >
          {isUpdatingMeasurement ? <ActivityIndicator size="small" color={COLORS.paper} /> : null}
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-paper">
            {isUpdatingMeasurement ? 'Đang gửi' : 'Gửi số đo'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
