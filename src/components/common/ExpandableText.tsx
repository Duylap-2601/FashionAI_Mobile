import React, { useState } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  Text,
  TextLayoutEventData,
  View,
} from 'react-native';

interface ExpandableTextProps {
  text: string;
  numberOfLines?: number;
  className?: string;
  textClassName?: string;
  toggleClassName?: string;
  moreLabel?: string;
  lessLabel?: string;
}

export function ExpandableText({
  text,
  numberOfLines = 3,
  className,
  textClassName,
  toggleClassName,
  moreLabel = 'Xem thêm',
  lessLabel = 'Thu gọn',
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  const handleMeasure = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const nextCanExpand = event.nativeEvent.lines.length > numberOfLines;
    setCanExpand((prev) => (prev === nextCanExpand ? prev : nextCanExpand));
  };

  return (
    <View className={className}>
      {!expanded ? (
        <Text
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onTextLayout={handleMeasure}
          className={`absolute inset-x-0 top-0 opacity-0 ${textClassName ?? ''}`}
        >
          {text}
        </Text>
      ) : null}

      <Text numberOfLines={expanded ? undefined : numberOfLines} className={textClassName}>
        {text}
      </Text>

      {canExpand || expanded ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? lessLabel : moreLabel}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((prev) => !prev)}
          className="min-h-11 justify-center self-start active:opacity-75"
        >
          <Text
            className={`mt-1 font-sans text-[11px] font-semibold uppercase tracking-wider ${
              toggleClassName ?? ''
            }`}
          >
            {expanded ? lessLabel : moreLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
