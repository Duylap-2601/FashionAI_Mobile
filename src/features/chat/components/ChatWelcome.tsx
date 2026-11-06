import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

interface ChatWelcomeProps {
  userName?: string;
  prompts: string[];
  onSelect: (prompt: string) => void;
}

const LABEL_CLASS =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink';

/**
 * Màn chào khi chưa có tin nhắn, theo ChatEmptyState của web: nhãn brass, lời chào serif,
 * mô tả ngắn, rồi danh sách câu hỏi gợi ý đánh số mono.
 */
export function ChatWelcome({ userName, prompts, onSelect }: ChatWelcomeProps) {
  return (
    <View className="gap-xl py-xl">
      <View className="gap-sm border-b border-landing-line pb-xl">
        <Text className={LABEL_CLASS}>StAie. AI Assistant</Text>
        <Text
          accessibilityRole="header"
          className="font-display text-[30px] leading-tight text-landing-obsidian"
        >
          {userName ? `Xin chào, ${userName}` : 'Xin chào bạn'}
        </Text>
        <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
          Tôi là trợ lý AI thời trang của bạn. Tôi có thể tư vấn size, gợi ý phối đồ từ sản phẩm của
          cửa hàng, và giải đáp thắc mắc về bộ sưu tập StAie.
        </Text>
      </View>

      <View className="gap-sm">
        <Text className={LABEL_CLASS}>Bắt đầu với một câu hỏi</Text>
        {prompts.map((prompt, index) => (
          <Pressable
            key={prompt}
            accessibilityRole="button"
            accessibilityLabel={prompt}
            onPress={() => onSelect(prompt)}
            className="min-h-11 flex-row items-center gap-md rounded-subtle border border-landing-line bg-ivory px-lg py-md active:opacity-80"
          >
            <Text className="font-mono text-[11px] text-brass-ink">
              {String(index + 1).padStart(2, '0')}
            </Text>
            <Text className="flex-1 font-display text-[16px] leading-snug text-landing-obsidian">
              {prompt}
            </Text>
            <ArrowRight size={16} strokeWidth={1.75} color={COLORS.oxblood} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default ChatWelcome;
