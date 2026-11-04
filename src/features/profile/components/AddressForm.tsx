import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, Check, ChevronDown, MapPin, RefreshCw, Search, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { ApiError } from '@/types/api';
import { IAddressCatalogLocation } from '@/features/shipping/api/shipping.api';
import {
  useAddressCatalogProvinces,
  useAddressCatalogWards,
  useShippingCapabilities,
} from '@/features/shipping/hooks/use-address-catalog';
import { IUserAddress } from '../api/users.api';

export interface IAddressDraft {
  recipientName: string;
  phone: string;
  addressLine: string;
  label?: string;
  ghnProvinceV3Id: string;
  ghnWardV3Id: string;
  provinceName: string;
  wardName: string;
  isDefault: boolean;
}

interface AddressFormProps {
  initial?: Partial<IUserAddress> | null;
  mode?: 'book' | 'checkout';
  isSaving?: boolean;
  errorMessage?: string;
  onCancel?: () => void;
  onSubmit: (draft: IAddressDraft) => void;
}

interface LocationPickerProps {
  visible: boolean;
  title: string;
  placeholder: string;
  data: IAddressCatalogLocation[];
  selectedId: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onSelect: (item: IAddressCatalogLocation) => void;
  onClose: () => void;
}

const fieldLabelClass =
  'font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-brass-ink';
const inputClass =
  'h-11 rounded-subtle border border-landing-line bg-landing-paper/60 px-3.5 font-sans text-body-md text-landing-obsidian';
const primaryActionClass =
  'h-11 flex-row items-center justify-center rounded-subtle bg-oxblood px-6';
const secondaryActionClass =
  'h-11 items-center justify-center rounded-subtle border border-landing-line px-5';
const actionLabelClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper';
const outlineActionLabelClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian';
const errorNoticeClass = 'flex-row items-start gap-3 border-l-2 border-danger bg-landing-paper/60 px-4 py-3';

function normalizePhone(value: string) {
  const compact = value.trim().replace(/[\s.-]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
}

function isValidPhone(value: string) {
  return /^0(3|5|7|8|9)\d{8}$/.test(normalizePhone(value));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) return error.message;
  return fallback;
}

function LocationPickerModal({
  visible,
  title,
  placeholder,
  data,
  selectedId,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onSelect,
  onClose,
}: LocationPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return data;
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.aliases.some((alias) => alias.toLowerCase().includes(keyword)),
    );
  }, [data, query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={() => setQuery('')}
    >
      <SafeAreaView className="flex-1 bg-landing-paper">
        <View className="flex-row items-center gap-4 border-b border-landing-line px-5 pb-4 pt-5">
          <Text
            accessibilityRole="header"
            className="flex-1 font-display text-[22px] leading-tight text-landing-obsidian"
          >
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            className="-mr-2 h-11 w-11 items-center justify-center active:opacity-70"
          >
            <X size={20} strokeWidth={1.75} color={COLORS.muted} />
          </Pressable>
        </View>

        <View className="border-b border-landing-line px-5 py-3">
          <View className="h-11 flex-row items-center gap-2 rounded-subtle border border-landing-line bg-ivory/80 px-3">
            <Search size={16} strokeWidth={1.75} color={COLORS.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={placeholder}
              placeholderTextColor={COLORS.muted}
              returnKeyType="search"
              className="flex-1 font-sans text-body-md text-landing-obsidian"
            />
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center gap-3 px-6">
            <ActivityIndicator color={COLORS.oxblood} />
            <Text className="font-sans text-body-sm text-landing-muted">
              Đang tải danh sách...
            </Text>
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center gap-2 px-8">
            <Text className="text-center font-display text-[19px] leading-tight text-landing-obsidian">
              Không thể tải danh sách địa chỉ
            </Text>
            <Text className="text-center font-sans text-body-sm leading-relaxed text-landing-muted">
              {errorMessage || 'Vui lòng kiểm tra kết nối và thử lại.'}
            </Text>
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="Thử lại"
              className={`${secondaryActionClass} mt-3 flex-row gap-2 active:bg-ivory`}
            >
              <RefreshCw size={15} strokeWidth={1.75} color={COLORS.oxblood} />
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood">
                Thử lại
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            className="flex-1"
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="pb-8"
            ListEmptyComponent={
              <View className="items-center justify-center gap-3 px-8 py-16">
                <MapPin size={28} strokeWidth={1.5} color={COLORS.muted} />
                <Text className="text-center font-sans text-body-md leading-relaxed text-landing-muted">
                  {query ? 'Không tìm thấy địa chỉ phù hợp.' : 'Chưa có dữ liệu địa chỉ.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => onSelect(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className="min-h-14 flex-row items-center justify-between gap-3 border-b border-landing-line px-4 py-3 active:bg-ivory"
                >
                  <Text className="flex-1 font-sans text-body-md text-landing-obsidian">
                    {item.name}
                  </Text>
                  {isSelected ? (
                    <Check size={18} strokeWidth={2} color={COLORS.oxblood} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

export function AddressForm({
  initial,
  mode = 'book',
  isSaving = false,
  errorMessage,
  onCancel,
  onSubmit,
}: AddressFormProps) {
  const [recipientName, setRecipientName] = useState(initial?.recipientName ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [addressLine, setAddressLine] = useState(initial?.addressLine ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [provinceId, setProvinceId] = useState(initial?.ghnProvinceV3Id ?? '');
  const [wardId, setWardId] = useState(initial?.ghnWardV3Id ?? '');
  const [provinceName, setProvinceName] = useState(initial?.provinceName ?? '');
  const [wardName, setWardName] = useState(initial?.wardName ?? '');
  const [formError, setFormError] = useState('');
  const [picker, setPicker] = useState<'province' | 'ward' | null>(null);

  const capabilities = useShippingCapabilities();
  const catalogRevision = capabilities.data?.catalogRevision ?? null;
  const provincesQuery = useAddressCatalogProvinces(catalogRevision);
  const wardsQuery = useAddressCatalogWards(provinceId || null, catalogRevision);

  const provinceOptions = useMemo(() => {
    const list = provincesQuery.data ?? [];
    if (provinceId && provinceName && !list.some((item) => item.id === provinceId)) {
      return [
        {
          id: provinceId,
          name: provinceName,
          aliases: [],
          catalogRevision: catalogRevision ?? '',
        },
        ...list,
      ];
    }
    return list;
  }, [catalogRevision, provinceId, provinceName, provincesQuery.data]);

  const wardOptions = useMemo(() => {
    const list = wardsQuery.data ?? [];
    if (wardId && wardName && !list.some((item) => item.id === wardId)) {
      return [
        {
          id: wardId,
          name: wardName,
          aliases: [],
          catalogRevision: catalogRevision ?? '',
        },
        ...list,
      ];
    }
    return list;
  }, [catalogRevision, wardId, wardName, wardsQuery.data]);

  const catalogError =
    capabilities.isError || provincesQuery.isError || (!catalogRevision && capabilities.isSuccess);

  const catalogErrorMessage = capabilities.isError
    ? getErrorMessage(capabilities.error, 'Không thể tải danh mục địa chỉ.')
    : provincesQuery.isError
      ? getErrorMessage(provincesQuery.error, 'Không thể tải danh sách Tỉnh/Thành.')
      : 'Danh mục Tỉnh/Thành/Phường/Xã chưa sẵn sàng. Vui lòng thử lại.';

  const retryCatalog = () => {
    if (capabilities.isError || !catalogRevision) capabilities.refetch();
    if (catalogRevision) provincesQuery.refetch();
  };

  const writesDisabled = capabilities.data?.newAddressWriteEnabled === false;
  const provinceDisabled =
    capabilities.isLoading || provincesQuery.isLoading || !catalogRevision || writesDisabled;

  const wardDisabled = !provinceId || wardsQuery.isLoading || !catalogRevision;

  const handleSelectProvince = (item: IAddressCatalogLocation) => {
    setProvinceId(item.id);
    setProvinceName(item.name);
    setWardId('');
    setWardName('');
    setPicker(null);
  };

  const handleSelectWard = (item: IAddressCatalogLocation) => {
    setWardId(item.id);
    setWardName(item.name);
    setPicker(null);
  };

  const handleSubmit = () => {
    const trimmedName = recipientName.trim();
    const trimmedAddressLine = addressLine.trim();
    const normalizedPhone = normalizePhone(phone);

    if (!trimmedName) {
      setFormError('Vui lòng nhập tên người nhận.');
      return;
    }
    if (!isValidPhone(phone)) {
      setFormError('Số điện thoại Việt Nam không hợp lệ.');
      return;
    }
    if (trimmedAddressLine.length < 5) {
      setFormError('Vui lòng nhập số nhà và tên đường đầy đủ.');
      return;
    }
    if (!provinceId || !wardId) {
      setFormError('Vui lòng chọn Tỉnh/Thành và Phường/Xã.');
      return;
    }

    setFormError('');
    onSubmit({
      recipientName: trimmedName,
      phone: normalizedPhone,
      addressLine: trimmedAddressLine,
      label: label.trim() || undefined,
      ghnProvinceV3Id: provinceId,
      ghnWardV3Id: wardId,
      provinceName,
      wardName,
      isDefault,
    });
  };

  const submitDisabled = Boolean(catalogError || writesDisabled || isSaving);

  return (
    <View className="gap-4 rounded-subtle border border-landing-line bg-ivory p-5">
      <Text
        accessibilityRole="header"
        className="font-display text-[22px] leading-tight text-landing-obsidian"
      >
        {mode === 'book' ? (initial?.id ? 'Sửa địa chỉ' : 'Địa chỉ mới') : 'Nhập địa chỉ giao hàng'}
      </Text>

      {catalogError && (
        <View className={errorNoticeClass}>
          <AlertCircle size={16} strokeWidth={1.75} color={COLORS.danger} />
          <View className="flex-1 gap-1">
            <Text className="font-sans text-body-sm font-semibold text-landing-obsidian">
              Không thể tải danh mục địa chỉ
            </Text>
            <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
              {catalogErrorMessage}
            </Text>
          </View>
          <Pressable
            onPress={retryCatalog}
            accessibilityRole="button"
            accessibilityLabel="Thử lại danh mục địa chỉ"
            className="-mr-1 h-11 w-11 shrink-0 items-center justify-center active:opacity-70"
          >
            <RefreshCw size={16} strokeWidth={1.75} color={COLORS.danger} />
          </Pressable>
        </View>
      )}

      <View className="gap-1.5">
        <Text className={fieldLabelClass}>Người nhận</Text>
        <TextInput
          value={recipientName}
          onChangeText={setRecipientName}
          placeholder="Người nhận"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="words"
          accessibilityLabel="Người nhận"
          className={inputClass}
        />
      </View>

      <View className="gap-1.5">
        <Text className={fieldLabelClass}>Số điện thoại</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Số điện thoại"
          placeholderTextColor={COLORS.muted}
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={20}
          accessibilityLabel="Số điện thoại"
          className={`${inputClass} font-mono`}
        />
      </View>

      <View className="gap-1.5">
        <Text className={fieldLabelClass}>Số nhà, tên đường</Text>
        <TextInput
          value={addressLine}
          onChangeText={setAddressLine}
          placeholder="Số nhà, tên đường"
          placeholderTextColor={COLORS.muted}
          accessibilityLabel="Số nhà, tên đường"
          className={inputClass}
        />
      </View>

      <View className="gap-1.5">
        <Text className={fieldLabelClass}>Tỉnh / Thành phố</Text>
        <Pressable
          onPress={() => setPicker('province')}
          disabled={provinceDisabled}
          accessibilityRole="button"
          accessibilityLabel="Chọn Tỉnh/Thành sau sáp nhập"
          className={`h-11 flex-row items-center justify-between rounded-subtle border border-landing-line bg-landing-paper/60 px-3.5 ${
            provinceDisabled ? 'opacity-60' : 'active:bg-ivory'
          }`}
        >
          <Text
            className={`flex-1 font-sans text-body-md ${
              provinceName ? 'text-landing-obsidian' : 'text-landing-muted'
            }`}
            numberOfLines={1}
          >
            {provincesQuery.isLoading
              ? 'Đang tải Tỉnh/Thành...'
              : provinceName || 'Chọn Tỉnh/Thành (sau sáp nhập)'}
          </Text>
          <ChevronDown size={16} strokeWidth={1.75} color={COLORS.muted} />
        </Pressable>
      </View>

      <View className="gap-1.5">
        <Text className={fieldLabelClass}>Phường / Xã</Text>
        <Pressable
          onPress={() => setPicker('ward')}
          disabled={wardDisabled}
          accessibilityRole="button"
          accessibilityLabel="Chọn Phường/Xã"
          className={`h-11 flex-row items-center justify-between rounded-subtle border border-landing-line bg-landing-paper/60 px-3.5 ${
            wardDisabled ? 'opacity-60' : 'active:bg-ivory'
          }`}
        >
          <Text
            className={`flex-1 font-sans text-body-md ${
              wardName ? 'text-landing-obsidian' : 'text-landing-muted'
            }`}
            numberOfLines={1}
          >
            {wardsQuery.isLoading
              ? 'Đang tải Phường/Xã...'
              : wardName || (provinceId ? 'Chọn Phường/Xã' : 'Chọn Tỉnh/Thành trước')}
          </Text>
          <ChevronDown size={16} strokeWidth={1.75} color={COLORS.muted} />
        </Pressable>
      </View>

      {wardsQuery.isError && (
        <View className="flex-row items-center gap-3 border-l-2 border-danger bg-landing-paper/60 px-4 py-3">
          <AlertCircle size={16} strokeWidth={1.75} color={COLORS.danger} />
          <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-obsidian">
            {getErrorMessage(wardsQuery.error, 'Không thể tải danh sách Phường/Xã.')}
          </Text>
          <Pressable
            onPress={() => wardsQuery.refetch()}
            accessibilityRole="button"
            accessibilityLabel="Thử lại danh sách Phường/Xã"
            className="-mr-1 h-11 w-11 shrink-0 items-center justify-center active:opacity-70"
          >
            <RefreshCw size={16} strokeWidth={1.75} color={COLORS.danger} />
          </Pressable>
        </View>
      )}

      <View className="gap-1.5">
        <Text className={fieldLabelClass}>
          Nhãn{' '}
          <Text className="font-normal normal-case tracking-normal text-landing-muted">
            (không bắt buộc)
          </Text>
        </Text>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="Nhà riêng, Văn phòng"
          placeholderTextColor={COLORS.muted}
          maxLength={50}
          accessibilityLabel="Nhãn"
          className={inputClass}
        />
      </View>
      <Pressable
        onPress={() => setIsDefault((value) => !value)}
        className="min-h-11 flex-row items-center gap-2.5 active:opacity-70"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDefault }}
      >
        <View
          className={`h-[18px] w-[18px] items-center justify-center rounded-subtle border ${
            isDefault ? 'border-oxblood bg-oxblood' : 'border-landing-obsidian/40'
          }`}
        >
          {isDefault && <Check size={12} strokeWidth={2.5} color={COLORS.paper} />}
        </View>
        <Text className="font-sans text-body-md text-landing-obsidian">
          Đặt làm mặc định
        </Text>
      </Pressable>

      {(formError || errorMessage) && (
        <View className={errorNoticeClass}>
          <AlertCircle size={16} strokeWidth={1.75} color={COLORS.danger} />
          <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-obsidian">
            {formError || errorMessage}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-end gap-2">
        {onCancel && (
          <Pressable
            onPress={onCancel}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Hủy"
            className={`${secondaryActionClass} ${
              isSaving ? 'opacity-50' : 'active:bg-landing-paper'
            }`}
          >
            <Text className={outlineActionLabelClass}>Hủy</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleSubmit}
          disabled={submitDisabled}
          accessibilityRole="button"
          accessibilityLabel={mode === 'book' ? 'Lưu địa chỉ' : 'Dùng địa chỉ này'}
          accessibilityState={{ disabled: submitDisabled }}
          className={`${primaryActionClass} ${
            submitDisabled ? 'opacity-50' : 'active:bg-landing-obsidian'
          }`}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.paper} />
          ) : (
            <Text className={actionLabelClass}>
              {mode === 'book' ? 'Lưu địa chỉ' : 'Dùng địa chỉ này'}
            </Text>
          )}
        </Pressable>
      </View>

      <LocationPickerModal
        visible={picker === 'province'}
        title="Chọn Tỉnh/Thành"
        placeholder="Tìm Tỉnh/Thành..."
        data={provinceOptions}
        selectedId={provinceId}
        isLoading={capabilities.isLoading || provincesQuery.isLoading}
        isError={capabilities.isError || provincesQuery.isError}
        errorMessage={catalogErrorMessage}
        onRetry={retryCatalog}
        onSelect={handleSelectProvince}
        onClose={() => setPicker(null)}
      />

      <LocationPickerModal
        visible={picker === 'ward'}
        title="Chọn Phường/Xã"
        placeholder="Tìm Phường/Xã..."
        data={wardOptions}
        selectedId={wardId}
        isLoading={wardsQuery.isLoading}
        isError={wardsQuery.isError}
        errorMessage={getErrorMessage(
          wardsQuery.error,
          'Không thể tải danh sách Phường/Xã.',
        )}
        onRetry={() => wardsQuery.refetch()}
        onSelect={handleSelectWard}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}
