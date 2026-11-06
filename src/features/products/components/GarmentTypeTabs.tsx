import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { GARMENT_TYPE_TABS } from '../constants/product-filters';
import type { GarmentType } from '../types/product';

interface GarmentTypeTabsProps {
  activeGarmentType: GarmentType | null;
  onSelect: (garmentType: GarmentType | null) => void;
}

export function GarmentTypeTabs({
  activeGarmentType,
  onSelect,
}: GarmentTypeTabsProps) {
  return (
    // Underline text tabs, same labels and type as FE listing › CategoryTabs.
    <ScrollView
      horizontal
      accessibilityRole="tablist"
      accessibilityLabel="Loại trang phục"
      showsHorizontalScrollIndicator={false}
      className="border-b border-landing-line"
      contentContainerClassName="gap-xxl px-lg"
    >
      {GARMENT_TYPE_TABS.map((tab) => {
        const isActive = activeGarmentType === (tab.garmentType ?? null);
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onSelect(tab.garmentType ?? null)}
            className="min-h-11 justify-center pb-2.5 active:opacity-70"
          >
            <Text
              className={`font-sans text-[11px] uppercase tracking-[0.16em] ${
                isActive
                  ? 'font-semibold text-landing-oxblood'
                  : 'font-medium text-landing-muted'
              }`}
            >
              {tab.label}
            </Text>
            {isActive ? (
              <View className="absolute inset-x-0 bottom-0 h-0.5 bg-landing-oxblood" />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
