/**
 * Per-request analytics for situational (non-food intent) filtering.
 *
 * Tracks how many venues were dropped at each stage (cache, google-transformed,
 * database-fallback, candidate-set, …) when the user picked a non-food intent
 * (Kultur / Aktivität / Nightlife). Emits a single structured summary log per
 * recommendation request and dispatches a `hioutz:situational-filter-report`
 * CustomEvent so devtools or admin UIs can subscribe.
 */

export interface SituationalFilterStageStat {
  source: string;
  before: number;
  after: number;
  removed: number;
}

export interface SituationalFilterReport {
  requestId: string;
  startedAt: number;
  durationMs: number;
  primaryCategoryId: string | null;
  secondaryCategoryId: string | null;
  totalSeen: number;
  totalRemoved: number;
  stages: SituationalFilterStageStat[];
  meta?: Record<string, unknown>;
}

interface RequestContext {
  requestId: string;
  startedAt: number;
  primaryCategoryId: string | null;
  secondaryCategoryId: string | null;
  meta?: Record<string, unknown>;
  stages: SituationalFilterStageStat[];
}

// Stack so nested / overlapping requests don't lose data.
const stack: RequestContext[] = [];

const newId = () =>
  `sit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const beginSituationalFilterRequest = (
  primaryCategoryId: string | null | undefined,
  secondaryCategoryId: string | null | undefined,
  meta?: Record<string, unknown>,
): string => {
  const ctx: RequestContext = {
    requestId: newId(),
    startedAt: Date.now(),
    primaryCategoryId: primaryCategoryId ?? null,
    secondaryCategoryId: secondaryCategoryId ?? null,
    meta,
    stages: [],
  };
  stack.push(ctx);
  return ctx.requestId;
};

export const recordSituationalFilter = (
  source: string,
  before: number,
  after: number,
): void => {
  const ctx = stack[stack.length - 1];
  if (!ctx) return;
  ctx.stages.push({
    source,
    before,
    after,
    removed: Math.max(0, before - after),
  });
};

export const endSituationalFilterRequest = (
  requestId?: string,
): SituationalFilterReport | null => {
  // Pop matching context (or top of stack if no id given).
  const idx = requestId
    ? stack.findIndex(c => c.requestId === requestId)
    : stack.length - 1;
  if (idx < 0) return null;
  const ctx = stack.splice(idx, 1)[0];

  const totalSeen = ctx.stages.reduce((s, x) => s + x.before, 0);
  const totalRemoved = ctx.stages.reduce((s, x) => s + x.removed, 0);

  const report: SituationalFilterReport = {
    requestId: ctx.requestId,
    startedAt: ctx.startedAt,
    durationMs: Date.now() - ctx.startedAt,
    primaryCategoryId: ctx.primaryCategoryId,
    secondaryCategoryId: ctx.secondaryCategoryId,
    totalSeen,
    totalRemoved,
    stages: ctx.stages,
    meta: ctx.meta,
  };

  // Only emit when the intent actually triggered filtering.
  const isNonFood = !!ctx.primaryCategoryId && ctx.primaryCategoryId !== 'food';
  if (isNonFood) {
    const summary = ctx.stages
      .map(s => `${s.source}: ${s.before}→${s.after} (-${s.removed})`)
      .join(' | ');
    // Single, parseable line per request.
    console.log(
      `📊 SITUATIONAL FILTER REPORT [${ctx.primaryCategoryId}${ctx.secondaryCategoryId ? '+' + ctx.secondaryCategoryId : ''}] ` +
        `total dropped: ${totalRemoved}/${totalSeen} in ${report.durationMs}ms — ${summary || '(no stages)'}`,
      report,
    );

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('hioutz:situational-filter-report', { detail: report }),
        );
      } catch {
        /* noop */
      }
    }
  }

  return report;
};
