import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { CalendarDays, Mail, MapPin, Phone } from 'lucide-react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { COLORS } from '@/constants/theme';
import { POLICY_CONTACT } from '../constants/policies/policy-nav';
import type { PolicyDocument, PolicyLinkTarget } from '../types/policy';
import { PolicyBlockView } from './PolicyBlockView';

interface PolicyDocumentViewProps {
  document: PolicyDocument;
  onLinkPress: (target: PolicyLinkTarget) => void;
}

const highlightRowStyle = tva({
  base: 'flex-row items-center justify-between gap-md px-md py-md',
  variants: {
    first: {
      true: '',
      false: 'border-t border-landing-line',
    },
  },
});

function openUrl(url: string) {
  // Devices without a phone or mail app reject the URL; nothing else to do.
  Linking.openURL(url).catch(() => undefined);
}

function PolicyContactCard() {
  return (
    <View className="gap-md rounded-subtle border border-landing-line bg-ivory p-lg">
      <View className="gap-xs">
        <Text
          accessibilityRole="header"
          className="font-display text-headline-sm text-obsidian"
        >
          Cần hỗ trợ thêm?
        </Text>
        <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
          Đội ngũ chăm sóc khách hàng StAie. luôn sẵn sàng giải đáp cho bạn.
        </Text>
      </View>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Gọi hotline ${POLICY_CONTACT.hotline}`}
        onPress={() => openUrl(`tel:${POLICY_CONTACT.hotline.replace(/\s/g, '')}`)}
        className="min-h-11 flex-row items-start gap-sm active:opacity-60"
      >
        <View className="pt-xs">
          <Phone size={16} strokeWidth={1.75} color={COLORS.oxblood} />
        </View>
        <View className="flex-1">
          <Text className="font-sans text-body-md text-obsidian">
            Hotline {POLICY_CONTACT.hotline}
          </Text>
          <Text className="font-sans text-body-sm text-landing-muted">
            {POLICY_CONTACT.hotlineHours}
          </Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Gửi email tới ${POLICY_CONTACT.email}`}
        onPress={() => openUrl(`mailto:${POLICY_CONTACT.email}`)}
        className="min-h-11 flex-row items-center gap-sm active:opacity-60"
      >
        <Mail size={16} strokeWidth={1.75} color={COLORS.oxblood} />
        <Text className="flex-1 font-sans text-body-md text-obsidian">
          {POLICY_CONTACT.email}
        </Text>
      </Pressable>

      <View className="flex-row items-start gap-sm">
        <View className="pt-xs">
          <MapPin size={16} strokeWidth={1.75} color={COLORS.oxblood} />
        </View>
        <Text className="flex-1 font-sans text-body-md leading-relaxed text-obsidian">
          {POLICY_CONTACT.address}
        </Text>
      </View>
    </View>
  );
}

/** Renders any policy document from its typed content (see constants/policies). */
export function PolicyDocumentView({ document, onLinkPress }: PolicyDocumentViewProps) {
  return (
    <View className="gap-xl">
      <View className="gap-sm">
        <Text
          accessibilityRole="header"
          className="font-display text-headline-lg text-obsidian"
        >
          {document.title}
        </Text>
        <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
          {document.summary}
        </Text>
        <View className="flex-row items-center gap-xs">
          <CalendarDays size={14} strokeWidth={1.75} color={COLORS.muted} />
          <Text className="font-sans text-body-sm text-landing-muted">
            Cập nhật lần cuối: {document.updatedAt}
          </Text>
        </View>
      </View>

      {document.highlights?.length ? (
        <View className="rounded-subtle border border-landing-line bg-ivory">
          {document.highlights.map((highlight, index) => (
            <View
              key={highlight.label}
              accessible
              accessibilityLabel={`${highlight.label}: ${highlight.value}`}
              className={highlightRowStyle({ first: index === 0 })}
            >
              <Text className="flex-1 font-sans text-body-sm text-landing-muted">
                {highlight.label}
              </Text>
              <Text className="shrink text-right font-sans text-body-md font-semibold text-oxblood">
                {highlight.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {document.sections.map((section, index) => (
        <View key={section.id} className="gap-md border-t border-landing-line pt-xl">
          <Text
            accessibilityRole="header"
            className="font-display text-headline-md text-obsidian"
          >
            <Text className="text-oxblood">{index + 1}. </Text>
            {section.title}
          </Text>
          {section.blocks.map((block, blockIndex) => (
            <PolicyBlockView
              key={`${section.id}-${blockIndex}`}
              block={block}
              onLinkPress={onLinkPress}
            />
          ))}
        </View>
      ))}

      <PolicyContactCard />
    </View>
  );
}
