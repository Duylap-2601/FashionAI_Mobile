// Đối chiếu BE: FashionAI_BE/src/modules/chat/dto/chat-response.dto.ts
// (ChatMessageDto / ChatSessionDto / ChatSessionListDto) và chat.gateway.ts
// (chat:token { data }, chat:done { sessionId }, chat:error { code, message }).

export type ChatRole = 'user' | 'assistant' | 'system';

export interface IChatProductContext {
  id: string;
  name: string;
  price?: string | number;
  image?: string;
  category?: string;
}

export interface IChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  streaming?: boolean;
  sessionId?: string;
  createdAt?: string;
  productId?: string;
  product?: IChatProductContext;
  isError?: boolean;
}

export interface IChatSession {
  id: string;
  title?: string;
  updatedAt: string;
  createdAt?: string;
  lastMessage?: string;
  lastRole?: 'user' | 'assistant';
}

export interface IChatSessionDetail {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messages: IChatMessage[];
}

export interface IChatSessionMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IChatSessionPage {
  data: IChatSession[];
  meta: IChatSessionMeta;
}

export interface IChatContextPayload {
  measurements?: Record<string, number | string | undefined>;
  tier?: string;
  gender?: string;
}

export interface ChatSendPayload {
  message: string;
  sessionId?: string;
  productId?: string;
  context?: IChatContextPayload;
}

export interface ChatTokenPayload {
  data: string;
}

export interface ChatDonePayload {
  sessionId: string;
}

export interface ChatErrorPayload {
  code: string;
  message: string;
}

export const CHAT_QUICK_REPLIES: string[] = [
  'Cách thử đồ ảo?',
  'Làm sao chọn đúng size?',
  'Chính sách đổi trả?',
  'Nâng cấp tài khoản',
];

export const CHAT_OCCASIONS: string[] = ['Đi làm', 'Phỏng vấn', 'Dạo phố', 'Dự tiệc'];

export const CHAT_MESSAGE_MAX_LENGTH = 2000;
