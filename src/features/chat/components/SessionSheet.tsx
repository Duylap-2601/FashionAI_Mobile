import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal as RNModal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plus, Trash2 } from 'lucide-react-native';
import {
  useChatSessions,
  useDeleteChatSession,
} from '@/features/chat/hooks/use-chat-sessions';
import { IChatSession } from '@/features/chat/types/chat';
import { Loading } from '@/components/common/Loading';
import { ErrorView } from '@/components/common/ErrorView';
import { EmptyState } from '@/components/common/EmptyState';
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

const SessionRow: React.FC<{
  item: IChatSession;
  active: boolean;
  onPress: () => void;
  onDelete: () => void;
}> = ({ item, active, onPress, onDelete }) => (
  <View
    className={`mb-sm flex-row items-center gap-sm rounded-xl border p-md ${
      active ? 'border-primary-container bg-primary-soft' : 'border-surface-line bg-surface-lowest'
    }`}
  >
    <Pressable className="min-h-11 flex-1 justify-center" onPress={onPress}>
      <Text
        className="text-body-md font-semibold text-on-surface"
        numberOfLines={1}
      >
        {item.title || item.lastMessage || 'Cuộc trò chuyện mới'}
      </Text>
      <Text className="mt-xs text-body-sm text-on-surface-variant">
        {formatRelativeTime(item.updatedAt)}
      </Text>
    </Pressable>
    <Pressable
      className="min-h-11 min-w-11 items-center justify-center rounded-full"
      accessibilityLabel={`Xóa ${item.title || 'cuộc trò chuyện'}`}
      onPress={onDelete}
    >
      <Trash2 size={18} color={COLORS.danger} />
    </Pressable>
  </View>
);

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
        <View className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback>
            <View className="h-3/4 rounded-t-xxl bg-surface-lowest">
              <View className="my-sm h-1.5 w-10 self-center rounded-full bg-surface-highest" />
              <View className="flex-row items-center justify-between px-xl pb-sm">
                <Text className="font-heading text-headline-sm font-bold text-primary-container">
                  Lịch sử trò chuyện
                </Text>
                <Pressable
                  className="min-h-11 min-w-11 items-center justify-center rounded-full"
                  accessibilityLabel="Đóng"
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} className="text-on-surface-variant" />
                </Pressable>
              </View>

              <View className="flex-row gap-sm px-xl">
                <View className="min-h-11 flex-1 flex-row items-center gap-sm rounded-md border border-surface-line bg-surface-low px-md">
                  <Ionicons name="search-outline" size={20} className="text-on-surface-variant" />
                  <TextInput
                    className="flex-1 py-sm text-body-lg text-on-surface"
                    placeholder="Tìm cuộc trò chuyện..."
                    placeholderTextColor={COLORS.outline}
                    value={search}
                    onChangeText={setSearch}
                    returnKeyType="search"
                  />
                </View>
                <Pressable
                  className="min-h-11 min-w-11 items-center justify-center rounded-full bg-primary-container"
                  accessibilityLabel="Cuộc trò chuyện mới"
                  onPress={() => {
                    onNewChat();
                    onClose();
                  }}
                >
                  <Plus size={22} color={COLORS.onPrimary} />
                </Pressable>
              </View>

              <View className="mt-md flex-1 px-xl">
                {sessions.isLoading ? (
                  <Loading message="Đang tải lịch sử..." />
                ) : sessions.isError ? (
                  <ErrorView
                    title="Không tải được lịch sử"
                    message="Vui lòng kiểm tra kết nối mạng và thử lại."
                    onRetry={() => sessions.refetch()}
                  />
                ) : (
                  <FlatList
                    data={items}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                      <SessionRow
                        item={item}
                        active={item.id === currentSessionId}
                        onPress={() => {
                          onSelect(item.id);
                          onClose();
                        }}
                        onDelete={() => setPendingDelete(item)}
                      />
                    )}
                    onEndReached={() => {
                      if (sessions.hasNextPage && !sessions.isFetchingNextPage) {
                        sessions.fetchNextPage();
                      }
                    }}
                    onEndReachedThreshold={0.4}
                    ListEmptyComponent={
                      <EmptyState
                        icon="💬"
                        title="Chưa có cuộc trò chuyện nào"
                        description="Bắt đầu trò chuyện với StAle. để được tư vấn."
                      />
                    }
                    ListFooterComponent={
                      sessions.isFetchingNextPage ? (
                        <Loading message="Đang tải thêm..." />
                      ) : null
                    }
                  />
                )}
              </View>
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
