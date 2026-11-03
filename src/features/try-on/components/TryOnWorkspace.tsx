import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TryOnEntryParams } from '@/navigation/types';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { getProduct } from '@/features/products/api/products.api';
import { IProduct } from '@/features/products/types/product';
import {
  TryOnMode,
  TryOnPageHeader,
  TryOnSubscriptionNotice,
} from '@/features/try-on/components/TryOnHeader';
import { PhotoTryOnContent } from '@/features/try-on/components/PhotoTryOnContent';
import { LiveTryOnContent } from '@/features/try-on/components/LiveTryOnContent';
import {
  PICKER_CATEGORIES,
  ProductPickerSheet,
  TryOnPickerSlot,
} from '@/features/try-on/components/ProductPickerSheet';

export type TryOnTab = 'photo' | 'live';

export interface SharedGarmentSelection {
  singleProduct: IProduct | null;
  comboOuter: IProduct | null;
  comboUpper: IProduct | null;
  comboLower: IProduct | null;
  clearOuter: () => void;
  openPicker: (slot: TryOnPickerSlot) => void;
}

interface TryOnWorkspaceProps {
  initialTab: TryOnTab;
  entry?: TryOnEntryParams;
}

const UPPER_ONLY = [{ value: 'UPPER' as const, label: 'Áo / Blazer' }];
const LOWER_ONLY = [{ value: 'LOWER' as const, label: 'Quần / Váy' }];

// Một màn duy nhất cho cả 2 chế độ: toggle điều khiển content bên dưới tại chỗ,
// chọn đồ dùng chung nên đổi tab không mất sản phẩm đã chọn.
export const TryOnWorkspace: React.FC<TryOnWorkspaceProps> = ({
  initialTab,
  entry,
}) => {
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [tab, setTab] = useState<TryOnTab>(initialTab);
  const [singleProduct, setSingleProduct] = useState<IProduct | null>(null);
  const [comboOuter, setComboOuter] = useState<IProduct | null>(null);
  const [comboUpper, setComboUpper] = useState<IProduct | null>(null);
  const [comboLower, setComboLower] = useState<IProduct | null>(null);
  const [picker, setPicker] = useState<{ open: boolean; slot: TryOnPickerSlot }>({
    open: false,
    slot: 'single',
  });
  const [quota, setQuota] = useState<{ remaining?: number; limit?: number } | null>(null);

  // Ảnh thử cần gói Member/VIP: tài khoản FREE hoặc gói đã hết hạn bị chặn.
  const { isBlocked, isSubscriptionExpired } = useMemo(() => {
    const tier = String(user?.tier ?? 'FREE').toUpperCase();
    const expiresAt = user?.tierExpiresAt as string | undefined;
    const expired =
      tier !== 'FREE' &&
      Boolean(expiresAt) &&
      new Date(expiresAt as string).getTime() < Date.now();
    return {
      isBlocked: tier === 'FREE' || expired,
      isSubscriptionExpired: expired,
    };
  }, [user?.tier, user?.tierExpiresAt]);

  const openSubscriptionPlans = () =>
    rootNavigation.navigate('SubscriptionPlans');

  // Sản phẩm đi kèm từ màn Chi tiết: nạp đủ thông tin để thử ngay,
  // đồng bộ cả 2 chế độ — ô đơn (1 món) luôn nhận, ô phối bộ nhận theo đúng
  // danh mục (UPPER → ô áo, LOWER → ô quần/váy; FULL_BODY chỉ thử đơn).
  useEffect(() => {
    if (!entry?.productId) return;
    let active = true;
    getProduct(entry.productId)
      .then((product) => {
        if (!active) return;
        setSingleProduct(product);
        if (product.category === 'UPPER') {
          setComboUpper(product);
        } else if (product.category === 'LOWER') {
          setComboLower(product);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [entry?.productId]);

  useEffect(() => {
    let active = true;
    authApi
      .getUserQuota('TRY_ON')
      .then((data: any) => {
        if (!active) return;
        const q = data?.TRY_ON ?? data?.try_on ?? data;
        if (typeof q?.remaining === 'number' || typeof q?.limit === 'number') {
          setQuota({ remaining: q.remaining, limit: q.limit });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const refreshQuota = () => {
    authApi
      .getUserQuota('TRY_ON')
      .then((data: any) => {
        const q = data?.TRY_ON ?? data?.try_on ?? data;
        if (typeof q?.remaining === 'number' || typeof q?.limit === 'number') {
          setQuota({ remaining: q.remaining, limit: q.limit });
        }
      })
      .catch(() => {});
  };

  const handleModeChange = (next: TryOnMode) => {
    setTab(next);
  };

  const handleSelectProduct = (product: IProduct) => {
    if (picker.slot === 'outer') {
      setComboOuter(product);
    } else if (picker.slot === 'upper') {
      if (comboLower && String(comboLower.id) === String(product.id)) return;
      setComboUpper(product);
    } else if (picker.slot === 'lower') {
      if (comboUpper && String(comboUpper.id) === String(product.id)) return;
      setComboLower(product);
    } else {
      setSingleProduct(product);
    }
  };

  const selection: SharedGarmentSelection = {
    singleProduct,
    comboOuter,
    comboUpper,
    comboLower,
    clearOuter: () => setComboOuter(null),
    openPicker: (slot) => setPicker({ open: true, slot }),
  };

  return (
    <View className="flex-1 bg-landing-paper">
      {tab === 'photo' ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-lg pb-xxxl pt-lg"
          showsVerticalScrollIndicator={false}
        >
          <TryOnPageHeader
            mode="photo"
            onModeChange={handleModeChange}
            photoQuota={quota}
            showUpgrade={isBlocked}
            onPressUpgrade={openSubscriptionPlans}
          />
          {isBlocked ? (
            <TryOnSubscriptionNotice
              isExpired={isSubscriptionExpired}
              onPressUpgrade={openSubscriptionPlans}
            />
          ) : null}
          <PhotoTryOnContent
            selection={selection}
            onQuotaConsumed={refreshQuota}
            isBlocked={isBlocked}
            onPressUpgrade={openSubscriptionPlans}
          />
        </ScrollView>
      ) : (
        <LiveTryOnContent
          selection={selection}
          photoQuota={quota}
          onSwitchToPhoto={() => handleModeChange('photo')}
        />
      )}

      <ProductPickerSheet
        key={`${picker.slot}-${picker.open}`}
        visible={picker.open}
        onClose={() => setPicker((prev) => ({ ...prev, open: false }))}
        onSelect={handleSelectProduct}
        selectedProductId={
          picker.slot === 'outer'
            ? comboOuter?.id
            : picker.slot === 'upper'
              ? comboUpper?.id
              : picker.slot === 'lower'
                ? comboLower?.id
                : singleProduct?.id
        }
        categories={
          picker.slot === 'upper' || picker.slot === 'outer'
            ? UPPER_ONLY
            : picker.slot === 'lower'
              ? LOWER_ONLY
              : PICKER_CATEGORIES
        }
        initialCategory={
          picker.slot === 'upper' || picker.slot === 'outer'
            ? 'UPPER'
            : picker.slot === 'lower'
              ? 'LOWER'
              : 'ALL'
        }
      />
    </View>
  );
};

export default TryOnWorkspace;
