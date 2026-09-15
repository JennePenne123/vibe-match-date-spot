import { supabase } from '@/integrations/supabase/client';

/**
 * Robust background persistence for the per-category answers.
 *
 * - retries with exponential backoff
 * - waits for the connection to come back when offline
 * - survives a reload (pending payload is kept in localStorage)
 * - exposes a status so the UI can show a failure + manual retry
 */

const LS_KEY = 'hioutz-pending-profile-save';
const BACKOFF_MS = [1000, 3000, 8000, 20000];

export type BackgroundSaveState = 'idle' | 'saving' | 'retrying' | 'saved' | 'failed';

export interface BackgroundSaveStatus {
  state: BackgroundSaveState;
  attempt: number;
  error?: string;
  pending: boolean;
}

interface PendingTask {
  userId: string;
  categoryAnswers: unknown;
  queuedAt: number;
}

let status: BackgroundSaveStatus = { state: 'idle', attempt: 0, pending: false };
const listeners = new Set<(s: BackgroundSaveStatus) => void>();
let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let onlineHooked = false;

function emit(next: Partial<BackgroundSaveStatus>) {
  status = { ...status, ...next };
  listeners.forEach((l) => l(status));
}

export function subscribeBackgroundSave(cb: (s: BackgroundSaveStatus) => void): () => void {
  listeners.add(cb);
  cb(status);
  return () => listeners.delete(cb);
}

export function getBackgroundSaveStatus(): BackgroundSaveStatus {
  return status;
}

function readPending(): PendingTask | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PendingTask) : null;
  } catch {
    return null;
  }
}

function writePending(task: PendingTask | null) {
  try {
    if (task) localStorage.setItem(LS_KEY, JSON.stringify(task));
    else localStorage.removeItem(LS_KEY);
  } catch {
    /* storage unavailable — in-memory retry still works */
  }
}

async function writeToProfile(task: PendingTask): Promise<void> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('id, lifestyle_data')
    .eq('user_id', task.userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return; // nothing saved yet — the full save will create the row

  const { error: updateError } = await supabase
    .from('user_preferences')
    .update({
      lifestyle_data: {
        ...(((data.lifestyle_data as Record<string, unknown>) || {}) as Record<string, unknown>),
        category_answers: task.categoryAnswers,
      },
    })
    .eq('user_id', task.userId);
  if (updateError) throw updateError;
}

function hookOnline() {
  if (onlineHooked || typeof window === 'undefined') return;
  onlineHooked = true;
  window.addEventListener('online', () => {
    if (readPending()) void flushBackgroundSave();
  });
}

async function runQueue() {
  if (running) return;
  const task = readPending();
  if (!task) return;
  running = true;

  try {
    for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        emit({ state: 'failed', attempt, pending: true, error: 'offline' });
        return; // the 'online' listener resumes
      }
      emit({ state: attempt === 0 ? 'saving' : 'retrying', attempt, pending: true, error: undefined });
      try {
        await writeToProfile(task);
        writePending(null);
        emit({ state: 'saved', attempt, pending: false, error: undefined });
        return;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (attempt === BACKOFF_MS.length) {
          console.error('Background profile save failed permanently:', e);
          emit({ state: 'failed', attempt, pending: true, error: message });
          return;
        }
        await new Promise<void>((resolve) => {
          timer = setTimeout(resolve, BACKOFF_MS[attempt]);
        });
      }
    }
  } finally {
    running = false;
    timer = null;
  }
}

/** Queue a category-answers write; returns immediately. */
export function queueProfileSave(userId: string, categoryAnswers: unknown): void {
  hookOnline();
  writePending({ userId, categoryAnswers, queuedAt: Date.now() });
  emit({ pending: true });
  void runQueue();
}

/** Retry a pending save now (manual "try again" or on mount). */
export function flushBackgroundSave(): Promise<void> {
  hookOnline();
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  running = false;
  return runQueue();
}

/** True when a write is still waiting to be persisted. */
export function hasPendingProfileSave(): boolean {
  return !!readPending();
}
