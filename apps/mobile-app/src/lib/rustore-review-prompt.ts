import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SubscriptionPlan } from "@wibestyle/shared-types";

export const RUSTORE_PACKAGE_NAME = "ru.vibestyle.app";
export const RUSTORE_REVIEW_URL = `https://www.rustore.ru/catalog/app/${RUSTORE_PACKAGE_NAME}`;

export const REVIEW_PROMPT_STORAGE_KEY = "wibestyle.rustore.reviewPrompt.v1";

const DAY_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 30 * DAY_MS;
const NEGATIVE_COOLDOWN_MS = 30 * DAY_MS;
const MAX_COUNTED_SESSIONS = 50;

export type ReviewFeedbackReason =
  | "bad_fit"
  | "wrong_item"
  | "slow_generation"
  | "photo_problem"
  | "other";

export type ReviewPromptState = {
  successfulTryOnCount: number;
  countedSessionIds: string[];
  lastReviewPromptShownAt?: string;
  reviewPromptDismissedUntil?: string;
  reviewPromptCompleted?: boolean;
  reviewPromptNeverShowAgain?: boolean;
  lastNegativeFeedbackAt?: string;
  lastNegativeFeedbackReason?: ReviewFeedbackReason;
};

export function emptyReviewPromptState(): ReviewPromptState {
  return {
    successfulTryOnCount: 0,
    countedSessionIds: [],
  };
}

export function getReviewPromptThreshold(plan?: SubscriptionPlan | null): number {
  return plan === "wibe" || plan === "elite" ? 5 : 3;
}

export function shouldShowReviewPromptGate(
  state: ReviewPromptState,
  plan?: SubscriptionPlan | null,
  now = new Date(),
): boolean {
  if (state.reviewPromptCompleted || state.reviewPromptNeverShowAgain) return false;
  if (state.successfulTryOnCount < getReviewPromptThreshold(plan)) return false;
  if (isFutureDate(state.reviewPromptDismissedUntil, now)) return false;
  if (isWithinCooldown(state.lastReviewPromptShownAt, COOLDOWN_MS, now)) return false;
  if (isWithinCooldown(state.lastNegativeFeedbackAt, NEGATIVE_COOLDOWN_MS, now)) return false;
  return true;
}

export function recordSuccessfulTryOnInState(
  state: ReviewPromptState,
  sessionId: string,
): ReviewPromptState {
  if (!sessionId || state.countedSessionIds.includes(sessionId)) {
    return state;
  }
  const countedSessionIds = [sessionId, ...state.countedSessionIds].slice(0, MAX_COUNTED_SESSIONS);
  return {
    ...state,
    countedSessionIds,
    successfulTryOnCount: state.successfulTryOnCount + 1,
  };
}

export function markReviewPromptShownInState(state: ReviewPromptState, now = new Date()): ReviewPromptState {
  return {
    ...state,
    lastReviewPromptShownAt: now.toISOString(),
  };
}

export function deferReviewPromptInState(state: ReviewPromptState, now = new Date()): ReviewPromptState {
  return {
    ...state,
    reviewPromptDismissedUntil: new Date(now.getTime() + COOLDOWN_MS).toISOString(),
  };
}

export function completeReviewPromptInState(state: ReviewPromptState): ReviewPromptState {
  return {
    ...state,
    reviewPromptCompleted: true,
  };
}

export function neverShowReviewPromptInState(state: ReviewPromptState): ReviewPromptState {
  return {
    ...state,
    reviewPromptNeverShowAgain: true,
  };
}

export function recordNegativeReviewFeedbackInState(
  state: ReviewPromptState,
  reason: ReviewFeedbackReason,
  now = new Date(),
): ReviewPromptState {
  return {
    ...state,
    lastNegativeFeedbackAt: now.toISOString(),
    lastNegativeFeedbackReason: reason,
  };
}

export async function readReviewPromptState(): Promise<ReviewPromptState> {
  const raw = await AsyncStorage.getItem(REVIEW_PROMPT_STORAGE_KEY);
  if (!raw) return emptyReviewPromptState();
  try {
    const parsed = JSON.parse(raw) as Partial<ReviewPromptState>;
    return normalizeState(parsed);
  } catch {
    return emptyReviewPromptState();
  }
}

export async function saveReviewPromptState(state: ReviewPromptState): Promise<void> {
  await AsyncStorage.setItem(REVIEW_PROMPT_STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

export async function recordSuccessfulTryOnAndResolvePrompt(
  sessionId: string,
  plan?: SubscriptionPlan | null,
  now = new Date(),
): Promise<{ state: ReviewPromptState; shouldShowGate: boolean }> {
  const current = await readReviewPromptState();
  const counted = recordSuccessfulTryOnInState(current, sessionId);
  const shouldShowGate = shouldShowReviewPromptGate(counted, plan, now);
  const next = shouldShowGate ? markReviewPromptShownInState(counted, now) : counted;
  await saveReviewPromptState(next);
  return { state: next, shouldShowGate };
}

export async function deferReviewPrompt(now = new Date()): Promise<void> {
  const state = await readReviewPromptState();
  await saveReviewPromptState(deferReviewPromptInState(state, now));
}

export async function completeReviewPrompt(): Promise<void> {
  const state = await readReviewPromptState();
  await saveReviewPromptState(completeReviewPromptInState(state));
}

export async function neverShowReviewPrompt(): Promise<void> {
  const state = await readReviewPromptState();
  await saveReviewPromptState(neverShowReviewPromptInState(state));
}

export async function recordNegativeReviewFeedback(reason: ReviewFeedbackReason, now = new Date()): Promise<void> {
  const state = await readReviewPromptState();
  await saveReviewPromptState(recordNegativeReviewFeedbackInState(state, reason, now));
}

function normalizeState(state: Partial<ReviewPromptState>): ReviewPromptState {
  return {
    successfulTryOnCount: Math.max(0, Number(state.successfulTryOnCount ?? 0)),
    countedSessionIds: Array.isArray(state.countedSessionIds)
      ? state.countedSessionIds.filter((item): item is string => typeof item === "string").slice(0, MAX_COUNTED_SESSIONS)
      : [],
    lastReviewPromptShownAt: optionalString(state.lastReviewPromptShownAt),
    reviewPromptDismissedUntil: optionalString(state.reviewPromptDismissedUntil),
    reviewPromptCompleted: state.reviewPromptCompleted === true,
    reviewPromptNeverShowAgain: state.reviewPromptNeverShowAgain === true,
    lastNegativeFeedbackAt: optionalString(state.lastNegativeFeedbackAt),
    lastNegativeFeedbackReason: state.lastNegativeFeedbackReason,
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isFutureDate(value: string | undefined, now: Date): boolean {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > now.getTime();
}

function isWithinCooldown(value: string | undefined, cooldownMs: number, now: Date): boolean {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && now.getTime() - timestamp < cooldownMs;
}
