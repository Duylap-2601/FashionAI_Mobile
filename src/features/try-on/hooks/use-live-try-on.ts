import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { liveTryOnApi } from '@/features/try-on/api/live-try-on.api';
import { LiveSession } from '@/features/try-on/types/live-try-on';
import { generateIdempotencyKey } from '@/features/try-on/utils/idempotency-key';
import { ApiError } from '@/types/api';

export type LiveTryOnPhase =
  | 'idle'
  | 'starting'
  | 'active'
  | 'paused'
  | 'ending'
  | 'ended'
  | 'error';

interface UseLiveTryOnResult {
  phase: LiveTryOnPhase;
  session: LiveSession | null;
  remainingSeconds: number;
  error: string | null;
  start: (productId: string) => Promise<void>;
  pause: (reason?: string) => Promise<void>;
  resume: () => Promise<void>;
  end: (reason?: string) => Promise<void>;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Đã xảy ra lỗi, vui lòng thử lại.';
}

export function useLiveTryOn(): UseLiveTryOnResult {
  const [phase, setPhase] = useState<LiveTryOnPhase>('idle');
  const [session, setSession] = useState<LiveSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const productIdRef = useRef<string | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const end = useCallback(
    async (reason: string = 'client_end') => {
      stopCountdown();
      const current = sessionRef.current;
      if (!current) {
        setPhase('ended');
        return;
      }
      setPhase('ending');
      try {
        await liveTryOnApi.end(current.id, reason);
      } catch (err) {
        // Session may already be gone server-side; proceed to local ended state regardless.
        console.warn('Failed to end live session:', err);
      } finally {
        sessionRef.current = null;
        setSession(null);
        setPhase('ended');
      }
    },
    [stopCountdown],
  );

  const startCountdown = useCallback(
    (seconds: number) => {
      stopCountdown();
      setRemainingSeconds(seconds);
      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            stopCountdown();
            end('duration_elapsed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [end, stopCountdown],
  );

  const start = useCallback(
    async (productId: string) => {
      setPhase('starting');
      setError(null);
      productIdRef.current = productId;
      try {
        const created = await liveTryOnApi.createSession(productId, generateIdempotencyKey());
        sessionRef.current = created;
        setSession(created);
        setPhase('active');
        startCountdown(created.remainingSeconds);
      } catch (err) {
        setError(toMessage(err));
        setPhase('error');
      }
    },
    [startCountdown],
  );

  const pause = useCallback(
    async (reason: string = 'client_pause') => {
      const current = sessionRef.current;
      if (!current) return;
      stopCountdown();
      try {
        const updated = await liveTryOnApi.pause(current.id, reason);
        sessionRef.current = updated;
        setSession(updated);
        setPhase('paused');
      } catch (err) {
        setError(toMessage(err));
        setPhase('error');
      }
    },
    [stopCountdown],
  );

  const resume = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    try {
      const updated = await liveTryOnApi.resume(current.id, productIdRef.current ?? undefined);
      sessionRef.current = updated;
      setSession(updated);
      setPhase('active');
      startCountdown(updated.remainingSeconds);
    } catch (err) {
      setError(toMessage(err));
      setPhase('error');
    }
  }, [startCountdown]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' && sessionRef.current && phase === 'active') {
        pause('background');
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [pause, phase]);

  useEffect(() => stopCountdown, [stopCountdown]);

  return { phase, session, remainingSeconds, error, start, pause, resume, end };
}
