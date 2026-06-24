import type {
  AuthTokens,
  AvatarRecord,
  BillingPlanOffer,
  BillingPeriod,
  CreateAvatarPayload,
  FavoriteRecord,
  FeatureFlag,
  GarmentClassification,
  GalleryPost,
  LandingLeadPayload,
  LandingLeadRecord,
  LandingLeadStatus,
  PublishedReview,
  ProductPreview,
  PromoCodeRecord,
  PromoValidationResponse,
  SearchResultItem,
  SeasonHitVideoStatus,
  SizeAdvice,
  SubscriptionPlan,
  TryOnResult,
  TryOnHistoryItem,
  TryOnSessionRecord,
  UpdateProfilePayload,
  UserEntitlements,
  UserProfile,
  BillingSubscription,
  UserNotification,
} from "@wibestyle/shared-types";
import { extractMarketplaceUrl } from "@wibestyle/shared-types";

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken?: () => string | null;
  /** Called on 401; return true if tokens were refreshed and the request may be retried once. */
  onUnauthorized?: () => Promise<boolean>;
};

export type AiProviderOperation = "VIRTUAL_TRY_ON_PHOTO" | "VIRTUAL_TRY_ON_VIDEO";

export type AiProviderPriorityRecord = {
  networkName: string;
  displayName: string;
  priorityOrder: number;
  enabled: boolean;
};

export type AdminAiProviderSnapshot = Record<AiProviderOperation, AiProviderPriorityRecord[]>;

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export class WibeStyleApiClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: () => string | null;
  private readonly onUnauthorized?: () => Promise<boolean>;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.getAccessToken = options.getAccessToken;
    this.onUnauthorized = options.onUnauthorized;
  }

  private authHeaders(contentTypeJson = true): Headers {
    const headers = new Headers();
    if (contentTypeJson) {
      headers.set("Content-Type", "application/json");
    }
    const token = this.getAccessToken?.();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  }

  private async request<T>(path: string, init: RequestInit = {}, allowRefreshRetry = true): Promise<T> {
    const headers = this.authHeaders(!(init.body instanceof FormData));
    const incoming = new Headers(init.headers);
    incoming.forEach((value, key) => headers.set(key, value));

    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    const body = (await response.json().catch(() => ({}))) as T & { error?: string; code?: string };

    if (!response.ok) {
      if (
        allowRefreshRetry
        && response.status === 401
        && this.onUnauthorized
        && !path.includes("/auth/refresh")
        && !path.includes("/auth/logout")
      ) {
        const refreshed = await this.onUnauthorized();
        if (refreshed) {
          return this.request<T>(path, init, false);
        }
      }
      throw new ApiError(body.error ?? "Request failed", response.status, body.code);
    }

    return body as T;
  }

  health() {
    return this.request<{ status: string; service: string }>("/api/v1/health");
  }

  startOtp(phone: string) {
    return this.request<{ requestId: string; expiresIn: number }>("/api/v1/auth/otp/start", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }

  verifyOtp(requestId: string, code: string, promoCode?: string) {
    return this.request<
      AuthTokens & {
        user: { id: string; phone?: string; email?: string; login?: string };
        newUser?: boolean;
        promo?: { redeemed: boolean; promo?: PromoCodeRecord };
        tokenType?: string;
      }
    >("/api/v1/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ requestId, code, promoCode: promoCode || undefined }),
    });
  }

  startEmailOtp(email: string) {
    return this.request<{ requestId: string; expiresIn: number }>("/api/v1/auth/email-otp/start", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  verifyEmailOtp(requestId: string, code: string, promoCode?: string) {
    return this.request<
      AuthTokens & {
        user: { id: string; phone?: string; email?: string; login?: string };
        newUser?: boolean;
        promo?: { redeemed: boolean; promo?: PromoCodeRecord };
        tokenType?: string;
      }
    >("/api/v1/auth/email-otp/verify", {
      method: "POST",
      body: JSON.stringify({ requestId, code, promoCode: promoCode || undefined }),
    });
  }

  getCaptcha() {
    return this.request<{ challengeId: string; question: string; expiresIn: number }>("/api/v1/auth/captcha");
  }

  getOAuthProviders() {
    return this.request<{ yandex: { enabled: boolean }; google: { enabled: boolean } }>("/api/v1/auth/oauth/providers");
  }

  startOAuth(provider: "yandex" | "google", options?: { returnUrl?: string }) {
    const params = new URLSearchParams();
    if (options?.returnUrl) {
      params.set("returnUrl", options.returnUrl);
    }
    const query = params.toString();
    return this.request<{ provider: string; authorizationUrl: string; state: string }>(
      `/api/v1/auth/oauth/${provider}/start${query ? `?${query}` : ""}`,
    );
  }

  refreshToken(refreshToken: string) {
    return this.request<AuthTokens & { user: { id: string; phone: string }; tokenType?: string }>(
      "/api/v1/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      },
    );
  }

  logout(refreshToken: string) {
    return this.request<{ loggedOut: boolean }>("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  me() {
    return this.request<{
      user: { id: string; phone?: string; email?: string; login?: string };
      profile: UserProfile;
      entitlements?: UserEntitlements;
    }>("/api/v1/me");
  }

  getProfile() {
    return this.request<{ profile: UserProfile }>("/api/v1/profile");
  }

  updateProfile(payload: UpdateProfilePayload) {
    return this.request<{ profile: UserProfile }>("/api/v1/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  listAvatars() {
    return this.request<{ items: AvatarRecord[]; limit?: number; count?: number }>("/api/v1/avatars");
  }

  createAvatar(payload: CreateAvatarPayload = {}) {
    return this.request<{ avatar: AvatarRecord }>("/api/v1/avatars", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  uploadAvatarPhoto(avatarId: string, file: File) {
    const body = new FormData();
    body.append("photo", file);
    return this.request<{ avatar: AvatarRecord }>(`/api/v1/avatars/${avatarId}/photo`, {
      method: "POST",
      body,
    });
  }

  validateAvatar(avatarId: string) {
    return this.request<{ avatar: AvatarRecord; qualityScore: number; warnings: string[] }>(
      `/api/v1/avatars/${avatarId}/validate`,
      { method: "POST" },
    );
  }

  preprocessAvatar(avatarId: string) {
    return this.request<{ avatar: AvatarRecord }>(`/api/v1/avatars/${avatarId}/preprocess`, {
      method: "POST",
    });
  }

  activateAvatar(avatarId: string) {
    return this.request<{ avatar: AvatarRecord; snapshotId: string }>(`/api/v1/avatars/${avatarId}/activate`, {
      method: "POST",
    });
  }

  deleteAvatar(avatarId: string) {
    return this.request<{ avatar: AvatarRecord }>(`/api/v1/avatars/${avatarId}`, {
      method: "DELETE",
    });
  }

  createLead(payload: LandingLeadPayload) {
    return this.request<LandingLeadRecord & { remainingSpots: number }>("/api/v1/landing/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  getLeadStats() {
    return this.request<{ remainingSpots: number; promoActive: boolean; discountPercent: number }>("/api/v1/landing/leads");
  }

  parseLink(url: string) {
    return this.request<{ product: ProductPreview }>("/api/v1/marketplaces/parse-link", {
      method: "POST",
      body: JSON.stringify({ url: extractMarketplaceUrl(url) }),
    });
  }

  createLinkTryOnSession(url: string, selectedSize?: string) {
    return this.request<{ session: TryOnSessionRecord; product: ProductPreview }>("/api/v1/try-on/sessions/link", {
      method: "POST",
      body: JSON.stringify({ url: extractMarketplaceUrl(url), selectedSize }),
    });
  }

  createPhotoTryOnSession(
    file: File,
    category: string,
    sourceType: "garment_photo" | "gallery_upload" = "gallery_upload",
    selectedSize?: string,
    productTitle?: string,
  ) {
    const body = new FormData();
    body.append("photo", file);
    body.append("category", category);
    body.append("sourceType", sourceType);
    if (selectedSize) {
      body.append("selectedSize", selectedSize);
    }
    if (productTitle) {
      body.append("productTitle", productTitle);
    }
    return this.request<{ session: TryOnSessionRecord }>("/api/v1/try-on/sessions/photo", {
      method: "POST",
      body,
    });
  }

  classifyGarmentPhoto(file: File) {
    const body = new FormData();
    body.append("photo", file);
    return this.request<{ classification: GarmentClassification }>("/api/v1/try-on/classify-garment", {
      method: "POST",
      body,
    });
  }

  generateTryOn(sessionId: string) {
    return this.request<{ session: TryOnSessionRecord; result: TryOnResult; trialGenerationsLeft?: number }>(
      `/api/v1/try-on/sessions/${sessionId}/generate`,
      { method: "POST" },
    );
  }

  getTryOnSession(sessionId: string) {
    return this.request<{ session: TryOnSessionRecord; product?: ProductPreview; result?: TryOnResult }>(
      `/api/v1/try-on/sessions/${sessionId}`,
    );
  }

  generateSeasonHitVideo(sessionId: string) {
    return this.request<{
      sessionId: string;
      videoStatus: SeasonHitVideoStatus;
      afterVideoUrl?: string;
      jobId?: string;
    }>(`/api/v1/try-on/sessions/${sessionId}/generate-video`, { method: "POST" });
  }

  listMyTryOnSessions() {
    return this.request<{ items: TryOnHistoryItem[] }>("/api/v1/try-on/sessions/mine");
  }

  getAiJob(jobId: string) {
    return this.request<{ job: Record<string, unknown> }>(`/api/v1/ai/jobs/${jobId}`);
  }

  getFeatures() {
    return this.request<{ flags: Record<FeatureFlag, boolean> }>("/api/v1/features");
  }

  searchProducts(query: string, marketplace?: string) {
    return this.request<{ query: string; expandedQuery: string; facets: Record<string, unknown>; trendNote?: string; items: SearchResultItem[] }>(
      "/api/v1/search",
      { method: "POST", body: JSON.stringify({ query, marketplace }) },
    );
  }

  listFavorites() {
    return this.request<{ items: FavoriteRecord[] }>("/api/v1/favorites");
  }

  addFavorite(payload: Omit<FavoriteRecord, "id" | "createdAt"> & { externalProductId: string }) {
    return this.request<{ favorite: FavoriteRecord }>("/api/v1/favorites", {
      method: "POST",
      body: JSON.stringify({
        marketplace: payload.marketplace,
        externalProductId: payload.externalProductId,
        title: payload.title,
        brand: payload.brand,
        priceRub: payload.priceRub,
        imageUrl: payload.imageUrl,
        productUrl: payload.productUrl,
        sizes: payload.sizes,
        note: payload.note,
        tags: payload.tags,
      }),
    });
  }

  removeFavorite(marketplace: string, externalProductId: string) {
    return this.request<{ removed: boolean }>(`/api/v1/favorites/${marketplace}/${externalProductId}`, {
      method: "DELETE",
    });
  }

  getSizeAdvice(payload: { marketplace: string; externalProductId?: string; productUrl?: string; selectedSize: string; availableSizes?: string[]; reviewSignals?: string[] }) {
    return this.request<{ advice: SizeAdvice }>("/api/v1/size-advice", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  listGalleryPosts() {
    return this.request<{ items: GalleryPost[] }>("/api/v1/gallery/posts");
  }

  getGalleryPostBySlug(slug: string) {
    return this.request<{ post: GalleryPost; comments: { id: string; body: string; createdAt: string }[] }>(
      `/api/v1/gallery/posts/slug/${slug}`,
    );
  }

  createGalleryPost(payload: {
    tryOnSessionId?: string;
    visibility: "public" | "unlisted" | "private";
    title?: string;
    description?: string;
    productLinkVisible?: boolean;
    productVisibility?: string;
    eliteFrame?: boolean;
    mediaType?: "image" | "video";
  }) {
    return this.request<{ post: GalleryPost }>("/api/v1/gallery/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  toggleGalleryLike(postId: string) {
    return this.request<{ post: GalleryPost }>(`/api/v1/gallery/posts/${postId}/like`, { method: "POST" });
  }

  addGalleryComment(postId: string, body: string) {
    return this.request<{ comment: { id: string; body: string; createdAt: string } }>(
      `/api/v1/gallery/posts/${postId}/comments`,
      { method: "POST", body: JSON.stringify({ body }) },
    );
  }

  getBillingPlans() {
    return this.request<{
      items: BillingPlanOffer[];
      annualDiscountPercent: number;
      defaultSelection: { plan: SubscriptionPlan; period: BillingPeriod };
      promoDiscountPercent: number;
      paymentProvider?: string;
      subscriber?: { plan: SubscriptionPlan; billingPeriod: BillingPeriod; subscriptionActive: boolean; autoRenewEnabled?: boolean; currentPeriodEnd?: string };
    }>("/api/v1/billing/plans");
  }

  validatePromo(code: string) {
    return this.request<PromoValidationResponse>("/api/v1/billing/promo/validate", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  subscribe(plan: SubscriptionPlan, period: BillingPeriod) {
    return this.request<{
      status: string;
      plan: SubscriptionPlan;
      period: BillingPeriod;
      priceRub: number;
      basePriceRub: number;
      subscriptionExpiresAt: string;
      planGenerationsLeft: number;
      profile: Partial<UserProfile>;
    }>("/api/v1/billing/subscribe", {
      method: "POST",
      body: JSON.stringify({ plan, period }),
    });
  }

  checkout(plan: SubscriptionPlan, period: BillingPeriod, options?: { savePaymentMethod?: boolean; client?: "web" | "mobile" }) {
    return this.request<{
      checkoutId: string;
      status: "pending";
      plan: SubscriptionPlan;
      period: BillingPeriod;
      priceRub: number;
      basePriceRub: number;
      provider: string;
      paymentUrl: string;
    }>("/api/v1/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan, period, savePaymentMethod: options?.savePaymentMethod ?? false, client: options?.client ?? "web" }),
    });
  }

  getBillingSubscription() {
    return this.request<BillingSubscription>("/api/v1/billing/subscription");
  }

  setAutoRenew(enabled: boolean) {
    return this.request<BillingSubscription>("/api/v1/billing/subscription/auto-renew", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
  }

  getNotifications() {
    return this.request<{ items: UserNotification[] }>("/api/v1/notifications");
  }

  markNotificationRead(notificationId: string) {
    return this.request<UserNotification>(`/api/v1/notifications/${encodeURIComponent(notificationId)}/read`, { method: "POST" });
  }

  registerPushDevice(token: string, platform: "android" | "ios") {
    return this.request<{ status: string }>("/api/v1/notifications/push-devices", {
      method: "POST",
      body: JSON.stringify({ token, platform }),
    });
  }

  unregisterPushDevice(token: string, platform: "android" | "ios") {
    return this.request<{ status: string }>("/api/v1/notifications/push-devices", {
      method: "DELETE",
      body: JSON.stringify({ token, platform }),
    });
  }

  getCheckout(checkoutId: string) {
    return this.request<{
      checkoutId: string;
      status: "pending" | "completed" | "canceled";
      plan: SubscriptionPlan;
      period: BillingPeriod;
      priceRub: number;
      provider: string;
      subscription?: {
        plan: SubscriptionPlan;
        period: BillingPeriod;
        subscriptionExpiresAt: string;
        planGenerationsLeft: number;
      };
    }>(`/api/v1/billing/checkout/${encodeURIComponent(checkoutId)}`);
  }

  simulateMockCheckout(checkoutId: string) {
    return this.request<{
      status: string;
      checkoutId: string;
      plan: SubscriptionPlan;
      period: BillingPeriod;
      priceRub: number;
      subscriptionExpiresAt: string;
      planGenerationsLeft: number;
    }>(`/api/v1/billing/webhooks/mock/simulate?checkoutId=${encodeURIComponent(checkoutId)}`, {
      method: "POST",
    });
  }

  createMediaUploadUrl(purpose: string, contentType?: string) {
    return this.request<{
      assetId: string;
      uploadToken: string;
      uploadUrl: string;
      expiresAt: string;
      status: string;
    }>("/api/v1/media/upload-url", {
      method: "POST",
      body: JSON.stringify({ purpose, contentType }),
    });
  }

  uploadMediaAsset(assetId: string, uploadToken: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    body.append("uploadToken", uploadToken);
    return this.request<{ asset: { id: string; status: string; url?: string } }>(
      `/api/v1/media/assets/${assetId}/upload?uploadToken=${encodeURIComponent(uploadToken)}`,
      { method: "POST", body },
    );
  }

  completeMediaUpload(assetId: string, uploadToken: string) {
    return this.request<{ asset: { id: string; status: string; url?: string } }>("/api/v1/media/complete-upload", {
      method: "POST",
      body: JSON.stringify({ assetId, uploadToken }),
    });
  }

  listPublishedReviews() {
    return this.request<{ items: PublishedReview[] }>("/api/v1/reviews/published");
  }

  createReview(payload: {
    tryOnSessionId?: string;
    rating: number;
    body: string;
    displayName?: string;
    allowPublish: boolean;
  }) {
    return this.request<{
      review: {
        id: string;
        rating: number;
        body: string;
        status: string;
        allowPublish: boolean;
        createdAt: string;
      };
    }>("/api/v1/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  registerLandingInterest(payload: {
    emailOrPhone: string;
    interest?: string;
    page?: string;
    utmSource?: string;
    utmCampaign?: string;
    referrer?: string;
    consent: boolean;
  }) {
    return this.request<{ id: string; emailOrPhone: string; interest: string; createdAt: string }>(
      "/api/v1/landing/interest",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  }

  listAdminReviews(adminKey: string) {
    return this.request<{
      items: {
        id: string;
        userId: string;
        rating: number;
        body: string;
        allowPublish: boolean;
        status: string;
        createdAt: string;
        displayName?: string;
      }[];
    }>("/api/v1/admin/reviews", {
      headers: { "X-Admin-Key": adminKey },
    });
  }

  publishAdminReview(adminKey: string, reviewId: string) {
    return this.request<{ review: { id: string; status: string } }>(`/api/v1/admin/reviews/${reviewId}/publish`, {
      method: "POST",
      headers: { "X-Admin-Key": adminKey },
    });
  }

  rejectAdminReview(adminKey: string, reviewId: string) {
    return this.request<{ review: { id: string; status: string } }>(`/api/v1/admin/reviews/${reviewId}/reject`, {
      method: "POST",
      headers: { "X-Admin-Key": adminKey },
    });
  }

  updateAdminReviewDisplayName(adminKey: string, reviewId: string, displayName: string) {
    return this.request<{ review: { id: string; displayName: string } }>(
      `/api/v1/admin/reviews/${reviewId}/display-name`,
      {
        method: "PATCH",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ displayName }),
      },
    );
  }

  listAdminLeads(adminKey: string, status?: LandingLeadStatus) {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request<{ items: LandingLeadRecord[]; remainingSpots: number }>(
      `/api/v1/admin/leads${query}`,
      { headers: { "X-Admin-Key": adminKey } },
    );
  }

  updateAdminLeadStatus(adminKey: string, leadId: string, status: LandingLeadStatus) {
    return this.request<{ lead: LandingLeadRecord }>(`/api/v1/admin/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "X-Admin-Key": adminKey },
      body: JSON.stringify({ status }),
    });
  }

  exportAdminLeadsCsv(adminKey: string, status?: LandingLeadStatus) {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return fetch(`${this.baseUrl}/api/v1/admin/leads/export.csv${query}`, {
      headers: { "X-Admin-Key": adminKey },
    }).then(async (response) => {
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
        throw new ApiError(body.error ?? "Export failed", response.status, body.code);
      }
      return response.text();
    });
  }

  getEntitlements() {
    return this.request<{ entitlements: UserEntitlements }>("/api/v1/billing/entitlements");
  }

  listAdminPromoCodes(adminKey: string) {
    return this.request<{ items: PromoCodeRecord[] }>("/api/v1/admin/promo-codes", {
      headers: { "X-Admin-Key": adminKey },
    });
  }

  createAdminPromoCode(
    adminKey: string,
    payload: { code?: string; discountPercent: number; maxUses: number; expiresAt: string; label?: string },
  ) {
    return this.request<{ promo: PromoCodeRecord }>("/api/v1/admin/promo-codes", {
      method: "POST",
      headers: { "X-Admin-Key": adminKey },
      body: JSON.stringify(payload),
    });
  }

  generateAdminPromoCode(adminKey: string) {
    return this.request<{ code: string }>("/api/v1/admin/promo-codes/generate-code", {
      method: "POST",
      headers: { "X-Admin-Key": adminKey },
    });
  }

  revokeAdminPromoCode(adminKey: string, promoId: string) {
    return this.request<{ promo: PromoCodeRecord }>(`/api/v1/admin/promo-codes/${promoId}/revoke`, {
      method: "POST",
      headers: { "X-Admin-Key": adminKey },
    });
  }

  listAdminAiPrompts(adminKey: string) {
    return this.request<{
      items: { key: string; title: string; description?: string; body: string; updatedAt: string }[];
    }>("/api/v1/admin/ai-prompts", {
      headers: { "X-Admin-Key": adminKey },
    });
  }

  getAdminAiPrompt(adminKey: string, templateKey: string) {
    return this.request<{
      template: { key: string; title: string; description?: string; body: string; updatedAt: string };
    }>(`/api/v1/admin/ai-prompts/${encodeURIComponent(templateKey)}`, {
      headers: { "X-Admin-Key": adminKey },
    });
  }

  updateAdminAiPrompt(adminKey: string, templateKey: string, payload: { body: string }) {
    return this.request<{
      template: { key: string; title: string; description?: string; body: string; updatedAt: string };
    }>(`/api/v1/admin/ai-prompts/${encodeURIComponent(templateKey)}`, {
      method: "PUT",
      headers: { "X-Admin-Key": adminKey },
      body: JSON.stringify(payload),
    });
  }

  deleteAccount(confirm = "DELETE") {
    return this.request<{ deleted: boolean; userId: string }>("/api/v1/profile/delete-account", {
      method: "POST",
      body: JSON.stringify({ confirm }),
    });
  }

  reportGalleryPost(postId: string, reason: string, details?: string) {
    return this.request<{ report: { id: string; status: string } }>(`/api/v1/gallery/posts/${postId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason, details }),
    });
  }

  listAdminGalleryReports(adminKey: string, status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request<{ items: { id: string; postId: string; reason: string; status: string }[] }>(
      `/api/v1/admin/gallery/reports${query}`,
      { headers: { "X-Admin-Key": adminKey } },
    );
  }

  hideAdminGalleryPost(adminKey: string, postId: string) {
    return this.request<{ post: { id: string; moderationStatus: string } }>(
      `/api/v1/admin/gallery/posts/${postId}/hide`,
      { method: "POST", headers: { "X-Admin-Key": adminKey } },
    );
  }

  listAdminGalleryPosts(adminKey: string) {
    return this.request<{
      items: {
        id: string;
        slug: string;
        title: string;
        publicImageUrl?: string;
        visibility: string;
        moderationStatus: string;
        userId: string;
        createdAt: string;
      }[];
    }>("/api/v1/admin/gallery/posts", { headers: { "X-Admin-Key": adminKey } });
  }

  deleteAdminGalleryPost(adminKey: string, postId: string) {
    return this.request<{ deleted: boolean; postId: string }>(
      `/api/v1/admin/gallery/posts/${postId}`,
      { method: "DELETE", headers: { "X-Admin-Key": adminKey } },
    );
  }

  listAdminAuditLogs(adminKey: string) {
    return this.request<{ items: { action: string; entityType: string; createdAt: string }[] }>(
      "/api/v1/admin/audit",
      { headers: { "X-Admin-Key": adminKey } },
    );
  }

  adminLogin(payload: { email: string; password: string; captchaId: string; captchaAnswer: string }) {
    return this.request<{
      accessToken: string;
      tokenType: string;
      expiresIn: number;
      admin: { id: string; email: string; displayName: string; role: string };
    }>("/api/v1/admin/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  listAdminUsers(adminKey: string) {
    return this.request<{
      items: {
        id: string;
        phone?: string;
        email?: string;
        login?: string;
        plan?: string;
        trialGenerationsLeft?: number;
        planGenerationsLeft?: number;
        displayName?: string;
        primaryAuth?: string;
        createdAt: string;
      }[];
    }>("/api/v1/admin/users", { headers: { "X-Admin-Key": adminKey } });
  }

  updateAdminUserSubscription(
    adminKey: string,
    userId: string,
    payload: {
      plan?: SubscriptionPlan | "none";
      trialGenerationsLeft?: number;
      planGenerationsLeft?: number;
      billingPeriod?: BillingPeriod;
    },
  ) {
    return this.request<Record<string, unknown>>(`/api/v1/admin/users/${userId}/subscription`, {
      method: "PATCH",
      headers: { "X-Admin-Key": adminKey },
      body: JSON.stringify(payload),
    });
  }

  impersonateAdminUser(adminKey: string, userId: string) {
    return this.request<
      AuthTokens & { impersonated: boolean; user: { id: string; login?: string; email?: string; phone?: string } }
    >(`/api/v1/admin/users/${userId}/impersonate`, {
      method: "POST",
      headers: { "X-Admin-Key": adminKey },
    });
  }

  deleteAdminUser(adminKey: string, userId: string) {
    return this.request<{ deleted: boolean; userId: string }>(`/api/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { "X-Admin-Key": adminKey },
    });
  }

  getAdminUserDetail(adminKey: string, userId: string) {
    return this.request<{
      user: {
        id: string;
        phone?: string;
        email?: string;
        login?: string;
        primaryAuth?: string;
        createdAt: string;
      };
      profile: UserProfile;
      avatars: {
        items: Array<{
          id: string;
          status: string;
          active: boolean;
          qualityScore?: number;
          warnings?: string[];
          createdAt: string;
          adminOriginalPhotoUrl?: string;
          adminProcessedPhotoUrl?: string;
        }>;
      };
      tryOnSessions: {
        items: Array<{
          sessionId: string;
          status: string;
          sourceType: string;
          visibility?: string;
          productTitle: string;
          productUrl?: string;
          marketplace?: string;
          selectedSize?: string;
          errorCode?: string;
          errorMessage?: string;
          createdAt: string;
          galleryPostId?: string;
          galleryVisibility?: string;
          adminAfterPhotoUrl?: string;
          adminGarmentPhotoUrl?: string;
        }>;
      };
    }>(`/api/v1/admin/users/${userId}`, { headers: { "X-Admin-Key": adminKey } });
  }

  updateAdminUserProfile(adminKey: string, userId: string, payload: UpdateProfilePayload) {
    return this.request<{ profile: UserProfile }>(`/api/v1/admin/users/${userId}/profile`, {
      method: "PUT",
      headers: { "X-Admin-Key": adminKey },
      body: JSON.stringify(payload),
    });
  }

  deleteAdminUserAvatar(adminKey: string, userId: string, avatarId: string) {
    return this.request<{ avatar: AvatarRecord }>(
      `/api/v1/admin/users/${userId}/avatars/${avatarId}`,
      {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      },
    );
  }

  deleteAdminUserTryOnSession(adminKey: string, userId: string, sessionId: string) {
    return this.request<{ deleted: boolean; sessionId: string }>(
      `/api/v1/admin/users/${userId}/try-on-sessions/${sessionId}`,
      {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      },
    );
  }

  async fetchAdminBlob(adminKey: string, path: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { "X-Admin-Key": adminKey },
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
      throw new ApiError(body.error ?? "Request failed", response.status, body.code);
    }
    return response.blob();
  }

  getAdminSettings(adminKey: string) {
    return this.request<{ blockGoogleOAuth: boolean }>("/api/v1/admin/settings", {
      headers: { "X-Admin-Key": adminKey },
    });
  }

  updateAdminSettings(adminKey: string, payload: { blockGoogleOAuth?: boolean }) {
    return this.request<{ blockGoogleOAuth: boolean }>("/api/v1/admin/settings", {
      method: "PATCH",
      headers: { "X-Admin-Key": adminKey },
      body: JSON.stringify(payload),
    });
  }

  listAdminAiLogs(adminKey: string, page = 0, size = 50) {
    return this.request<{
      items: Array<{
        id: string;
        tryOnSessionId?: string | null;
        userId?: string | null;
        phase: string;
        title: string;
        body: string;
        modelName?: string | null;
        modelLabel?: string | null;
        provider?: string | null;
        operation?: string | null;
        attemptNumber?: number | null;
        fallbackReason?: string | null;
        status?: string | null;
        noteappRequestId?: string | null;
        createdAt: string;
      }>;
      page: number;
      size: number;
      total: number;
      totalPages: number;
    }>(`/api/v1/admin/ai-logs?page=${page}&size=${size}`, { headers: { "X-Admin-Key": adminKey } });
  }

  getAdminAiProviders(adminKey: string) {
    return this.request<AdminAiProviderSnapshot>("/api/v1/admin/ai-providers", {
      headers: { "X-Admin-Key": adminKey },
    });
  }

  updateAdminAiProviders(
    adminKey: string,
    operation: AiProviderOperation,
    items: AiProviderPriorityRecord[],
  ) {
    return this.request<{ operation: AiProviderOperation; items: AiProviderPriorityRecord[] }>(
      `/api/v1/admin/ai-providers/${operation}`,
      {
        method: "PUT",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ items }),
      },
    );
  }
}
