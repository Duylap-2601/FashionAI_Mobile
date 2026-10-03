export type LiveSessionStatus = 'active' | 'paused' | 'ended';

export interface LiveSessionConnection {
  // Placeholder for whatever Decart (or a future RN-compatible realtime SDK)
  // returns to establish the actual video stream. Not consumed yet — see
  // LiveStreamPlaceholder for the open integration question.
  clientToken?: string;
  model?: string;
}

export interface LiveSession {
  id: string;
  productId: string;
  status: LiveSessionStatus;
  remainingSeconds: number;
  connection?: LiveSessionConnection;
  createdAt: string;
}

export interface LiveQuota {
  enabled: boolean;
  eligible: boolean;
  remaining: number;
  limit: number | null;
  seconds: number;
  resetAt?: string;
}

export interface LiveGarmentCheck {
  productId: string;
  supported: boolean;
  category?: 'UPPER' | 'LOWER' | 'FULL_BODY';
}
