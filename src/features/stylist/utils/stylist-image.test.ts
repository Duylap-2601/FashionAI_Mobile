import { toStylistImageFile } from './stylist-image';

describe('stylist image selection', () => {
  it('accepts a supported image within the backend size limit', () => {
    expect(
      toStylistImageFile({
        uri: 'file:///portrait.jpg',
        fileName: 'portrait.jpg',
        mimeType: 'image/jpeg',
        fileSize: 2_000_000,
      }),
    ).toEqual({
      file: {
        uri: 'file:///portrait.jpg',
        name: 'portrait.jpg',
        type: 'image/jpeg',
      },
    });
  });

  it('rejects images larger than the backend 10 MB limit', () => {
    expect(
      toStylistImageFile({
        uri: 'file:///large.png',
        fileName: 'large.png',
        mimeType: 'image/png',
        fileSize: 10 * 1024 * 1024 + 1,
      }),
    ).toEqual({
      error: 'Ảnh vượt quá giới hạn 10 MB. Vui lòng chọn ảnh nhỏ hơn.',
    });
  });

  it('rejects formats the backend file pipe does not accept', () => {
    expect(
      toStylistImageFile({
        uri: 'file:///portrait.heic',
        fileName: 'portrait.heic',
        mimeType: 'image/heic',
      }),
    ).toEqual({
      error: 'Định dạng ảnh chưa được hỗ trợ. Hãy chọn ảnh JPEG, PNG hoặc WebP.',
    });
  });
});
