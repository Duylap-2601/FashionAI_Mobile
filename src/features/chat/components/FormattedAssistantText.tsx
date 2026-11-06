import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

// Format tối thiểu cho câu trả lời của AI (BE cấm markdown nhưng model vẫn
// hay nhả **bold** và gạch đầu dòng): in đậm + tách dòng danh sách.
// Không dùng lib markdown để giữ bundle gọn.
// Kiểu chữ theo FormattedChatText của web: số thứ tự mono màu đồng thau, gạch đầu dòng là ô vuông brass.
const BODY_CLASS = 'font-sans text-[14px] leading-relaxed text-landing-obsidian';

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) {
      return (
        <Text key={key} className="font-semibold text-landing-obsidian">
          {bold[1]}
        </Text>
      );
    }
    return <Text key={key}>{part}</Text>;
  });
}

const ORDERED_RE = /^(\d+[.)])\s+(.*)$/;
const BULLET_RE = /^([\-•])\s+(.*)$/;

function isListLine(line: string | undefined): boolean {
  return !!line && (ORDERED_RE.test(line) || BULLET_RE.test(line));
}

export const FormattedAssistantText: React.FC<{
  content: string;
  streaming?: boolean;
}> = ({ content, streaming }) => {
  const blocks = useMemo(
    () =>
      content
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [content],
  );

  return (
    <View>
      {blocks.map((block, index) => {
        const key = `block-${index}`;
        const ordered = ORDERED_RE.exec(block);
        const bullet = BULLET_RE.exec(block);
        const isList = !!(ordered || bullet);
        // Các dòng trong cùng một danh sách sát nhau hơn khoảng cách giữa các đoạn.
        const spaced =
          index === 0 ? '' : isList && isListLine(blocks[index - 1]) ? 'mt-sm' : 'mt-md';
        if (isList) {
          return (
            <View key={key} className={`flex-row gap-2.5 ${spaced}`}>
              {ordered ? (
                <Text className="pt-0.5 font-mono text-[11px] leading-relaxed text-brass-ink">
                  {ordered[1]}
                </Text>
              ) : (
                <View className="mt-2 h-1 w-1 bg-brass" />
              )}
              <Text className={`flex-1 ${BODY_CLASS}`}>
                {renderInline(ordered ? ordered[2] : (bullet as RegExpExecArray)[2], key)}
              </Text>
            </View>
          );
        }
        return (
          <Text key={key} className={`${BODY_CLASS} ${spaced}`}>
            {renderInline(block, key)}
          </Text>
        );
      })}
      {streaming ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="mt-xs h-4 w-0.5 bg-brass"
        />
      ) : null}
    </View>
  );
};

export default FormattedAssistantText;
