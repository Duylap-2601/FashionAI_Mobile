import {
  LOWER_FIELD_DEFS,
  OVERVIEW_FIELD_DEFS,
  SHIRT_SIZES,
  UPPER_FIELD_DEFS,
} from '@/features/measurements/constants/measurement-fields';
import type { PolicyBlock, PolicyDocument, PolicyLink } from '../../types/policy';
import { POLICY_DOCUMENTS, resolvePolicyType } from './policy-documents';
import { DEFAULT_POLICY_TYPE, POLICY_CONTACT, POLICY_NAV_ITEMS } from './policy-nav';

const documents = Object.values(POLICY_DOCUMENTS);

function allText(document: PolicyDocument): string {
  return JSON.stringify(document);
}

function blocksOf(document: PolicyDocument): PolicyBlock[] {
  return document.sections.flatMap((section) => section.blocks);
}

function linksOf(document: PolicyDocument): PolicyLink[] {
  return blocksOf(document).flatMap((block) => {
    if (block.type === 'link') return [block.link];
    if (block.type === 'note' && block.link) return [block.link];
    return [];
  });
}

describe('policy documents', () => {
  it('has one document per navigation entry, keyed by its type', () => {
    expect(POLICY_NAV_ITEMS.map((item) => item.type).sort()).toEqual(
      Object.keys(POLICY_DOCUMENTS).sort(),
    );
    for (const [type, document] of Object.entries(POLICY_DOCUMENTS)) {
      expect(document.type).toBe(type);
    }
  });

  it.each(documents.map((document) => [document.type, document] as const))(
    '%s is complete and well formed',
    (_type, document) => {
      expect(document.title.trim()).not.toBe('');
      expect(document.summary.trim()).not.toBe('');
      expect(document.updatedAt).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(document.sections.length).toBeGreaterThan(0);

      const ids = document.sections.map((section) => section.id);
      expect(new Set(ids).size).toBe(ids.length);

      for (const section of document.sections) {
        expect(section.title.trim()).not.toBe('');
        expect(section.blocks.length).toBeGreaterThan(0);
      }

      for (const block of blocksOf(document)) {
        if (block.type === 'table') {
          expect(block.rows.length).toBeGreaterThan(0);
          for (const row of block.rows) {
            expect(row).toHaveLength(block.columns.length);
          }
          // Rows are keyed by their first cell when rendered.
          const keys = block.rows.map((row) => row[0]);
          expect(new Set(keys).size).toBe(keys.length);
        }
        if (block.type === 'list') {
          expect(block.items.length).toBeGreaterThan(0);
          // List entries are keyed by their text (or term) when rendered.
          const keys = block.items.map((item) => (typeof item === 'string' ? item : item.term));
          expect(new Set(keys).size).toBe(keys.length);
        }
      }
    },
  );

  it('only links to policies that exist', () => {
    for (const document of documents) {
      for (const link of linksOf(document)) {
        if (link.target.kind === 'policy') {
          expect(POLICY_DOCUMENTS[link.target.policy]).toBeDefined();
        }
      }
    }
  });

  it('keeps UI copy free of em dashes', () => {
    for (const document of documents) {
      expect(allText(document)).not.toContain('—');
    }
  });
});

describe('business rules copied from FE', () => {
  it('return policy is refund-only within 7 days of completion', () => {
    const text = allText(POLICY_DOCUMENTS.return);
    expect(POLICY_DOCUMENTS.return.highlights).toEqual([
      { label: 'Thời hạn gửi yêu cầu', value: '7 ngày' },
      { label: 'Tính từ', value: 'Khi đơn hoàn tất' },
      { label: 'Hướng xử lý', value: 'Hoàn tiền' },
    ]);
    expect(text).not.toMatch(/1-1|đổi hàng mới|may lại/i);
  });

  it('return policy lists the reason groups with their shipping fee rules', () => {
    const table = blocksOf(POLICY_DOCUMENTS.return).find(
      (block): block is Extract<PolicyBlock, { type: 'table' }> => block.type === 'table',
    );
    expect(table?.rows.map((row) => row[0])).toEqual([
      'Sai kích thước / số đo',
      'Sai màu / sai mẫu',
      'Lỗi đường may / chất lượng vải',
      'Lý do khác',
    ]);
  });

  it('warranty is lifetime and free for seams and trims', () => {
    expect(POLICY_DOCUMENTS.warranty.summary).toContain('bảo hành trọn đời');
    expect(POLICY_DOCUMENTS.warranty.highlights?.[0]).toEqual({
      label: 'Bảo hành đường may và phụ kiện',
      value: 'Trọn đời',
    });
  });

  it('quotes the policy hotline and email', () => {
    expect(allText(POLICY_DOCUMENTS.warranty)).toContain(POLICY_CONTACT.hotline);
    expect(allText(POLICY_DOCUMENTS.warranty)).toContain(POLICY_CONTACT.email);
    expect(allText(POLICY_DOCUMENTS.privacy)).toContain(POLICY_CONTACT.email);
    expect(allText(POLICY_DOCUMENTS.return)).toContain(POLICY_CONTACT.hotline);
  });
});

describe('size guide', () => {
  const tables = blocksOf(POLICY_DOCUMENTS['size-guide']).filter(
    (block): block is Extract<PolicyBlock, { type: 'table' }> => block.type === 'table',
  );

  it('reads measurement ranges from the measurement form fields', () => {
    const rows = tables.flatMap((table) => table.rows);
    for (const field of [...OVERVIEW_FIELD_DEFS, ...UPPER_FIELD_DEFS, ...LOWER_FIELD_DEFS]) {
      expect(rows).toContainEqual([
        field.label,
        field.desc,
        `${field.min} - ${field.max} ${field.unit}`,
      ]);
    }
  });

  it('shows the reference size chart as a compact table', () => {
    const chart = tables.find((table) => table.compact);
    expect(chart?.rows.map((row) => row[0])).toEqual(SHIRT_SIZES);
  });
});

describe('resolvePolicyType', () => {
  it('accepts known types and falls back for anything else', () => {
    expect(resolvePolicyType('warranty')).toBe('warranty');
    expect(resolvePolicyType('size-guide')).toBe('size-guide');
    expect(resolvePolicyType('return-policy')).toBe(DEFAULT_POLICY_TYPE);
    expect(resolvePolicyType(undefined)).toBe(DEFAULT_POLICY_TYPE);
  });
});
