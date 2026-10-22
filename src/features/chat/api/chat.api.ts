import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { ApiError } from '@/types/api';
import {
  IChatSession,
  IChatSessionDetail,
  IChatSessionMeta,
  IChatSessionPage,
} from '@/features/chat/types/chat';

export interface DeleteChatSessionResult {
  deleted: boolean;
}

function parseSessionMeta(value: unknown): IChatSessionMeta {
  if (!value || typeof value !== 'object') {
    throw new ApiError('Dữ liệu phân trang phiên chat không hợp lệ.', 500, 'INVALID_CHAT_META');
  }
  const meta = value as Record<string, unknown>;
  if (
    typeof meta.total !== 'number' ||
    typeof meta.page !== 'number' ||
    typeof meta.limit !== 'number' ||
    typeof meta.totalPages !== 'number'
  ) {
    throw new ApiError('Dữ liệu phân trang phiên chat không hợp lệ.', 500, 'INVALID_CHAT_META');
  }
  return {
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages: meta.totalPages,
  };
}

export const chatApi = {
  async listSessions(
    page: number,
    limit: number,
    opts?: HttpOptions,
  ): Promise<IChatSessionPage> {
    const { data, meta } = await http.getPaged<IChatSession[]>(ENDPOINTS.CHAT.SESSIONS, {
      ...opts,
      params: { page, limit, ...opts?.params },
    });
    return { data: data ?? [], meta: parseSessionMeta(meta) };
  },

  getSession(sessionId: string, opts?: HttpOptions): Promise<IChatSessionDetail> {
    return http.get<IChatSessionDetail>(ENDPOINTS.CHAT.SESSION_DETAIL(sessionId), opts);
  },

  deleteSession(sessionId: string, opts?: HttpOptions): Promise<DeleteChatSessionResult> {
    return http.delete<DeleteChatSessionResult>(ENDPOINTS.CHAT.SESSION_DELETE(sessionId), opts);
  },
};
