export const rackKeys = {
  all: ['rack'] as const,
  list: () => [...rackKeys.all, 'list'] as const,
};
