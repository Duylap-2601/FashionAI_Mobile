import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronDown, MapPin, RefreshCw, Search, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
      <SafeAreaView className="flex-1 bg-surface-lowest">
        <View className="flex-row items-center border-b border-surface-line px-4 py-3">
          <Text className="flex-1 text-headline-sm font-bold text-on-surface">{title}</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            className="min-h-11 min-w-11 items-center justify-center rounded-full active:bg-surface"
          >
            <X size={22} className="text-on-surface" />
          </Pressable>
        </View>

        <View className="px-4 pt-4">
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            containerClassName="mb-3"
            fieldContainerClassName="rounded-xl"
            leftIcon={<Search size={18} className="text-on-surface-variant" />}
            returnKeyType="search"
          />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center px-6">
            <ActivityIndicator size="large" color="#5D1C34" />
            <Text className="mt-3 text-body-md text-on-surface-variant">
              Đang tải danh sách...
            </Text>
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-8">
            <MapPin size={36} className="text-danger" />
            <Text className="mt-3 text-center text-body-md font-semibold text-on-surface">
              Không thể tải danh sách địa chỉ
            </Text>
            <Text className="mt-1 text-center text-body-sm text-on-surface-variant">
              {errorMessage || 'Vui lòng kiểm tra kết nối và thử lại.'}
            </Text>
            <Pressable
              onPress={onRetry}
              className="mt-4 min-h-11 flex-row items-center gap-2 rounded-xl border border-surface-line px-4"
            >
              <RefreshCw size={16} className="text-primary" />
              <Text className="text-label-md font-semibold text-primary">Thử lại</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            className="flex-1"
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={
              <View className="items-center justify-center px-8 py-16">
                <MapPin size={36} className="text-outline" />
                <Text className="mt-3 text-center text-body-md text-on-surface-variant">
                  {query
                    ? 'Không tìm thấy địa chỉ phù hợp.'
                    : 'Chưa có dữ liệu địa chỉ.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => onSelect(item)}
                  className="min-h-14 flex-row items-center justify-between border-b border-surface-line px-4 py-3 active:bg-surface"
                >
                  <Text className="mr-3 flex-1 text-body-lg text-on-surface">{item.name}</Text>
                  {isSelected && <Check size={20} className="text-primary" />}
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
  const isDefaultLocked = initial?.isDefault === true;
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

  return (
    <View className="rounded-3xl border border-surface-line bg-surface-lowest p-5">
      <Text className="mb-3 text-headline-sm font-bold text-primary">
        {mode === 'book' ? 'Địa chỉ mới' : 'Nhập địa chỉ giao hàng'}
      </Text>

      {catalogError && (
        <View className="mb-4 flex-row items-start justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 p-3">
          <View className="flex-1 flex-row items-start gap-2">
            <MapPin size={18} className="mt-0.5 text-danger" />
            <View className="flex-1">
              <Text className="text-label-md font-semibold text-danger">
                Không thể tải danh mục địa chỉ
              </Text>
              <Text className="mt-0.5 text-body-sm text-on-surface-variant">
                {catalogErrorMessage}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={retryCatalog}
            accessibilityRole="button"
            accessibilityLabel="Thử lại danh mục địa chỉ"
            className="min-h-11 min-w-11 items-center justify-center"
          >
            <RefreshCw size={16} className="text-danger" />
          </Pressable>
        </View>
      )}

      <Input
        value={recipientName}
        onChangeText={setRecipientName}
        placeholder="Người nhận"
        autoCapitalize="words"
        containerClassName="mb-3"
        fieldContainerClassName="rounded-xl"
      />
      <Input
        value={phone}
        onChangeText={setPhone}
        placeholder="Số điện thoại"
        keyboardType="phone-pad"
        maxLength={20}
        containerClassName="mb-3"
        fieldContainerClassName="rounded-xl"
      />
      <Input
        value={addressLine}
        onChangeText={setAddressLine}
        placeholder="Số nhà, tên đường"
        containerClassName="mb-3"
        fieldContainerClassName="rounded-xl"
      />

      <Pressable
        onPress={() => setPicker('province')}
        disabled={provinceDisabled}
        accessibilityRole="button"
        accessibilityLabel="Chọn Tỉnh/Thành sau sáp nhập"
        className={`mb-3 min-h-12 flex-row items-center justify-between rounded-xl border border-surface-line bg-surface-low px-3.5 ${
          provinceDisabled ? 'opacity-60' : 'active:bg-surface'
        }`}
      >
        <Text
          className={`flex-1 text-body-lg ${
            provinceName ? 'text-on-surface' : 'text-on-surface-variant'
          }`}
          numberOfLines={1}
        >
          {provincesQuery.isLoading
            ? 'Đang tải Tỉnh/Thành...'
            : provinceName || 'Tỉnh/Thành sau sáp nhập'}
        </Text>
        <ChevronDown size={18} className="text-on-surface-variant" />
      </Pressable>

      <Pressable
        onPress={() => setPicker('ward')}
        disabled={wardDisabled}
        accessibilityRole="button"
        accessibilityLabel="Chọn Phường/Xã"
        className={`mb-3 min-h-12 flex-row items-center justify-between rounded-xl border border-surface-line bg-surface-low px-3.5 ${
          wardDisabled ? 'opacity-60' : 'active:bg-surface'
        }`}
      >
        <Text
          className={`flex-1 text-body-lg ${
            wardName ? 'text-on-surface' : 'text-on-surface-variant'
          }`}
          numberOfLines={1}
        >
          {wardsQuery.isLoading
            ? 'Đang tải Phường/Xã...'
            : wardName || 'Chọn Tỉnh/Thành trước'}
        </Text>
        <ChevronDown size={18} className="text-on-surface-variant" />
      </Pressable>

      {wardsQuery.isError && (
        <View className="mb-3 flex-row items-center justify-between rounded-xl border border-danger/30 bg-danger/5 px-3 py-2">
          <Text className="mr-2 flex-1 text-body-sm text-danger">
            {getErrorMessage(wardsQuery.error, 'Không thể tải danh sách Phường/Xã.')}
          </Text>
          <Pressable
            onPress={() => wardsQuery.refetch()}
            accessibilityRole="button"
            accessibilityLabel="Thử lại danh sách Phường/Xã"
            className="min-h-11 min-w-11 items-center justify-center"
          >
            <RefreshCw size={16} className="text-danger" />
          </Pressable>
        </View>
      )}

      {mode === 'book' && (
        <>
          <Input
            value={label}
            onChangeText={setLabel}
            placeholder="Nhãn: Nhà riêng, Văn phòng"
            maxLength={50}
            containerClassName="mb-2"
            fieldContainerClassName="rounded-xl"
          />
          <Pressable
            onPress={() => setIsDefault((value) => !value)}
            disabled={isDefaultLocked}
            className={`mb-2 min-h-11 flex-row items-center gap-2.5 ${
              isDefaultLocked ? 'opacity-70' : ''
            }`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDefault, disabled: isDefaultLocked }}
          >
            <View
              className={`h-5 w-5 items-center justify-center rounded border ${
                isDefault ? 'border-primary bg-primary' : 'border-outline-variant bg-white'
              }`}
            >
              {isDefault && <Check size={14} className="text-primary-foreground" />}
            </View>
            <Text className="text-body-md text-on-surface">
              {isDefaultLocked ? 'Địa chỉ mặc định' : 'Đặt làm mặc định'}
            </Text>
          </Pressable>
        </>
      )}

      {(formError || errorMessage) && (
        <View className="mb-3 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2">
          <Text className="text-body-sm text-danger">{formError || errorMessage}</Text>
        </View>
      )}

      <View className="mt-2 flex-row justify-end gap-3">
        {onCancel && (
          <Button
            title="Hủy"
            variant="outline"
            size="md"
            onPress={onCancel}
            disabled={isSaving}
            className="min-w-24 rounded-xl"
          />
        )}
        <Button
          title={mode === 'book' ? 'Lưu địa chỉ' : 'Dùng địa chỉ này'}
          size="md"
          onPress={handleSubmit}
          loading={isSaving}
          disabled={catalogError || writesDisabled}
          className="min-w-32 rounded-xl"
          textClassName="text-white"
        />
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
