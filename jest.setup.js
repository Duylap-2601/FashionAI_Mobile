// expo-secure-store is native-only. Back it with an in-memory map so token
// writes are observable across a request/refresh/retry cycle, like on device.
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    __store: store,
    getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
  };
});

beforeEach(() => {
  const SecureStore = require('expo-secure-store');
  SecureStore.__store.clear();
  SecureStore.getItemAsync.mockClear();
  SecureStore.setItemAsync.mockClear();
  SecureStore.deleteItemAsync.mockClear();
});
