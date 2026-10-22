import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Check,
  MapPin,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { ApiError } from '@/types/api';
import { ProfileStackParamList, RootStackParamList } from '@/navigation/types';
import { IUserAddress } from '../api/users.api';
import { AddressForm, IAddressDraft } from '../components/AddressForm';
import { useAddressMutations, useUserAddresses } from '../hooks/use-address-book';

const ADDRESS_LIMIT = 10;

type AddressesNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'Addresses'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function getAddressErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.code === 'ADDRESS_LIMIT_REACHED') {
      return 'Bạn đã lưu tối đa 10 địa chỉ.';
    }
    if (error.code === 'ADDRESS_VERSION_CONFLICT') {
      return 'Địa chỉ vừa được cập nhật ở nơi khác. Vui lòng tải lại rồi thử lại.';
    }
    return error.message || fallback;
  }
  return fallback;
}

function formatAddress(address: IUserAddress) {
  return [address.addressLine, address.wardName, address.provinceName]
    .filter(Boolean)
    .join(', ');
}

export function AddressesScreen() {
  const navigation = useNavigation<AddressesNavigationProp>();
  const scrollRef = useRef<ScrollView>(null);

  const addressesQuery = useUserAddresses();
  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);
  const {
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddressMutations();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IUserAddress | null>(null);
  const [formError, setFormError] = useState('');

  const isSaving = createAddress.isPending || updateAddress.isPending;
  const isAtLimit = addresses.length >= ADDRESS_LIMIT;

  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((a, b) => {
        if (a.isDefault === b.isDefault) return 0;
        return a.isDefault ? -1 : 1;
      }),
    [addresses],
  );

  const openCreateForm = () => {
    if (isAtLimit) return;
    setEditing(null);
    setFormError('');
    setShowForm(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const openEditForm = (address: IUserAddress) => {
    setEditing(address);
    setFormError('');
    setShowForm(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormError('');
  };

  const handleSubmit = async (draft: IAddressDraft) => {
    const payload = {
      recipientName: draft.recipientName,
      phone: draft.phone,
      addressLine: draft.addressLine,
      label: draft.label,
      ghnProvinceV3Id: draft.ghnProvinceV3Id,
      ghnWardV3Id: draft.ghnWardV3Id,
      isDefault: draft.isDefault,
    };

    try {
      if (editing) {
        await updateAddress.mutateAsync({
          id: editing.id,
          data: { ...payload, expectedVersion: editing.version },
        });
      } else {
        await createAddress.mutateAsync(payload);
      }
      closeForm();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ADDRESS_VERSION_CONFLICT') {
        Alert.alert(
          'Địa chỉ đã thay đổi',
          'Địa chỉ này vừa được cập nhật ở nơi khác. Danh sách sẽ được tải lại.',
          [{ text: 'Đóng' }],
        );
        closeForm();
        addressesQuery.refetch();
        return;
      }
      setFormError(getAddressErrorMessage(error, 'Không thể lưu địa chỉ. Vui lòng thử lại.'));
    }
  };

  const handleDelete = (address: IUserAddress) => {
    Alert.alert(
      'Xóa địa chỉ',
      address.isDefault
        ? 'Địa chỉ này đang là mặc định. Nếu xóa, hệ thống sẽ chọn một địa chỉ khác làm mặc định.'
        : 'Bạn có chắc muốn xóa địa chỉ này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress.mutateAsync(address.id);
              if (editing?.id === address.id) closeForm();
            } catch (error) {
              Alert.alert(
                'Không thể xóa địa chỉ',
                getAddressErrorMessage(error, 'Vui lòng thử lại.'),
              );
            }
          },
        },
      ],
    );
  };

  const handleSetDefault = async (address: IUserAddress) => {
    try {
      await setDefaultAddress.mutateAsync(address.id);
    } catch (error) {
      Alert.alert(
        'Không thể đặt mặc định',
        getAddressErrorMessage(error, 'Vui lòng thử lại.'),
      );
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={addressesQuery.isRefetching}
            onRefresh={() => addressesQuery.refetch()}
            tintColor="#5D1C34"
          />
        }
      >
        <BackButton onPress={() => navigation.goBack()} />
        <Text className="mb-1 text-headline-lg font-bold text-primary">
          Sổ địa chỉ giao hàng
        </Text>
        <Text className="mb-4 text-body-sm text-on-surface-variant">
          {addresses.length}/{ADDRESS_LIMIT} địa chỉ. Địa chỉ đầu tiên sẽ tự động là mặc định.
        </Text>

        <Button
          title="Thêm địa chỉ"
          size="lg"
          onPress={openCreateForm}
          disabled={isAtLimit || addressesQuery.isLoading}
          className="mb-4 w-full rounded-xl"
          textClassName="text-white"
        />

        {isAtLimit && (
          <Text className="mb-3 text-body-sm text-on-surface-variant">
            Bạn đã đạt giới hạn 10 địa chỉ. Hãy xóa bớt để thêm địa chỉ mới.
          </Text>
        )}

        {showForm && (
          <View className="mb-4">
            <AddressForm
              key={editing?.id ?? 'new'}
              initial={editing}
              mode="book"
              isSaving={isSaving}
              errorMessage={formError}
              onCancel={closeForm}
              onSubmit={handleSubmit}
            />
          </View>
        )}

        {addressesQuery.isLoading ? (
          <View className="items-center justify-center rounded-2xl bg-surface-lowest py-12">
            <ActivityIndicator size="large" color="#5D1C34" />
            <Text className="mt-3 text-body-sm text-on-surface-variant">
              Đang tải địa chỉ...
            </Text>
          </View>
        ) : addressesQuery.isError ? (
          <View className="items-center justify-center rounded-2xl bg-surface-lowest px-6 py-10">
            <MapPin size={36} className="text-danger" />
            <Text className="mt-3 text-center text-body-md font-semibold text-on-surface">
              Không thể tải sổ địa chỉ
            </Text>
            <Text className="mt-1 text-center text-body-sm text-on-surface-variant">
              {getAddressErrorMessage(
                addressesQuery.error,
                'Vui lòng kiểm tra kết nối và thử lại.',
              )}
            </Text>
            <Pressable
              onPress={() => addressesQuery.refetch()}
              className="mt-4 min-h-11 flex-row items-center gap-2 rounded-xl border border-surface-line px-4"
            >
              <RefreshCw size={16} className="text-primary" />
              <Text className="text-label-md font-semibold text-primary">Thử lại</Text>
            </Pressable>
          </View>
        ) : sortedAddresses.length === 0 && !showForm ? (
          <View className="items-center justify-center rounded-2xl border border-surface-line bg-surface-lowest px-6 py-12">
            <MapPin size={36} className="text-outline" />
            <Text className="mt-3 text-center text-body-md font-semibold text-on-surface">
              Bạn chưa có địa chỉ giao hàng.
            </Text>
            <Text className="mt-1 text-center text-body-sm text-on-surface-variant">
              Thêm địa chỉ để đặt hàng nhanh hơn.
            </Text>
          </View>
        ) : (
          sortedAddresses.map((address) => (
            <View
              key={address.id}
              className={`mb-3 rounded-2xl border bg-surface-lowest p-4 ${
                address.isDefault ? 'border-primary/40' : 'border-surface-line'
              }`}
            >
              <View className="mb-1.5 flex-row items-start justify-between gap-3">
                <View className="flex-1 flex-row flex-wrap items-center gap-2">
                  <Text className="text-body-md font-bold text-on-surface">
                    {address.recipientName}
                  </Text>
                  {address.isDefault && (
                    <View className="rounded-full bg-primary/10 px-2 py-0.5">
                      <Text className="text-2xs font-bold text-primary">Mặc định</Text>
                    </View>
                  )}
                  {!!address.label && (
                    <View className="rounded-full bg-surface px-2 py-0.5">
                      <Text className="text-2xs text-on-surface-variant">{address.label}</Text>
                    </View>
                  )}
                </View>
                <Text className="text-body-sm text-on-surface-variant">{address.phone}</Text>
              </View>

              <Text className="mb-3 text-body-sm leading-5 text-on-surface-variant">
                {formatAddress(address)}
              </Text>

              <View className="flex-row flex-wrap items-center gap-3">
                {!address.isDefault && (
                  <Pressable
                    onPress={() => handleSetDefault(address)}
                    disabled={setDefaultAddress.isPending}
                    className="min-h-11 flex-row items-center gap-1.5"
                  >
                    <Check size={15} className="text-primary" />
                    <Text className="text-body-sm font-semibold text-primary">
                      Đặt mặc định
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => openEditForm(address)}
                  className="min-h-11 flex-row items-center gap-1.5"
                >
                  <Pencil size={15} className="text-on-surface-variant" />
                  <Text className="text-body-sm font-semibold text-on-surface">Sửa</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(address)}
                  disabled={deleteAddress.isPending}
                  className="min-h-11 flex-row items-center gap-1.5"
                >
                  <Trash2 size={15} className="text-danger" />
                  <Text className="text-body-sm font-semibold text-danger">Xóa</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
