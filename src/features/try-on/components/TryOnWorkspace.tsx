import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { TryOnEntryParams } from '@/navigation/types';
import { authApi } from '@/features/auth/api/auth.api';
import { getProduct } from '@/features/products/api/products.api';
import { IProduct } from '@/features/products/types/product';
import { TryOnModeToggle, TryOnSharedIntro } from '@/features/try-on/components/TryOnHeader';
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
  comboUpper: IProduct | null;
  comboLower: IProduct | null;
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
  const [tab, setTab] = useState<TryOnTab>(initialTab);
  const [singleProduct, setSingleProduct] = useState<IProduct | null>(null);
  const [comboUpper, setComboUpper] = useState<IProduct | null>(null);
  const [comboLower, setComboLower] = useState<IProduct | null>(null);
  const [picker, setPicker] = useState<{ open: boolean; slot: TryOnPickerSlot }>({
    open: false,
    slot: 'single',
  });
  const [quota, setQuota] = useState<{ remaining?: number; limit?: number } | null>(null);

  // Sản phẩm đi kèm từ màn Chi tiết (Dev 2): nạp đủ thông tin để thử ngay,
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

  const handleTabChange = (next: string) => {
    if (next !== 'photo' && next !== 'live') return;
    setTab(next);
  };

  const handleSelectProduct = (product: IProduct) => {
    if (picker.slot === 'upper') {
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
    comboUpper,
    comboLower,
    openPicker: (slot) => setPicker({ open: true, slot }),
  };

  return (
    <View className="flex-1 bg-background">
      {tab === 'photo' ? (
        <ScrollView className="flex-1" contentContainerClassName="p-xl">
          <TryOnSharedIntro quota={quota} />
          <TryOnModeToggle value="photo" onChange={handleTabChange} />
          <PhotoTryOnContent selection={selection} onQuotaConsumed={refreshQuota} />
        </ScrollView>
      ) : (
        <LiveTryOnContent
          selection={selection}
          photoQuota={quota}
          onSwitchToPhoto={() => handleTabChange('photo')}
        />
      )}

      <ProductPickerSheet
        key={`${picker.slot}-${picker.open}`}
        visible={picker.open}
        onClose={() => setPicker((prev) => ({ ...prev, open: false }))}
        onSelect={handleSelectProduct}
        categories={
          picker.slot === 'upper'
            ? UPPER_ONLY
            : picker.slot === 'lower'
              ? LOWER_ONLY
              : PICKER_CATEGORIES
        }
        initialCategory={
          picker.slot === 'upper' ? 'UPPER' : picker.slot === 'lower' ? 'LOWER' : 'ALL'
        }
      />
    </View>
  );
};

export default TryOnWorkspace;
