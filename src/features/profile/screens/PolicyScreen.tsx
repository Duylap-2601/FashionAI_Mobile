import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { COLORS, SPACING } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { PolicyDocumentView } from '../components/PolicyDocumentView';
import {
  POLICY_DOCUMENTS,
  resolvePolicyType,
} from '../constants/policies/policy-documents';
import { POLICY_NAV_ITEMS } from '../constants/policies/policy-nav';
import type { PolicyLinkTarget, PolicyType } from '../types/policy';

type PolicyScreenProps = NativeStackScreenProps<RootStackParamList, 'Policy'>;

const tabStyle = tva({
  base: 'min-h-11 justify-center border-b-2',
  variants: {
    selected: {
      true: 'border-oxblood',
      false: 'border-transparent',
    },
  },
});

const tabTextStyle = tva({
  base: 'font-sans text-body-sm',
  variants: {
    selected: {
      true: 'font-semibold text-obsidian',
      false: 'text-landing-muted',
    },
  },
});

/**
 * Return, warranty, size guide, privacy and terms pages. Content comes from
 * typed constants copied from FE (`constants/policies`); the `type` route
 * param picks the page.
 */
export function PolicyScreen({ navigation, route }: PolicyScreenProps) {
  const activeType = resolvePolicyType(route.params?.type);
  const policy = POLICY_DOCUMENTS[activeType];
  const tabsRef = useRef<ScrollView>(null);
  const tabOffsetsRef = useRef<Partial<Record<PolicyType, number>>>({});

  const scrollTabIntoView = useCallback((type: PolicyType, animated: boolean) => {
    const offset = tabOffsetsRef.current[type];
    if (offset !== undefined) {
      tabsRef.current?.scrollTo({ x: Math.max(0, offset - SPACING.lg), animated });
    }
  }, []);

  // In-document links can switch to a tab that is scrolled out of view.
  useEffect(() => {
    scrollTabIntoView(activeType, true);
  }, [activeType, scrollTabIntoView]);

  const handleTabLayout = useCallback(
    (type: PolicyType, event: LayoutChangeEvent) => {
      tabOffsetsRef.current[type] = event.nativeEvent.layout.x;
      if (type === activeType) {
        scrollTabIntoView(type, false);
      }
    },
    [activeType, scrollTabIntoView],
  );

  const selectPolicy = useCallback(
    (type: PolicyType) => navigation.setParams({ type }),
    [navigation],
  );

  const handleLinkPress = useCallback(
    (target: PolicyLinkTarget) => {
      if (target.kind === 'policy') {
        selectPolicy(target.policy);
        return;
      }
      if (target.screen === 'SubscriptionPlans') {
        navigation.navigate('SubscriptionPlans', { tab: 'plans' });
        return;
      }
      navigation.navigate('Main', {
        screen: 'ProfileTab',
        params: { screen: target.screen },
      });
    },
    [navigation, selectPolicy],
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper">
      <View className="flex-row items-center gap-xs border-b border-landing-line px-sm">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => navigation.goBack()}
          className="h-11 w-11 items-center justify-center active:opacity-60"
        >
          <ArrowLeft size={20} strokeWidth={1.75} color={COLORS.obsidian} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="flex-1 font-display text-headline-sm text-obsidian"
        >
          Chính sách
        </Text>
      </View>

      <ScrollView
        ref={tabsRef}
        horizontal
        accessibilityRole="tablist"
        showsHorizontalScrollIndicator={false}
        className="grow-0 border-b border-landing-line"
        contentContainerClassName="gap-xl px-lg"
      >
        {POLICY_NAV_ITEMS.map((item) => {
          const selected = item.type === activeType;
          return (
            <Pressable
              key={item.type}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => selectPolicy(item.type)}
              onLayout={(event) => handleTabLayout(item.type, event)}
              className={tabStyle({ selected })}
            >
              <Text className={tabTextStyle({ selected })}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Keyed by page so switching policies starts at the top. */}
      <ScrollView
        key={activeType}
        className="flex-1"
        contentContainerClassName="px-lg pb-giant pt-xl"
        showsVerticalScrollIndicator={false}
      >
        <PolicyDocumentView document={policy} onLinkPress={handleLinkPress} />
      </ScrollView>
    </SafeAreaView>
  );
}
