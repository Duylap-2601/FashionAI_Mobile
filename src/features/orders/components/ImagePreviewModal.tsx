import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

// expo-image không nhận className (chưa cssInterop), nên kích thước ảnh dùng style.
const PREVIEW_STYLE = { width: '100%', height: '70%' } as const;

/** Xem lớn một ảnh (minh chứng, chứng từ chuyển khoản). */
export function ImagePreviewModal({
  url,
  caption,
  onClose,
}: {
  url: string | null;
  caption?: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-landing-obsidian/90 p-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng ảnh"
          onPress={onClose}
          className="absolute right-4 top-12 z-10 h-11 w-11 items-center justify-center rounded-full bg-landing-ivory/20"
        >
          <X size={20} color={COLORS.ivory} />
        </Pressable>
        {url ? (
          <Image source={{ uri: url }} style={PREVIEW_STYLE} contentFit="contain" accessibilityLabel={caption} />
        ) : null}
        {caption ? <Text className="mt-3 font-sans text-[12px] text-landing-ivory">{caption}</Text> : null}
      </View>
    </Modal>
  );
}
