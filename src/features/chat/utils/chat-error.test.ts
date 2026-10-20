import {
  buildFailedAssistantContent,
  CHAT_FAILED_FALLBACK,
  CHAT_STREAM_INTERRUPTED_NOTE,
  mapChatError,
} from '@/features/chat/utils/chat-error';

describe('mapChatError', () => {
  it('maps QUOTA_EXCEEDED to subscription action', () => {
    expect(mapChatError('QUOTA_EXCEEDED', '')).toEqual({
      message: 'Bạn đã hết lượt trò chuyện hôm nay. Hạn mức sẽ làm mới vào ngày mai.',
      action: 'subscription',
    });
  });

  it('maps SUBSCRIPTION_REQUIRED to subscription action', () => {
    expect(mapChatError('SUBSCRIPTION_REQUIRED', '')).toEqual({
      message: 'Tính năng trò chuyện AI cần gói hội viên. Nâng cấp để tiếp tục.',
      action: 'subscription',
    });
  });

  it('maps BUSY without action', () => {
    expect(mapChatError('BUSY', '')).toEqual({
      message: 'AI đang trả lời tin trước. Vui lòng đợi chút rồi gửi lại.',
      action: null,
    });
  });

  it('maps STREAM_ERROR without action', () => {
    expect(mapChatError('STREAM_ERROR', '')).toEqual({
      message: 'AI trả lời dở dang do sự cố. Gửi lại tin này không mất thêm lượt.',
      action: null,
    });
  });

  it.each(['TOKEN_EXPIRED', 'UNAUTHORIZED'])('maps %s to session expired copy', (code) => {
    expect(mapChatError(code, '')).toEqual({
      message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      action: null,
    });
  });

  it('falls back to the backend message for unknown codes', () => {
    expect(mapChatError('UNKNOWN', 'Lỗi từ máy chủ')).toEqual({
      message: 'Lỗi từ máy chủ',
      action: null,
    });
  });

  it('uses the generic copy when fallback is empty', () => {
    expect(mapChatError('UNKNOWN', '')).toEqual({
      message: 'Đã xảy ra lỗi, vui lòng thử lại.',
      action: null,
    });
  });
});

describe('buildFailedAssistantContent', () => {
  it('keeps partial content and appends the interruption note', () => {
    expect(buildFailedAssistantContent('Xin chào')).toBe(
      `Xin chào\n\n(${CHAT_STREAM_INTERRUPTED_NOTE})`,
    );
  });

  it('uses the fallback when nothing was streamed', () => {
    expect(buildFailedAssistantContent('')).toBe(CHAT_FAILED_FALLBACK);
  });
});
