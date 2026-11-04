import React from 'react';
import { View, Text, Platform } from 'react-native';
import { ExpandableText } from '@/components/common/ExpandableText';
import { COLORS } from '@/constants/theme';

interface LandingSectionHeadingProps {
  chapter: string;
  eyebrow: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  inverted?: boolean;
}

// Mirrors FE LandingSectionHeading: mono chapter, brass eyebrow, serif uppercase title.
export function LandingSectionHeading({
  chapter,
  eyebrow,
  title,
  description,
  action,
  inverted = false,
}: LandingSectionHeadingProps) {
  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';

  return (
    <View
      className={`border-t pt-5 ${
        inverted ? 'border-landing-paper/15' : 'border-landing-line'
      }`}
    >
      <View className="flex-row items-start gap-3">
        {/* Chapter mono number */}
        <Text
          className={`shrink-0 pt-1 font-mono text-lg tracking-[0.2em] ${
            inverted ? 'text-landing-brass' : 'text-landing-brass-ink'
          }`}
        >
          {chapter}
        </Text>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-3">
            <Text
              accessibilityRole="header"
              className={`flex-1 font-sans text-2xl font-bold uppercase ${
                inverted ? 'text-landing-brass' : 'text-landing-brass-ink'
              }`}
            >
              {eyebrow}
            </Text>
            {action ? <View className="shrink-0">{action}</View> : null}
          </View>

          {title ? (
            <Text
              style={{
                fontFamily: fontFamilyDisplay,
                fontSize: 20,
                lineHeight: 26,
                fontWeight: '600',
                color: inverted ? COLORS.paper : COLORS.obsidian,
                textTransform: 'uppercase',
                marginTop: 12,
              }}
            >
              {title}
            </Text>
          ) : null}

          {description ? (
            <ExpandableText
              key={description}
              className="mt-4"
              text={description}
              numberOfLines={3}
              textClassName={`font-sans text-[15px] leading-relaxed ${
                inverted ? 'text-landing-paper/65' : 'text-landing-muted'
              }`}
              toggleClassName={inverted ? 'text-landing-brass' : 'text-landing-oxblood'}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
