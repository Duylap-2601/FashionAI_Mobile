import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import { ENV } from '@/config/env';
import { getTokens } from '@/features/auth/storage/secureStorage';

let mainSocket: Socket | null = null;
let chatSocket: Socket | null = null;
let currentAppState: AppStateStatus = AppState.currentState;

export async function getMainSocket(): Promise<Socket> {
  if (mainSocket && mainSocket.connected) {
    return mainSocket;
  }

  const { accessToken } = await getTokens();

  if (mainSocket) {
    mainSocket.auth = { token: accessToken };
    mainSocket.connect();
    return mainSocket;
  }

  mainSocket = io(ENV.SOCKET_URL, {
    transports: ['websocket'], // Backend requires websocket only, no polling
    auth: { token: accessToken },
    autoConnect: true,
  });

  mainSocket.on('connect', () => {
    console.log('[Socket] Connected to main namespace');
  });

  mainSocket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected from main namespace:', reason);
  });

  mainSocket.on('connect_error', (error) => {
    console.warn('[Socket] Main connection error:', error.message);
  });

  return mainSocket;
}

export async function getChatSocket(): Promise<Socket> {
  if (chatSocket && chatSocket.connected) {
    return chatSocket;
  }

  const { accessToken } = await getTokens();

  if (chatSocket) {
    chatSocket.auth = { token: accessToken };
    chatSocket.connect();
    return chatSocket;
  }

  chatSocket = io(`${ENV.SOCKET_URL}/chat`, {
    transports: ['websocket'],
    auth: { token: accessToken },
    autoConnect: true,
  });

  chatSocket.on('connect', () => {
    console.log('[Socket] Connected to /chat namespace');
  });

  chatSocket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected from /chat namespace:', reason);
  });

  chatSocket.on('connect_error', (error) => {
    console.warn('[Socket] Chat connection error:', error.message);
  });

  return chatSocket;
}

export function disconnectAllSockets(): void {
  if (mainSocket) {
    mainSocket.disconnect();
    mainSocket = null;
  }
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }
}

// Auto reconnect on app active state
AppState.addEventListener('change', (nextAppState) => {
  if (currentAppState.match(/inactive|background/) && nextAppState === 'active') {
    if (mainSocket && !mainSocket.connected) {
      mainSocket.connect();
    }
    if (chatSocket && !chatSocket.connected) {
      chatSocket.connect();
    }
  }
  currentAppState = nextAppState;
});
