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
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  isStreaming,
  onSend,
  onStop,
  disabled,
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
    <View className="flex-row items-end gap-sm">
      <View className="min-h-11 flex-1 justify-center rounded-full border border-surface-line bg-surface-lowest px-md">
        <TextInput
          className="max-h-28 py-sm text-body-lg text-on-surface"
          placeholder="Nhắn tin..."
          placeholderTextColor={COLORS.outline}
          value={value}
          onChangeText={setValue}
          multiline
          maxLength={CHAT_MESSAGE_MAX_LENGTH}
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
      </View>
      {isStreaming ? (
        <Pressable
          accessibilityLabel="Dừng lại"
          onPress={onStop}
          className="min-h-11 min-w-11 items-center justify-center rounded-full bg-primary-container"
        >
          <Square size={18} color={COLORS.onPrimary} fill={COLORS.onPrimary} />
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel="Gửi tin nhắn"
          onPress={handleSend}
          disabled={!canSend}
          className={`min-h-11 min-w-11 items-center justify-center rounded-full ${
            canSend ? 'bg-primary-container' : 'bg-surface-container'
          }`}
        >
          <Send
            size={20}
            color={canSend ? COLORS.onPrimary : COLORS.onSurfaceVariant}
          />
        </Pressable>
      )}
    </View>
  );
};

export default ChatComposer;
