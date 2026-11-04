import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus } from 'lucide-react-native';
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

const ACTION_LABEL_CLASS = 'font-sans text-[11px] font-semibold uppercase tracking-[0.16em]';
const SMALL_ACTION_LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em]';

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
      'Xóa địa chỉ này?',
      address.isDefault
        ? `${address.recipientName}, ${formatAddress(address)}. Địa chỉ này đang là mặc định, hệ thống sẽ chọn một địa chỉ khác làm mặc định.`
        : `${address.recipientName}, ${formatAddress(address)}`,
      [
        { text: 'Giữ lại', style: 'cancel' },
        {
          text: 'Xóa địa chỉ',
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
            className="font-display text-[30px] leading-tight text-landing-obsidian"
          >
            Sổ địa chỉ
          </Text>
          <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
            Địa chỉ giao hàng dùng khi đặt may. Lưu tối đa {ADDRESS_LIMIT} địa chỉ, địa chỉ đầu tiên tự
            thành mặc định.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isAtLimit || addressesQuery.isLoading }}
          onPress={openCreateForm}
          disabled={isAtLimit || addressesQuery.isLoading}
          className={`h-11 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood ${
            isAtLimit ? 'opacity-50' : 'active:opacity-90'
          }`}
        >
          <Plus size={16} strokeWidth={1.75} color={COLORS.paper} />
          <Text className={`${ACTION_LABEL_CLASS} text-landing-paper`}>Thêm địa chỉ</Text>
        </Pressable>

        {isAtLimit && (
          <Text className="border-l-2 border-brass bg-ivory px-4 py-3 font-sans text-body-sm text-landing-obsidian">
            Bạn đã đạt giới hạn {ADDRESS_LIMIT} địa chỉ. Hãy xóa bớt để thêm địa chỉ mới.
          </Text>
        )}

        {showForm && (
          <AddressForm
            key={editing?.id ?? 'new'}
            initial={editing ?? (addresses.length === 0 ? { isDefault: true } : null)}
            mode="book"
            isSaving={isSaving}
            errorMessage={formError}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        )}

        {addressesQuery.isLoading ? (
          <View accessibilityLabel="Đang tải sổ địa chỉ" className="gap-3">
            {[0, 1].map((key) => (
              <View key={key} className="h-24 bg-taupe/30" />
            ))}
          </View>
        ) : addressesQuery.isError ? (
          <View
            accessibilityRole="alert"
            className="items-center rounded-subtle border border-landing-line bg-ivory/60 px-6 py-14"
          >
            <Text className="text-center font-display text-[24px] leading-tight text-danger">
              Không tải được sổ địa chỉ
            </Text>
            <Text className="mt-2 max-w-error-state text-center font-sans text-body-sm leading-relaxed text-landing-muted">
              {getAddressErrorMessage(addressesQuery.error, 'Kiểm tra kết nối rồi thử lại.')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => addressesQuery.refetch()}
              className="mt-6 h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70"
            >
              <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>Thử lại</Text>
            </Pressable>
          </View>
        ) : sortedAddresses.length === 0 ? (
          !showForm ? (
            <View className="items-center rounded-subtle border border-landing-line bg-ivory/60 px-6 py-14">
              <Text className="text-center font-display text-[24px] leading-tight text-landing-obsidian">
                Chưa có địa chỉ nào
              </Text>
              <Text className="mt-2 max-w-error-state text-center font-sans text-body-sm leading-relaxed text-landing-muted">
                Thêm một địa chỉ để đặt hàng nhanh hơn. Địa chỉ đầu tiên sẽ là mặc định.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={openCreateForm}
                className="mt-6 h-11 items-center justify-center rounded-subtle bg-oxblood px-5 active:opacity-90"
              >
                <Text className={`${ACTION_LABEL_CLASS} text-landing-paper`}>Thêm địa chỉ</Text>
              </Pressable>
            </View>
          ) : null
        ) : (
          <View className="gap-2">
            <Text className="font-sans text-[12px] text-landing-muted">
              <Text className="font-mono text-landing-obsidian">
                {addresses.length}/{ADDRESS_LIMIT}
              </Text>{' '}
              địa chỉ
            </Text>
            <View className="border-y border-landing-line/70">
              {sortedAddresses.map((address, index) => (
                <View
                  key={address.id}
                  className={`gap-4 py-5 ${
                    index < sortedAddresses.length - 1 ? 'border-b border-landing-line/70' : ''
                  }`}
                >
                  <View>
                    <View className="flex-row flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Text className="font-sans text-body-md font-medium text-landing-obsidian">
                        {address.recipientName}
                      </Text>
                      <Text className="font-mono text-[13px] text-landing-muted">
                        {address.phone}
                      </Text>
                      {address.label ? (
                        <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
                          {address.label}
                        </Text>
                      ) : null}
                      {address.isDefault ? (
                        <View className="flex-row items-center gap-1.5">
                          <View className="h-1.5 w-1.5 rounded-full bg-oxblood" />
                          <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-oxblood">
                            Mặc định
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="mt-1.5 font-sans text-body-sm leading-relaxed text-landing-muted">
                      {formatAddress(address)}
                    </Text>
                  </View>

                  <View className="flex-row flex-wrap items-center gap-2">
                    {!address.isDefault && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Đặt địa chỉ của ${address.recipientName} làm mặc định`}
                        accessibilityState={{ disabled: setDefaultAddress.isPending }}
                        onPress={() => handleSetDefault(address)}
                        disabled={setDefaultAddress.isPending}
                        className={`mr-2 min-h-11 justify-center active:opacity-60 ${
                          setDefaultAddress.isPending ? 'opacity-50' : ''
                        }`}
                      >
                        <Text className="font-sans text-[12px] text-oxblood">Đặt mặc định</Text>
                      </Pressable>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Sửa địa chỉ của ${address.recipientName}`}
                      onPress={() => openEditForm(address)}
                      className="h-11 items-center justify-center rounded-subtle border border-landing-line px-3.5 active:opacity-70"
                    >
                      <Text className={`${SMALL_ACTION_LABEL_CLASS} text-landing-obsidian`}>Sửa</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Xóa địa chỉ của ${address.recipientName}`}
                      accessibilityState={{ disabled: deleteAddress.isPending }}
                      onPress={() => handleDelete(address)}
                      disabled={deleteAddress.isPending}
                      className={`h-11 items-center justify-center rounded-subtle border border-danger/40 px-3.5 active:opacity-70 ${
                        deleteAddress.isPending ? 'opacity-50' : ''
                      }`}
                    >
                      <Text className={`${SMALL_ACTION_LABEL_CLASS} text-danger`}>Xóa</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
