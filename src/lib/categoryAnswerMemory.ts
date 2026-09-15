/**
 * Category answer memory & reconciliation.
 *
 * When the user switches the situational category inside the date flow
 * (e.g. "Essen" → "Natur & Outdoor"), already given answers must not silently
 * leak into a category where they make no sense — and they must not be lost
 * either when the user switches back.
 *
 * Strategy:
 *   1. Before leaving a category, its answers are snapshotted per category
 *      in sessionStorage (ephemeral, same lifetime as the situational filter).
 *   2. When entering a category, its previous snapshot is restored.
 *   3. Everything that survives the switch is filtered against the new
 *      category's wizard config + priority profile, so wizard sections,
 *      follow-up questions and scoring weights stay consistent.
 */

import {
  getCategoryWizardConfig,
  getCategoryPriorityProfile,
  getCategoryVenueTypeIds,
  sectionsFromProfile,
  type PriorityDimensionId,
} from '@/lib/categoryWizardConfig';
import {
  DEFAULT_PRIORITY_WEIGHTS,
  priorityWeightsForCategory,
  type PriorityWeights,
} from '@/components/date-planning/preferences/PriorityPicker';
import type { SituationalCategoryId } from '@/lib/situationalCategories';

export interface CategoryAnswerSnapshot {
  cuisines: string[];
  excludedCuisines: string[];
  venueTypes: string[];
  vibes: string[];
  priceRange: string[];
  times: string[];
  dietary: string[];
  weights: PriorityWeights;
}

const STORAGE_KEY = 'hioutz-category-answers';
const GENERIC = '__none__';

const keyOf = (id: SituationalCategoryId | null | undefined) => id ?? GENERIC;

type Store = Partial<Record<string, CategoryAnswerSnapshot>>;

/** Fallback for environments without sessionStorage (SSR, tests). */
let memoryStore: Store = {};

const readStore = (): Store => {
  if (typeof window === 'undefined') return memoryStore;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return memoryStore;
  }
};

const writeStore = (store: Store) => {
  memoryStore = store;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota / private mode */
  }
};

export const saveCategoryAnswers = (
  categoryId: SituationalCategoryId | null | undefined,
  snapshot: CategoryAnswerSnapshot,
) => {
  const store = readStore();
  store[keyOf(categoryId)] = snapshot;
  writeStore(store);
};

export const loadCategoryAnswers = (
  categoryId: SituationalCategoryId | null | undefined,
): CategoryAnswerSnapshot | null => readStore()[keyOf(categoryId)] ?? null;

/** All snapshots — used to persist them in the user profile. */
export const getAllCategoryAnswers = (): Store => readStore();

/**
 * Restores snapshots persisted in the user profile (survives app restarts).
 * Answers already present in this session win, so unsaved edits aren't lost.
 */
export const hydrateCategoryAnswers = (stored: Store | null | undefined) => {
  if (!stored || typeof stored !== 'object') return;
  const current = readStore();
  writeStore({ ...stored, ...current });
};

export const clearCategoryAnswers = () => {
  memoryStore = {};
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

export interface ReconcileArgs {
  from: SituationalCategoryId | null | undefined;
  to: SituationalCategoryId | null | undefined;
  current: CategoryAnswerSnapshot;
  /** True when the user changed the priority sliders manually. */
  weightsTouched?: boolean;
}

export interface ReconcileResult {
  answers: CategoryAnswerSnapshot;
  /** Number of answers restored from an earlier visit to the target category. */
  restoredCount: number;
  /** Number of answers dropped because they don't apply to the new category. */
  droppedCount: number;
}

const uniq = (values: string[]) => Array.from(new Set(values));
const countAll = (s: CategoryAnswerSnapshot) =>
  s.cuisines.length + s.excludedCuisines.length + s.venueTypes.length +
  s.vibes.length + s.priceRange.length + s.times.length + s.dietary.length;

/**
 * Merges what the user already answered with what was stored for the target
 * category, then strips everything the target category doesn't ask for.
 */
export function reconcileCategoryAnswers({ from, to, current, weightsTouched = false }: ReconcileArgs): ReconcileResult {
  const cfg = getCategoryWizardConfig(to ?? null);
  const profile = getCategoryPriorityProfile(to ?? null);
  const sections = sectionsFromProfile(profile);
  const stored = loadCategoryAnswers(to);
  const isFood = cfg.mainPickerStorage === 'preferred_cuisines';
  const allowedVenueTypes = getCategoryVenueTypeIds(to ?? null);

  const merge = (a: string[], b: string[] | undefined) => uniq([...(b ?? []), ...a]);

  // Shared dimensions survive a switch; category-specific ones are restored.
  const mergedVibes = merge(current.vibes, stored?.vibes);
  const mergedPrice = merge(current.priceRange, stored?.priceRange);
  const mergedTimes = merge(current.times, stored?.times);
  const mergedDietary = merge(current.dietary, stored?.dietary);
  const mergedVenueTypes = merge(current.venueTypes, stored?.venueTypes);
  const mergedCuisines = merge(isFood ? current.cuisines : [], stored?.cuisines);
  const mergedExcluded = merge(isFood ? current.excludedCuisines : [], stored?.excludedCuisines);

  const answers: CategoryAnswerSnapshot = {
    // Main picker answers only exist for the matching storage kind.
    cuisines: isFood ? mergedCuisines : [],
    excludedCuisines: sections.has('excluded') ? mergedExcluded : [],
    venueTypes: mergedVenueTypes.filter(id => allowedVenueTypes.includes(id)),
    vibes: cfg.vibeWhitelist ? mergedVibes.filter(v => cfg.vibeWhitelist!.includes(v)) : mergedVibes,
    priceRange: sections.has('budget') ? mergedPrice : [],
    times: sections.has('timing') ? mergedTimes : [],
    dietary: sections.has('dietary') ? mergedDietary : [],
    weights: resolveWeights({ from, to, current: current.weights, weightsTouched }),
  };

  const flat = (x: CategoryAnswerSnapshot) => [
    ...x.cuisines, ...x.excludedCuisines, ...x.venueTypes,
    ...x.vibes, ...x.priceRange, ...x.times, ...x.dietary,
  ];
  const currentValues = new Set(flat(current));
  const resultValues = flat(answers);
  const restoredCount = resultValues.filter(v => !currentValues.has(v)).length;
  const droppedCount = flat(current).filter(v => !resultValues.includes(v)).length;

  return { answers, restoredCount, droppedCount };
}

const DIMENSIONS: PriorityDimensionId[] = ['cuisine', 'vibe', 'price', 'location'];

/**
 * Priority sliders: manual adjustments are carried over only for dimensions
 * the new category still asks about — everything else falls back to the
 * category preset so wizard sections and scoring stay in sync.
 */
export function resolveWeights({ from, to, current, weightsTouched }: {
  from: SituationalCategoryId | null | undefined;
  to: SituationalCategoryId | null | undefined;
  current: PriorityWeights;
  weightsTouched: boolean;
}): PriorityWeights {
  const nextPreset = priorityWeightsForCategory(to ?? null);
  if (!weightsTouched) return nextPreset;

  const prevPreset = priorityWeightsForCategory(from ?? null);
  const nextProfile = getCategoryPriorityProfile(to ?? null);
  const visible = new Set(DIMENSIONS.filter(d => nextProfile[d] > 0));
  const result: PriorityWeights = { ...DEFAULT_PRIORITY_WEIGHTS, ...nextPreset };
  DIMENSIONS.forEach(d => {
    const userChanged = current[d] !== prevPreset[d];
    if (userChanged && visible.has(d)) result[d] = current[d];
  });
  return result;
}
