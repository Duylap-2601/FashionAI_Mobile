// Shape of the policy documents, mirroring FE
// `FashionAI_FE/src/features/policies/types/policy.ts`. Links point at app
// screens instead of web URLs.

/** Value of the `Policy` route's `type` param. */
export type PolicyType = 'return' | 'warranty' | 'size-guide' | 'privacy' | 'terms';

/** Where an in-document link leads inside the app. */
export type PolicyLinkTarget =
  | { kind: 'policy'; policy: PolicyType }
  | { kind: 'screen'; screen: 'Orders' | 'Measurements' | 'SubscriptionPlans' };

export interface PolicyLink {
  label: string;
  target: PolicyLinkTarget;
}

/** A list entry: plain text, or a bold term followed by its explanation. */
export type PolicyListItem = string | { term: string; text: string };

export type PolicyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: PolicyListItem[]; ordered?: boolean }
  /** Tables stack into cards on phones unless `compact` (short cells that fit a narrow screen). */
  | { type: 'table'; columns: string[]; rows: string[][]; caption?: string; compact?: boolean }
  | { type: 'note'; tone: 'info' | 'warning'; text: string; link?: PolicyLink }
  | { type: 'link'; link: PolicyLink };

export interface PolicySection {
  /** Unique within the document. */
  id: string;
  title: string;
  blocks: PolicyBlock[];
}

export interface PolicyHighlight {
  label: string;
  value: string;
}

export interface PolicyDocument {
  type: PolicyType;
  title: string;
  summary: string;
  /** Display date, dd/mm/yyyy. */
  updatedAt: string;
  highlights?: PolicyHighlight[];
  sections: PolicySection[];
}

export interface PolicyNavItem {
  type: PolicyType;
  label: string;
  /** One-line summary for menus. */
  description: string;
}
