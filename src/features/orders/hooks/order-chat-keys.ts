export const orderChatKeys = {
  all: ['orderChat'] as const,
  thread: (orderId: string | number) => ['orderChat', 'thread', String(orderId)] as const,
  mine: () => ['orderChat', 'mine'] as const,
};
