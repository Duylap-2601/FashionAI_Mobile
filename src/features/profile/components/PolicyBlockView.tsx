import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { AlertTriangle, ChevronRight, Info } from 'lucide-react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { COLORS } from '@/constants/theme';
import type {
  PolicyBlock,
  PolicyLink,
  PolicyLinkTarget,
  PolicyListItem,
} from '../types/policy';

interface PolicyBlockViewProps {
  block: PolicyBlock;
  onLinkPress: (target: PolicyLinkTarget) => void;
}

const noteStyle = tva({
  base: 'flex-row gap-md rounded-subtle border bg-ivory p-md',
  variants: {
    tone: {
      warning: 'border-brass',
      info: 'border-landing-line',
    },
  },
});

const tableRowStyle = tva({
  base: 'flex-row',
  variants: {
    first: {
      true: '',
      false: 'border-t border-landing-line',
    },
  },
});

const bodyTextClass = 'font-sans text-body-md leading-relaxed text-obsidian';

export function PolicyInlineLink({
  link,
  onPress,
}: {
  link: PolicyLink;
  onPress: (target: PolicyLinkTarget) => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={link.label}
      onPress={() => onPress(link.target)}
      className="min-h-11 flex-row items-center gap-xs self-start active:opacity-60"
    >
      <Text className="font-sans text-body-md font-semibold text-oxblood">
        {link.label}
      </Text>
      <ChevronRight size={16} strokeWidth={1.75} color={COLORS.oxblood} />
    </Pressable>
  );
}

function ListEntry({ item }: { item: PolicyListItem }) {
  if (typeof item === 'string') {
    return <Text className={`flex-1 ${bodyTextClass}`}>{item}</Text>;
  }
  return (
    <Text className={`flex-1 ${bodyTextClass}`}>
      <Text className="font-semibold">{item.term}:</Text> {item.text}
    </Text>
  );
}

function PolicyList({
  items,
  ordered,
}: {
  items: PolicyListItem[];
  ordered?: boolean;
}) {
  return (
    <View className="gap-sm">
      {items.map((item, index) => (
        <View
          key={typeof item === 'string' ? item : item.term}
          className="flex-row gap-sm"
        >
          {ordered ? (
            <Text className="w-6 font-mono text-body-md font-semibold text-oxblood">
              {index + 1}.
            </Text>
          ) : (
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no"
              className="w-4 font-sans text-body-md text-oxblood"
            >
              •
            </Text>
          )}
          <ListEntry item={item} />
        </View>
      ))}
    </View>
  );
}

/** Short cells (size chart): a real grid that fits a phone screen. */
function CompactTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <View className="overflow-hidden rounded-subtle border border-landing-line">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="flex-row border-b border-landing-line bg-ivory"
      >
        {columns.map((column) => (
          <Text
            key={column}
            className="flex-1 px-sm py-sm font-sans text-label-md font-semibold text-brass-ink"
          >
            {column}
          </Text>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View
          key={row[0]}
          accessible
          accessibilityLabel={row
            .map((cell, cellIndex) => `${columns[cellIndex]}: ${cell}`)
            .join(', ')}
          className={tableRowStyle({ first: rowIndex === 0 })}
        >
          {row.map((cell, cellIndex) => (
            <Text
              key={`${row[0]}-${columns[cellIndex]}`}
              className="flex-1 px-sm py-sm font-mono text-body-sm tabular-nums text-obsidian"
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Long cells: one card per row, column names above their values. */
function StackedTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <View className="gap-sm">
      {rows.map((row) => (
        <View
          key={row[0]}
          className="gap-sm rounded-subtle border border-landing-line bg-ivory p-md"
        >
          <Text className="font-sans text-body-md font-semibold text-obsidian">
            {row[0]}
          </Text>
          {row.slice(1).map((cell, index) => (
            <View key={`${row[0]}-${columns[index + 1]}`} className="gap-xs">
              <Text className="font-sans text-label-md uppercase tracking-wider text-brass-ink">
                {columns[index + 1]}
              </Text>
              <Text className="font-sans text-body-sm leading-relaxed text-obsidian">
                {cell}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function PolicyBlockView({ block, onLinkPress }: PolicyBlockViewProps) {
  switch (block.type) {
    case 'paragraph':
      return <Text className={bodyTextClass}>{block.text}</Text>;

    case 'list':
      return <PolicyList items={block.items} ordered={block.ordered} />;

    case 'table':
      return block.compact ? (
        <CompactTable columns={block.columns} rows={block.rows} />
      ) : (
        <StackedTable columns={block.columns} rows={block.rows} />
      );

    case 'note': {
      const isWarning = block.tone === 'warning';
      const Icon = isWarning ? AlertTriangle : Info;
      return (
        <View className={noteStyle({ tone: block.tone })}>
          <View className="pt-xs">
            <Icon
              size={18}
              strokeWidth={1.75}
              color={isWarning ? COLORS.brassInk : COLORS.oxblood}
            />
          </View>
          <View className="flex-1 gap-xs">
            <Text className="font-sans text-body-sm leading-relaxed text-obsidian">
              {block.text}
            </Text>
            {block.link ? (
              <PolicyInlineLink link={block.link} onPress={onLinkPress} />
            ) : null}
          </View>
        </View>
      );
    }

    case 'link':
      return <PolicyInlineLink link={block.link} onPress={onLinkPress} />;
  }
}
