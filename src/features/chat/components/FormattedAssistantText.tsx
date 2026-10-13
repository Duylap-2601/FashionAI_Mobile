import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

// Format tối thiểu cho câu trả lời của AI (BE cấm markdown nhưng model vẫn
// hay nhả **bold** và gạch đầu dòng): in đậm + tách dòng danh sách.
// Không dùng lib markdown để giữ bundle gọn.
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) {
      return (
        <Text key={key} className="font-bold text-on-surface">
          {bold[1]}
        </Text>
      );
    }
    return <Text key={key}>{part}</Text>;
  });
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
        const ordered = /^(\d+[.)])\s+(.*)$/.exec(block);
        const bullet = /^([\-•])\s+(.*)$/.exec(block);
        const spaced = index > 0 ? 'mt-xs' : '';
        if (ordered || bullet) {
          return (
            <View key={key} className={`flex-row ${spaced}`}>
              <Text className="text-body-md leading-relaxed text-on-surface">
                {ordered ? `${ordered[1]} ` : '• '}
              </Text>
              <Text className="flex-1 text-body-md leading-relaxed text-on-surface">
                {renderInline(ordered ? ordered[2] : (bullet as RegExpExecArray)[2], key)}
              </Text>
            </View>
          );
        }
        return (
          <Text
            key={key}
            className={`text-body-md leading-relaxed text-on-surface ${spaced}`}
          >
            {renderInline(block, key)}
          </Text>
        );
      })}
      {streaming ? (
        <Text className="text-body-md text-tertiary-fixed">▍</Text>
      ) : null}
    </View>
  );
};

export default FormattedAssistantText;
