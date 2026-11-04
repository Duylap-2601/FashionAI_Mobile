import type { PolicyDocument, PolicyType } from '../../types/policy';
import { DEFAULT_POLICY_TYPE, isPolicyType } from './policy-nav';
import { PRIVACY_POLICY } from './privacy-policy';
import { RETURN_POLICY } from './return-policy';
import { SIZE_GUIDE } from './size-guide';
import { TERMS_OF_SERVICE } from './terms-of-service';
import { WARRANTY_POLICY } from './warranty-policy';

export const POLICY_DOCUMENTS: Record<PolicyType, PolicyDocument> = {
  return: RETURN_POLICY,
  warranty: WARRANTY_POLICY,
  'size-guide': SIZE_GUIDE,
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_SERVICE,
};

/** Route params are untrusted (deep links); unknown types fall back to the default page. */
export function resolvePolicyType(value: unknown): PolicyType {
  return isPolicyType(value) ? value : DEFAULT_POLICY_TYPE;
}
