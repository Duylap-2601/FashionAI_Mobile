import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal as RNModal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, Plus, Search, Trash2, X } from 'lucide-react-native';
import { useChatSessions, useDeleteChatSession } from '@/features/chat/hooks/use-chat-sessions';
import { IChatSession } from '@/features/chat/types/chat';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { COLORS } from '@/constants/theme';
import { formatRelativeTime } from '@/utils/date';

interface SessionSheetProps {
  visible: boolean;
  currentSessionId?: string;
  onClose: () => void;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeletedSession?: (sessionId: string) => void;
}

const DAY_MS = 86_400_000;

/** Nhóm theo ngày như SessionSidebar của web: Hôm nay / Hôm qua / 7 ngày qua / Cũ hơn. */
function sessionGroupLabel(updatedAt: string | undefined): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const time = updatedAt ? new Date(updatedAt).getTime() : now.getTime();
  if (Number.isNaN(time) || time >= today) return 'Hôm nay';
  if (time >= today - DAY_MS) return 'Hôm qua';
  if (time >= today - 7 * DAY_MS) return '7 ngày qua';
  return 'Cũ hơn';
}

const SessionRow: React.FC<{
  item: IChatSession;
  active: boolean;
  onPress: () => void;
  onDelete: () => void;
}> = ({ item, active, onPress, onDelete }) => {
  const title = item.title || item.lastMessage || 'Cuộc trò chuyện mới';
  return (
    <View
      className={`flex-row items-center border-l-2 ${
        active ? 'border-l-oxblood bg-landing-paper' : 'border-l-transparent'
      }`}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ selected: active }}
        className="min-h-11 flex-1 flex-row items-center gap-2.5 py-sm pl-lg pr-sm active:opacity-70"
        onPress={onPress}
      >
        <MessageSquare
          size={16}
          strokeWidth={1.75}
          color={active ? COLORS.oxblood : COLORS.muted}
        />
        <View className="min-w-0 flex-1">
          <Text
            className={`font-sans text-[14px] ${
              active ? 'font-semibold text-landing-obsidian' : 'text-landing-obsidian/80'
            }`}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text className="mt-0.5 font-sans text-[11px] text-landing-muted">
            {formatRelativeTime(item.updatedAt)}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        className="mr-xs h-11 w-11 items-center justify-center active:opacity-60"
        accessibilityLabel={`Xóa ${item.title || 'cuộc trò chuyện'}`}
        onPress={onDelete}
      >
        <Trash2 size={16} strokeWidth={1.75} color={COLORS.muted} />
      </Pressable>
    </View>
  );
};

export const SessionSheet: React.FC<SessionSheetProps> = ({
  visible,
  currentSessionId,
  onClose,
  onSelect,
  onNewChat,
  onDeletedSession,
}: SessionSheetProps) => {
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<IChatSession | null>(null);
  const sessions = useChatSessions();
  const remove = useDeleteChatSession();

  const items = useMemo(() => {
    const all = sessions.data?.pages.flatMap((page) => page.data) ?? [];
    const keyword = search.trim().toLowerCase();
    if (!keyword) return all;
    return all.filter((item) =>
      (item.title || item.lastMessage || '').toLowerCase().includes(keyword),
    );
  }, [sessions.data, search]);

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    remove.mutate(pendingDelete.id, {
      onSuccess: () => {
        onDeletedSession?.(pendingDelete.id);
        setPendingDelete(null);
      },
    });
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-landing-obsidian/45">
          <TouchableWithoutFeedback>
            {/* View thường làm con trực tiếp để TouchableWithoutFeedback chặn chạm lọt ra nền. */}
            <View className="h-3/4 overflow-hidden rounded-t-xl bg-ivory">
              <SafeAreaView edges={['bottom']} className="flex-1">
                <View className="mb-xs mt-sm h-1 w-10 self-center rounded-subtle bg-taupe" />
                <View className="flex-row items-center justify-between border-b border-landing-line pb-sm pl-lg pr-sm">
                  <Text
                    accessibilityRole="header"
                    className="font-display text-[20px] leading-tight text-landing-obsidian"
                  >
                    Lịch sử trò chuyện
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    className="h-11 w-11 items-center justify-center active:opacity-60"
                    accessibilityLabel="Đóng"
                    onPress={onClose}
                  >
                    <X size={18} strokeWidth={1.75} color={COLORS.muted} />
                  </Pressable>
                </View>

                <View className="gap-md border-b border-landing-line p-lg">
                  <Pressable
                    accessibilityRole="button"
                    className="h-11 flex-row items-center justify-center gap-sm rounded-subtle bg-oxblood active:opacity-90"
                    onPress={() => {
                      onNewChat();
                      onClose();
                    }}
                  >
                    <Plus size={16} strokeWidth={1.75} color={COLORS.paper} />
                    <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-paper">
                      Cuộc trò chuyện mới
                    </Text>
                  </Pressable>
                  <View className="h-11 flex-row items-center gap-sm rounded-subtle border border-landing-line bg-landing-paper/60 px-md">
                    <Search size={14} strokeWidth={1.75} color={COLORS.muted} />
                    <TextInput
                      className="flex-1 font-sans text-[14px] text-landing-obsidian"
                      placeholder="Tìm đoạn chat"
                      placeholderTextColor={COLORS.muted}
                      accessibilityLabel="Tìm đoạn chat"
                      value={search}
                      onChangeText={setSearch}
                      returnKeyType="search"
                    />
                  </View>
                </View>

                <View className="flex-1">
                  {sessions.isLoading ? (
                    <View
                      accessibilityRole="progressbar"
                      accessibilityLabel="Đang tải lịch sử"
                      className="gap-sm p-lg"
                    >
                      {[0, 1, 2, 3].map((key) => (
                        <View key={key} className="h-10 bg-taupe/35" />
                      ))}
                    </View>
                  ) : sessions.isError ? (
                    <View className="items-center gap-md px-xxl py-giant">
                      <Text className="text-center font-display text-[18px] text-landing-obsidian">
                        Không tải được lịch sử
                      </Text>
                      <Text className="text-center font-sans text-body-sm leading-relaxed text-landing-muted">
                        Vui lòng kiểm tra kết nối mạng và thử lại.
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => sessions.refetch()}
                        className="h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70"
                      >
                        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                          Thử lại
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <FlatList
                      data={items}
                      keyExtractor={(item) => String(item.id)}
                      contentContainerClassName="pb-lg pt-sm"
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item, index }) => {
                        const label = sessionGroupLabel(item.updatedAt);
                        const showLabel =
                          index === 0 || sessionGroupLabel(items[index - 1]?.updatedAt) !== label;
                        return (
                          <View>
                            {showLabel ? (
                              <Text
                                accessibilityRole="header"
                                className={`px-lg pb-xs font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-brass-ink ${
                                  index === 0 ? 'pt-sm' : 'pt-xl'
                                }`}
                              >
                                {label}
                              </Text>
                            ) : null}
                            <SessionRow
                              item={item}
                              active={item.id === currentSessionId}
                              onPress={() => {
                                onSelect(item.id);
                                onClose();
                              }}
                              onDelete={() => setPendingDelete(item)}
                            />
                          </View>
                        );
                      }}
                      onEndReached={() => {
                        if (sessions.hasNextPage && !sessions.isFetchingNextPage) {
                          sessions.fetchNextPage();
                        }
                      }}
                      onEndReachedThreshold={0.4}
                      ListEmptyComponent={
                        <View className="items-center gap-xs px-xxl py-giant">
                          <MessageSquare size={28} strokeWidth={1.5} color={COLORS.taupe} />
                          <Text className="mt-sm text-center font-sans text-[14px] font-medium text-landing-obsidian">
                            {search.trim() ? 'Không tìm thấy kết quả' : 'Chưa có đoạn chat nào'}
                          </Text>
                          <Text className="text-center font-sans text-[12px] text-landing-muted">
                            Bắt đầu trò chuyện để lưu lại lịch sử
                          </Text>
                        </View>
                      }
                      ListFooterComponent={
                        sessions.isFetchingNextPage ? (
                          <View className="py-lg">
                            <ActivityIndicator color={COLORS.oxblood} />
                          </View>
                        ) : null
                      }
                    />
                  )}
                </View>
              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      <FeedbackModal
        visible={!!pendingDelete}
        onClose={() => {
          if (!remove.isPending) setPendingDelete(null);
        }}
        type="warning"
        title="Xóa cuộc trò chuyện?"
        message="Lịch sử tin nhắn sẽ bị xóa và không thể khôi phục."
        primaryButtonText="Xóa"
        primaryButtonVariant="danger"
        primaryButtonLoading={remove.isPending}
        onPrimaryPress={handleConfirmDelete}
        secondaryButtonText="Hủy"
        secondaryButtonDisabled={remove.isPending}
      />
    </RNModal>
  );
};

export default SessionSheet;
