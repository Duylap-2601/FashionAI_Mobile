import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, ChevronRight, Image as ImageIcon } from 'lucide-react-native';
import { TryOnStackParamList } from '@/navigation/types';
import { COLORS } from '@/constants/theme';

export type TryOnMode = 'photo' | 'live';

const MODE_COPY: Record<TryOnMode, string> = {
  live: 'Mặc thử trên chính bạn qua camera. Tạm dừng để đổi món, phiên tính theo thời gian.',
  photo: 'Tải một ảnh toàn thân, AI ghép trang phục lên ảnh và lưu kết quả vào lịch sử.',
};

export const TRY_ON_LABEL_CLASS =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: (selected: boolean) => React.ReactNode;
}

// Nút gạt vuông kiểu FE (Trực tiếp / Bằng ảnh, Một món / Phối bộ). Cao 44px cho ngón tay.
export function TryOnSegmented<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className="flex-row border border-landing-line"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            className={`h-11 flex-1 flex-row items-center justify-center gap-1.5 px-4 ${
              selected ? 'bg-oxblood' : ''
            } ${disabled ? 'opacity-50' : ''}`}
          >
            {option.icon?.(selected)}
            <Text
              className={`font-sans text-[11px] font-semibold uppercase tracking-[0.14em] ${
                selected ? 'text-landing-paper' : 'text-landing-obsidian/70'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface TryOnPageHeaderProps {
  mode: TryOnMode;
  onModeChange: (mode: TryOnMode) => void;
  modeDisabled?: boolean;
  photoQuota?: { remaining?: number; limit?: number } | null;
  showUpgrade?: boolean;
  onPressUpgrade?: () => void;
}

export const TryOnPageHeader: React.FC<TryOnPageHeaderProps> = ({
  mode,
  onModeChange,
  modeDisabled = false,
  photoQuota,
  showUpgrade = false,
  onPressUpgrade,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<TryOnStackParamList>>();
  const remaining =
    typeof photoQuota?.remaining === 'number' ? photoQuota.remaining : null;
  const limit =
    typeof photoQuota?.limit === 'number' ? photoQuota.limit : null;

  return (
    <View className="mb-8 border-b border-landing-line pb-6">
      <Text className={TRY_ON_LABEL_CLASS}>Phòng thử</Text>
      <Text accessibilityRole="header" className="mt-3 font-display text-headline-lg text-landing-obsidian">
        Thử đồ AI
      </Text>
      <Text className="mt-3 font-sans text-body-md leading-relaxed text-landing-muted">
        {MODE_COPY[mode]}
      </Text>

      <View className="mt-5">
        <TryOnSegmented
          accessibilityLabel="Cách thử đồ"
          value={mode}
          onChange={onModeChange}
          disabled={modeDisabled}
          options={[
            {
              value: 'live',
              label: 'Trực tiếp',
              icon: (selected) => (
                <Camera
                  size={14}
                  strokeWidth={1.75}
                  color={selected ? COLORS.paper : COLORS.obsidian}
                />
              ),
            },
            {
              value: 'photo',
              label: 'Bằng ảnh',
              icon: (selected) => (
                <ImageIcon
                  size={14}
                  strokeWidth={1.75}
                  color={selected ? COLORS.paper : COLORS.obsidian}
                />
              ),
            },
          ]}
        />
      </View>

      <View className="mt-4 flex-row items-center justify-between gap-3">
        {mode === 'photo' && showUpgrade ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nâng cấp gói"
            onPress={onPressUpgrade}
            className="h-11 items-center justify-center rounded-subtle border border-landing-line px-3.5 active:bg-ivory"
          >
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
              Nâng cấp gói
            </Text>
          </Pressable>
        ) : mode === 'photo' && remaining !== null && limit !== null && limit > 0 && remaining <= 0 ? (
          <Text accessibilityLiveRegion="polite" className="font-sans text-[11px] text-danger">
            Hết lượt thử bằng ảnh hôm nay
          </Text>
        ) : mode === 'photo' && remaining !== null && limit !== null ? (
          <Text accessibilityLiveRegion="polite" className="font-sans text-[11px] text-landing-muted">
            Còn{' '}
            <Text className="font-mono text-landing-obsidian">
              {remaining}/{limit}
            </Text>{' '}
            lượt hôm nay
          </Text>
        ) : (
          <View />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lịch sử thử đồ"
          onPress={() => navigation.navigate('TryOnHistory')}
          className="min-h-11 flex-row items-center gap-1 active:opacity-70"
        >
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood">
            Lịch sử thử đồ
          </Text>
          <ChevronRight size={13} strokeWidth={1.75} color={COLORS.oxblood} />
        </Pressable>
      </View>
    </View>
  );
};

export const TryOnSubscriptionNotice: React.FC<{
  isExpired: boolean;
  onPressUpgrade: () => void;
}> = ({ isExpired, onPressUpgrade }) => (
  <View className="mb-8 flex-col gap-4 border-l-2 border-landing-brass bg-ivory px-5 py-4">
    <View>
      <Text className="font-display text-[20px] leading-tight text-landing-obsidian">
        {isExpired
          ? 'Gói thành viên đã hết hạn'
          : 'Thử bằng ảnh cần gói Member hoặc VIP'}
      </Text>
      <Text className="mt-1 font-sans text-body-sm leading-relaxed text-landing-muted">
        {isExpired
          ? 'Gia hạn gói để tiếp tục thử bằng ảnh.'
          : 'Gói miễn phí chưa có lượt thử bằng ảnh. Member và VIP có lượt mới mỗi ngày.'}
      </Text>
    </View>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isExpired ? 'Gia hạn gói' : 'Xem các gói'}
      onPress={onPressUpgrade}
      className="h-12 items-center justify-center rounded-subtle bg-oxblood active:opacity-90"
    >
      <Text className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
        {isExpired ? 'Gia hạn gói' : 'Xem các gói'}
      </Text>
    </Pressable>
  </View>
);
