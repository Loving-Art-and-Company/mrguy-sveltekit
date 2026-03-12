import posthog from 'posthog-js';

export type AnalyticsPrimitive = string | number | boolean | null | undefined;
export type AnalyticsProps = Record<string, AnalyticsPrimitive>;

type InitOptions = {
  key?: string;
  host?: string;
  disable?: boolean;
  sessionRecording?: boolean;
};

let initialized = false;
const ATTRIBUTION_STORAGE_KEY = 'mrguy_analytics_attribution_v1';
const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

type AttrKey = (typeof ATTR_KEYS)[number];
type AttributionPayload = Partial<Record<AttrKey, string>>;

type AttributionState = {
  first?: AttributionPayload;
  last?: AttributionPayload;
  landingPath?: string;
  landingAt?: string;
};

const sanitizeProps = (props: AnalyticsProps): Record<string, string | number | boolean> => {
  const sanitized: Record<string, string | number | boolean> = {};
  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    }
  });
  return sanitized;
};

const hasAttributionData = (attrs: AttributionPayload): boolean => {
  return ATTR_KEYS.some((key) => Boolean(attrs[key]));
};

const parseAttributionFromUrl = (url: URL): AttributionPayload => {
  const attrs: AttributionPayload = {};
  ATTR_KEYS.forEach((key) => {
    const value = url.searchParams.get(key);
    if (value) {
      attrs[key] = value.trim().toLowerCase();
    }
  });
  return attrs;
};

const readAttributionState = (): AttributionState => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AttributionState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeAttributionState = (state: AttributionState) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage failures (privacy mode, storage disabled).
  }
};

const getCurrentUrl = (): URL | null => {
  if (typeof window === 'undefined') return null;
  try {
    return new URL(window.location.href);
  } catch {
    return null;
  }
};

const getReferrerHost = (): string | null => {
  if (typeof document === 'undefined') return null;
  const referrer = document.referrer;
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname;
  } catch {
    return null;
  }
};

const buildAttributionContext = (): AnalyticsProps => {
  const currentUrl = getCurrentUrl();
  if (!currentUrl) return {};

  const currentAttribution = parseAttributionFromUrl(currentUrl);
  const state = readAttributionState();

  if (!state.landingPath) {
    state.landingPath = `${currentUrl.pathname}${currentUrl.search}`;
  }
  if (!state.landingAt) {
    state.landingAt = new Date().toISOString();
  }
  if (hasAttributionData(currentAttribution) && !state.first) {
    state.first = currentAttribution;
  }
  if (hasAttributionData(currentAttribution)) {
    state.last = currentAttribution;
  }

  writeAttributionState(state);

  const context: AnalyticsProps = {
    page_path: `${currentUrl.pathname}${currentUrl.search}`,
  };

  ATTR_KEYS.forEach((key) => {
    if (currentAttribution[key]) context[key] = currentAttribution[key];
    if (state.first?.[key]) context[`first_${key}`] = state.first[key];
    if (state.last?.[key]) context[`last_${key}`] = state.last[key];
  });

  if (state.landingPath) context.landing_path = state.landingPath;
  if (state.landingAt) context.landing_at = state.landingAt;

  const referrerHost = getReferrerHost();
  if (referrerHost) context.referrer_host = referrerHost;

  return context;
};

const buildBaseProps = (): AnalyticsProps => {
  if (typeof window === 'undefined') return {};
  return buildAttributionContext();
};

export const initAnalytics = ({ key, host, disable, sessionRecording }: InitOptions) => {
  if (initialized || disable) return;
  if (!key) return;

  posthog.init(key, {
    api_host: host || 'https://us.i.posthog.com',
    autocapture: false,
    capture_pageview: false,
  });

  const context = sanitizeProps(buildBaseProps());
  if (Object.keys(context).length > 0) {
    posthog.register(context);
  }

  if (sessionRecording) {
    posthog.startSessionRecording?.();
  }
  initialized = true;
};

export const track = (eventName: string, props?: AnalyticsProps) => {
  if (!initialized) return;
  const payload = sanitizeProps({ ...buildBaseProps(), ...(props || {}) });
  if (Object.keys(payload).length > 0) {
    posthog.capture(eventName, payload);
    return;
  }
  posthog.capture(eventName);
};

export const trackPageview = (url?: string) => {
  if (!initialized) return;
  const payload = sanitizeProps({
    ...buildBaseProps(),
    $current_url: url || (typeof window !== 'undefined' ? window.location.href : undefined),
  });
  posthog.capture('$pageview', {
    ...payload,
  });
};

export const identify = (distinctId: string, props?: AnalyticsProps) => {
  if (!initialized) return;
  if (props && Object.keys(props).length > 0) {
    posthog.identify(distinctId, sanitizeProps(props));
    return;
  }
  posthog.identify(distinctId);
};

export const onFeatureFlags = (callback: (flags: string[], variants: Record<string, string | boolean>) => void) => {
  if (!initialized) return;
  posthog.onFeatureFlags?.(callback);
};

export const isFeatureEnabled = (flag: string) => {
  if (!initialized) return false;
  return !!posthog.isFeatureEnabled?.(flag);
};

export const stopSessionRecording = () => {
  if (!initialized) return;
  posthog.stopSessionRecording?.();
};
