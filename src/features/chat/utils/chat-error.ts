export type ChatErrorAction = 'subscription' | null;

export interface ChatErrorState {
  message: string;
  action: ChatErrorAction;
}

/** Ghi chú thêm vào cuối phần đã stream khi kết nối đứt giữa chừng. */
export const CHAT_STREAM_INTERRUPTED_NOTE = 'Đã dừng do gián đoạn kết nối';

/** Bubble assistant chưa có nội dung nào thì thay bằng câu báo lỗi thân thiện. */
export const CHAT_FAILED_FALLBACK = 'Rất tiếc, trợ lý AI chưa thể trả lời. Vui lòng thử lại.';

/** Nội dung bubble assistant sau khi stream lỗi: giữ đoạn đã có, chèn ghi chú dừng. */
export function buildFailedAssistantContent(partialContent: string): string {
  return partialContent
    ? `${partialContent}\n\n(${CHAT_STREAM_INTERRUPTED_NOTE})`
    : CHAT_FAILED_FALLBACK;
}

export function mapChatError(code: string, fallback: string): ChatErrorState {
  switch (code) {
    case 'QUOTA_EXCEEDED':
      return {
        message: 'Bạn đã hết lượt trò chuyện hôm nay. Hạn mức sẽ làm mới vào ngày mai.',
        action: 'subscription',
      };
    case 'SUBSCRIPTION_REQUIRED':
      return {
        message: 'Tính năng trò chuyện AI cần gói hội viên. Nâng cấp để tiếp tục.',
        action: 'subscription',
      };
    case 'BUSY':
      return {
        message: 'AI đang trả lời tin trước. Vui lòng đợi chút rồi gửi lại.',
        action: null,
      };
    case 'STREAM_ERROR':
      return {
        message: 'AI trả lời dở dang do sự cố. Gửi lại tin này không mất thêm lượt.',
        action: null,
      };
    case 'TOKEN_EXPIRED':
    case 'UNAUTHORIZED':
      return {
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        action: null,
      };
    default:
      return { message: fallback || 'Đã xảy ra lỗi, vui lòng thử lại.', action: null };
  }
}
