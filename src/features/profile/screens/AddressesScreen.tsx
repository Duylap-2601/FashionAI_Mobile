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
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react-native';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
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
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-lg px-lg pb-giant pt-lg"
        refreshControl={
          <RefreshControl
            refreshing={addressesQuery.isRefetching}
            onRefresh={() => addressesQuery.refetch()}
            tintColor={COLORS.oxblood}
          />
        }
      >
        <BackButton onPress={() => navigation.goBack()} />

        <View className="gap-2 border-b border-landing-line pb-5">
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
            Tài khoản
          </Text>
          <Text
            accessibilityRole="header"
            className="font-display text-headline-lg text-landing-obsidian"
          >
            Sổ địa chỉ giao hàng
          </Text>
          <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
            {addresses.length}/{ADDRESS_LIMIT} địa chỉ. Địa chỉ đầu tiên sẽ tự động là mặc định.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={openCreateForm}
          disabled={isAtLimit || addressesQuery.isLoading}
          className={`h-12 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood ${
            isAtLimit ? 'opacity-50' : 'active:bg-landing-obsidian'
          }`}
        >
          <Plus size={16} strokeWidth={1.75} color={COLORS.paper} />
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
            Thêm địa chỉ
          </Text>
        </Pressable>

        {isAtLimit && (
          <Text className="border-l-2 border-brass bg-ivory px-4 py-3 font-sans text-body-sm text-landing-obsidian">
            Bạn đã đạt giới hạn 10 địa chỉ. Hãy xóa bớt để thêm địa chỉ mới.
          </Text>
        )}

        {showForm && (
          <AddressForm
            key={editing?.id ?? 'new'}
            initial={editing}
            mode="book"
            isSaving={isSaving}
            errorMessage={formError}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        )}

        {addressesQuery.isLoading ? (
          <View className="items-center justify-center gap-3 rounded-subtle border border-landing-line bg-ivory py-12">
            <ActivityIndicator color={COLORS.oxblood} />
            <Text className="font-sans text-body-sm text-landing-muted">
              Đang tải địa chỉ…
            </Text>
          </View>
        ) : addressesQuery.isError ? (
          <View className="items-center justify-center gap-2 rounded-subtle border border-landing-line bg-ivory px-6 py-10">
            <MapPin size={30} strokeWidth={1.5} color={COLORS.oxblood} />
            <Text className="mt-2 text-center font-display text-[19px] text-landing-obsidian">
              Không thể tải sổ địa chỉ
            </Text>
            <Text className="text-center font-sans text-body-sm text-landing-muted">
              {getAddressErrorMessage(
                addressesQuery.error,
                'Vui lòng kiểm tra kết nối và thử lại.',
              )}
            </Text>
            <Pressable
              onPress={() => addressesQuery.refetch()}
              className="mt-3 h-11 flex-row items-center gap-2 rounded-subtle border border-landing-line px-4 active:bg-landing-paper"
            >
              <RefreshCw size={15} strokeWidth={1.75} color={COLORS.oxblood} />
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood">
                Thử lại
              </Text>
            </Pressable>
          </View>
        ) : sortedAddresses.length === 0 && !showForm ? (
          <View className="items-center justify-center gap-2 rounded-subtle border border-dashed border-taupe bg-ivory px-6 py-12">
            <MapPin size={30} strokeWidth={1.5} color={COLORS.muted} />
            <Text className="mt-2 text-center font-display text-[19px] text-landing-obsidian">
              Bạn chưa có địa chỉ giao hàng
            </Text>
            <Text className="text-center font-sans text-body-sm text-landing-muted">
              Thêm địa chỉ để đặt hàng nhanh hơn.
            </Text>
          </View>
        ) : (
          sortedAddresses.map((address) => (
            <View
              key={address.id}
              className={`gap-3 rounded-subtle border bg-ivory p-4 ${
                address.isDefault ? 'border-oxblood/40' : 'border-landing-line'
              }`}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 flex-row flex-wrap items-center gap-2">
                  <Text className="font-display text-[17px] text-landing-obsidian">
                    {address.recipientName}
                  </Text>
                  {address.isDefault ? (
                    <Text className="border border-oxblood/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-oxblood">
                      Mặc định
                    </Text>
                  ) : null}
                  {address.label ? (
                    <Text className="border border-landing-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-landing-muted">
                      {address.label}
                    </Text>
                  ) : null}
                </View>
                <Text className="font-mono text-[12px] text-landing-obsidian">
                  {address.phone}
                </Text>
              </View>

              <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                {formatAddress(address)}
              </Text>

              <View className="flex-row flex-wrap items-center gap-4 border-t border-landing-line pt-2">
                {!address.isDefault && (
                  <Pressable
                    onPress={() => handleSetDefault(address)}
                    disabled={setDefaultAddress.isPending}
                    className="min-h-11 flex-row items-center gap-1.5 active:opacity-60"
                  >
                    <Check size={14} strokeWidth={2} color={COLORS.sageInk} />
                    <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sage-ink">
                      Đặt mặc định
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => openEditForm(address)}
                  className="min-h-11 flex-row items-center gap-1.5 active:opacity-60"
                >
                  <Pencil size={14} strokeWidth={1.75} color={COLORS.obsidian} />
                  <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-landing-obsidian">
                    Sửa
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(address)}
                  disabled={deleteAddress.isPending}
                  className="min-h-11 flex-row items-center gap-1.5 active:opacity-60"
                >
                  <Trash2 size={14} strokeWidth={1.75} color={COLORS.oxblood} />
                  <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-oxblood">
                    Xóa
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
