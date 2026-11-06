import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Send, Square } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { CHAT_MESSAGE_MAX_LENGTH } from '@/features/chat/types/chat';

interface ChatComposerProps {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  disabled?: boolean;
  /** Hiện phía trên ô nhập, trong cùng khung (vd. sản phẩm đang tư vấn), như ChatInput của web. */
  attachment?: React.ReactNode;
}

// Khung ivory viền mảnh + nút vuông đỏ đô 44px, theo ChatInput của web.
export const ChatComposer: React.FC<ChatComposerProps> = ({
  isStreaming,
  onSend,
  onStop,
  disabled,
  attachment,
}) => {
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    setValue('');
    onSend(trimmed);
  };

  return (
    <View className="rounded-subtle border border-landing-line bg-ivory p-2.5">
      {attachment}
      <View className="flex-row items-end gap-sm">
        <TextInput
          className="max-h-28 min-h-11 flex-1 px-2.5 py-sm font-sans text-[15px] text-landing-obsidian"
          placeholder="Hỏi về chọn size, phối đồ, kiểu dáng…"
          placeholderTextColor={COLORS.muted}
          accessibilityLabel="Tin nhắn cho trợ lý"
          value={value}
          onChangeText={setValue}
          multiline
          maxLength={CHAT_MESSAGE_MAX_LENGTH}
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        {isStreaming ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dừng phản hồi"
            onPress={onStop}
            className="h-11 w-11 items-center justify-center rounded-subtle bg-oxblood active:opacity-90"
          >
            <Square size={14} strokeWidth={1.75} color={COLORS.paper} fill={COLORS.paper} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            accessibilityState={{ disabled: !canSend }}
            onPress={handleSend}
            disabled={!canSend}
            className={`h-11 w-11 items-center justify-center rounded-subtle ${
              canSend ? 'bg-oxblood active:opacity-90' : 'bg-taupe'
            }`}
          >
            <Send size={16} strokeWidth={1.75} color={canSend ? COLORS.paper : COLORS.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default ChatComposer;
