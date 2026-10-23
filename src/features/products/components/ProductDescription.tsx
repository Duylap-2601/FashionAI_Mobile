import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

export function ProductDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  return (
    <View className="gap-sm">
      <View className="relative">
        <Text
          testID="product-description"
          selectable
          numberOfLines={expanded ? undefined : 4}
          className="font-sans text-body-md leading-relaxed text-on-surface-variant"
        >
          {description}
        </Text>
        {/* Measure untruncated text at the same width/font, outside normal flow. */}
        <Text
          testID="description-measure"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onTextLayout={({ nativeEvent }) =>
            setOverflows(nativeEvent.lines.length > 4)
          }
          className="pointer-events-none absolute inset-x-0 top-0 font-sans text-body-md leading-relaxed text-on-surface-variant opacity-0"
        >
          {description}
        </Text>
      </View>
      {overflows ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((value) => !value)}
          className="min-h-11 min-w-11 justify-center self-start px-sm active:opacity-70"
        >
          <Text className="font-sans text-body-md font-semibold text-primary-container">
            {expanded ? "Thu gọn" : "Xem thêm"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
