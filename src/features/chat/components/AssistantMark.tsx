import React from 'react';
import { Text, View } from 'react-native';

/**
 * Dấu nhận diện trợ lý, cùng kiểu `assistant-mark` của web: ô vuông đỏ đô 2px với chữ S
 * kiểu Playfair và dấu chấm taupe, thay cho avatar tròn. Chỉ để trang trí nên ẩn khỏi
 * trình đọc màn hình.
 */
export function AssistantMark() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="h-8 w-8 shrink-0 items-center justify-center rounded-subtle bg-oxblood"
    >
      <Text className="font-display text-[15px] leading-none text-landing-paper">
        S<Text className="text-taupe">.</Text>
      </Text>
    </View>
  );
}

export default AssistantMark;
