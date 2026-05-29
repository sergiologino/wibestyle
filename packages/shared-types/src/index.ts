export type FeatureFlag =
  | "videoTryOn"
  | "multiItemTryOn"
  | "search"
  | "sizeAdvisory"
  | "eliteFrame"
  | "futureStylist"
  | "futureMakeup"
  | "futureHairstyle";

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlag, boolean> = {
  videoTryOn: false,
  multiItemTryOn: false,
  search: false,
  sizeAdvisory: false,
  eliteFrame: false,
  futureStylist: false,
  futureMakeup: false,
  futureHairstyle: false,
};

export type SubscriptionPlan = "trial" | "wibe" | "elite";

export type User = {
  id: string;
  phone: string;
  createdAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type Anthropometry = {
  heightCm?: number;
  weightKg?: number;
  bustCm?: number;
  waistCm?: number;
  hipsCm?: number;
  shoeSizeEu?: number;
  clothingSize?: string;
};

export type ProfilePrivacy = {
  faceHidden: boolean;
  backgroundHidden: boolean;
  featuresHidden: boolean;
};

export type UserProfile = {
  userId: string;
  displayName?: string;
  gender?: "female" | "male" | "other";
  anthropometry?: Anthropometry;
  privacy?: ProfilePrivacy;
  plan: SubscriptionPlan;
  trialGenerationsLeft: number;
  planGenerationsLeft?: number;
  billingPeriod?: "monthly" | "annual";
  subscriptionExpiresAt?: string;
  promoDiscountPercent?: number;
  activeAvatarId?: string;
};

export type UserEntitlements = {
  singleTryOn: boolean;
  multiItemTryOn: boolean;
  priorityQueue: boolean;
  eliteFrame: boolean;
  earlyAccess: boolean;
  videoTryOn: boolean;
  search: boolean;
  sizeAdvisory: boolean;
  favorites: boolean;
  gallery: boolean;
  history: boolean;
};

export type BillingPeriod = "monthly" | "annual";

export type BillingPlanOffer = {
  plan: Exclude<SubscriptionPlan, "trial">;
  period: BillingPeriod;
  basePriceRub: number;
  priceRub: number;
  generationsPerPeriod: number;
  monthlyEquivalentRub?: number;
  savingsPercent?: number;
  recommended?: boolean;
  upgradeFromWibe?: boolean;
  upgradePriceRub?: number;
  fullPriceRub?: number;
};

export type BillingSubscriberInfo = {
  plan: SubscriptionPlan;
  billingPeriod: BillingPeriod;
  subscriptionActive: boolean;
};

export type PromoCodeRecord = {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usesCount: number;
  usesLeft: number;
  expiresAt: string;
  createdAt: string;
  label?: string;
  revokedAt?: string;
  active: boolean;
};

export type PromoValidationResponse = {
  valid: boolean;
  code: string;
  discountPercent: number;
  usesLeft: number;
  expiresAt: string;
  label?: string;
};

export type AvatarStatus =
  | "DRAFT"
  | "PHOTO_UPLOADED"
  | "VALIDATING"
  | "VALIDATION_FAILED"
  | "PREPROCESSING"
  | "READY"
  | "REJECTED"
  | "DELETED";

export type AvatarRecord = {
  id: string;
  userId: string;
  status: AvatarStatus;
  active: boolean;
  qualityScore?: number;
  warnings?: string[];
  privacyFaceHidden: boolean;
  privacyBackgroundHidden: boolean;
  privacyFeaturesHidden: boolean;
  exifRemoved?: boolean;
  pipelineVersion?: string;
  photoOriginalUrl?: string;
  photoProcessedUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Maximum non-deleted avatars per account. Anthropometry stays on profile only. */
export const MAX_AVATARS_PER_USER = 3;

export type UpdateProfilePayload = {
  displayName?: string;
  gender?: "female" | "male" | "other";
  heightCm?: number;
  weightKg?: number;
  bustCm?: number;
  waistCm?: number;
  hipsCm?: number;
  shoeSizeEu?: number;
  clothingSize?: string;
  profileType?: string;
  sizingSystem?: string;
  privacyFaceHidden?: boolean;
  privacyBackgroundHidden?: boolean;
  privacyFeaturesHidden?: boolean;
};

export type CreateAvatarPayload = {
  privacyFaceHidden?: boolean;
  privacyBackgroundHidden?: boolean;
  privacyFeaturesHidden?: boolean;
};

export type TryOnSessionStatus = "draft" | "generating" | "ready" | "failed";

export type TryOnSourceType = "marketplace_link" | "garment_photo" | "gallery_upload";

export type TryOnErrorCode =
  | "PRODUCT_PARSE_FAILED"
  | "MARKETPLACE_UNSUPPORTED"
  | "PRODUCT_IMAGE_NOT_FOUND"
  | "SIZE_NOT_AVAILABLE"
  | "AVATAR_NOT_READY"
  | "AI_PROVIDER_TIMEOUT"
  | "AI_GENERATION_FAILED"
  | "INSUFFICIENT_GENERATIONS"
  | "SESSION_NOT_FOUND"
  | "VIDEO_ELITE_REQUIRED"
  | "VIDEO_GENERATION_FAILED";

export type SeasonHitVideoStatus = "none" | "generating" | "ready" | "failed";

export type TryOnSessionRecord = {
  id: string;
  userId: string;
  avatarSnapshotId?: string;
  sourceType: TryOnSourceType;
  status: TryOnSessionStatus;
  visibility: "private" | "unlisted" | "public";
  selectedSize?: string;
  garmentCategory?: string;
  sizeWarning?: TryOnErrorCode;
  errorCode?: TryOnErrorCode;
  errorMessage?: string;
  videoStatus?: SeasonHitVideoStatus;
  afterVideoUrl?: string;
  videoErrorCode?: TryOnErrorCode;
  videoErrorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export type TryOnSession = TryOnSessionRecord;

export type OnboardingStep = "welcome" | "auth" | "avatar" | "complete";

export type GarmentCategory =
  | "dress"
  | "top"
  | "pants"
  | "jacket"
  | "shoes"
  | "accessory"
  | "other";

export type GarmentClassification = {
  category: GarmentCategory;
  title: string;
  source?: "ai" | "fallback";
};

export type ProductSizeChartRow = {
  label: string;
  bustCm?: string;
  waistCm?: string;
  hipsCm?: string;
};

export type ProductSizeChartPreview = {
  found: boolean;
  source?: string;
  rows?: ProductSizeChartRow[];
};

export type ProductPreview = {
  id: string;
  marketplace: "wildberries" | "ozon" | "other";
  title: string;
  brand: string;
  priceRub: number;
  imageUrl: string;
  sizes: string[];
  productUrl: string;
  rating?: number;
  categories?: string[];
  sizeChart?: ProductSizeChartPreview;
  /** Optimal size from seller chart + avatar profile (when authenticated). */
  suggestedSize?: string;
};

export type TryOnSizeFit = {
  status: "ok" | "tight" | "too_small";
  selectedSize?: string;
  recommendedSize?: string;
  message?: string;
};

export type TryOnResult = {
  sessionId: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  afterVideoUrl?: string;
  videoStatus?: SeasonHitVideoStatus;
  product?: ProductPreview;
  selectedSize?: string;
  eliteFrame: boolean;
  sizeFitStatus?: TryOnSizeFit["status"];
  recommendedSize?: string;
  sizeFitMessage?: string;
};

/** Completed try-on entry for user's personal history (home feed). */
export type TryOnHistoryItem = {
  sessionId: string;
  productTitle: string;
  productUrl?: string;
  marketplace?: string;
  afterImageUrl?: string;
  selectedSize?: string;
  sourceType?: "marketplace_link" | "garment_photo" | "gallery_upload";
  createdAt?: string;
};

export type SearchResultItem = ProductPreview & {
  description?: string;
  rating?: number;
};

export type SizeAdvice = {
  status: "ok" | "warning";
  recommendedSize?: string;
  selectedSize: string;
  confidence: number;
  warnings: string[];
  reasons: string[];
  reviewSignals?: string[];
};

export type FavoriteRecord = {
  id: string;
  marketplace: string;
  externalProductId: string;
  title?: string;
  brand?: string;
  priceRub?: number;
  imageUrl?: string;
  productUrl?: string;
  sizes?: string[];
  note?: string;
  tags?: string;
  createdAt: string;
};

export type GalleryPost = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  mediaType?: "image" | "video";
  publicImageUrl?: string;
  publicVideoUrl?: string;
  authorDisplayName?: string;
  likeCount: number;
  commentCount: number;
  visibility: "public" | "unlisted" | "private";
  productLinkVisible: boolean;
  productVisibility?: "SHOW_PRODUCT_LINK" | "HIDE_PRODUCT_LINK" | "SHOW_MARKETPLACE_ONLY";
  productUrl?: string;
  productTitle?: string;
  marketplace?: string;
  eliteFrame?: boolean;
  likedByViewer?: boolean;
  publicUrl?: string;
  description?: string;
  createdAt?: string;
};

export type ShareCardPayload = {
  resultImageUrl: string;
  postSlug: string;
  showProductLink: boolean;
  productUrl?: string;
  eliteFrame: boolean;
};

export type PaywallTrigger = "trial_exhausted" | "multi_item" | "elite_perk";

export type LandingLeadPayload = {
  name?: string;
  phoneOrEmail: string;
  gender?: string;
  favoriteMarketplace?: string;
  interest?: string;
  consent: boolean;
  page?: string;
  utmSource?: string;
  utmCampaign?: string;
  referrer?: string;
};

export type LandingLeadStatus = "new" | "contacted" | "converted" | "rejected";

export type LandingLeadRecord = LandingLeadPayload & {
  id: string;
  spotNumber: number;
  hasDiscount: boolean;
  priceAnnual: number;
  priceWithDiscount: number;
  status: LandingLeadStatus;
  createdAt: string;
};

export type PublishedReview = {
  id: string;
  rating: number;
  body: string;
  displayName: string;
  publishedAt: string;
};

export type ApiError = {
  error: string;
  code?: string;
};

export function isFeatureEnabled(flags: Record<FeatureFlag, boolean>, flag: FeatureFlag): boolean {
  return Boolean(flags[flag]);
}

export * from "./promo-code";
