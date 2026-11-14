import {
  MAX_CHAT_ATTACHMENTS,
  MAX_DISPUTE_EVIDENCE_IMAGES,
  MAX_EVIDENCE_IMAGE_BYTES,
  MAX_REVIEW_IMAGES,
  describeEvidenceRejection,
} from './evidence-images';

describe('evidence image limits', () => {
  it('matches the backend limits per surface', () => {
    expect(MAX_EVIDENCE_IMAGE_BYTES).toBe(10 * 1024 * 1024);
    expect(MAX_DISPUTE_EVIDENCE_IMAGES).toBe(5);
    expect(MAX_CHAT_ATTACHMENTS).toBe(3);
    expect(MAX_REVIEW_IMAGES).toBe(5);
  });

  it('describes rejected images for the inline warning', () => {
    expect(describeEvidenceRejection(0, 0)).toBeNull();
    expect(describeEvidenceRejection(1, 0)).toContain('10MB');
    expect(describeEvidenceRejection(0, 2)).toContain('2 ảnh');
    const combined = describeEvidenceRejection(1, 2);
    expect(combined).toContain('2 ảnh không đọc được');
    expect(combined).toContain('1 ảnh vượt quá 10MB');
  });
});
