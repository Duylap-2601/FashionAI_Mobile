import React, { useId, useState } from 'react';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { COLORS } from '@/constants/theme';

interface CollectionCoverProps {
  imageUrl: string | null;
  name: string;
  width: number;
  height: number;
  alignTop?: boolean;
}

/** Feature-local cover; SVG supplies the image scrim without a new package. */
export function CollectionCover({
  imageUrl,
  name,
  width,
  height,
  alignTop = false,
}: CollectionCoverProps) {
  const gradientId = useId().replace(/:/g, '');
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 bg-editorial-background"
    >
      {imageUrl && failedImageUrl !== imageUrl ? (
        <Image
          accessibilityLabel={`Ảnh bộ sưu tập ${name}`}
          source={{ uri: imageUrl }}
          contentFit="cover"
          contentPosition={alignTop ? 'top' : 'center'}
          transition={180}
          style={{ width, height }}
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        <View
          accessibilityLabel={`${name}, chưa có ảnh bộ sưu tập`}
          className="flex-1 items-center justify-center gap-sm"
        >
          <Text className="font-sans text-display text-on-primary/70">◇</Text>
          <Text className="font-sans text-body-sm text-on-primary/70">
            Chưa có ảnh bộ sưu tập
          </Text>
        </View>
      )}
      <View className="absolute inset-0">
        <Svg width="100%" height="100%" accessibilityElementsHidden>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0"
                stopColor={COLORS.editorialShade}
                stopOpacity={0.1}
              />
              <Stop
                offset="0.5"
                stopColor={COLORS.editorialShade}
                stopOpacity={0.4}
              />
              <Stop
                offset="1"
                stopColor={COLORS.editorialShade}
                stopOpacity={0.9}
              />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>
      </View>
    </View>
  );
}
