import posthog from 'posthog-js';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

type InitOptions = {
  key?: string;
  host?: string;
  disable?: boolean;
  sessionRecording?: boolean;
};

let initialized = false;

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

export const initAnalytics = ({ key, host, disable, sessionRecording }: InitOptions) => {
  if (initialized || disable) return;
  if (!key) return;

  posthog.init(key, {
    api_host: host || 'https://app.posthog.com',
    autocapture: false,
    capture_pageview: false,
  });

  if (sessionRecording) {
    posthog.startSessionRecording?.();
  }
  initialized = true;
};

export const track = (eventName: string, props?: AnalyticsProps) => {
  if (!initialized) return;
  if (props && Object.keys(props).length > 0) {
    posthog.capture(eventName, sanitizeProps(props));
    return;
  }
  posthog.capture(eventName);
};

export const trackPageview = (url?: string) => {
  if (!initialized) return;
  posthog.capture('$pageview', {
    $current_url: url || (typeof window !== 'undefined' ? window.location.href : undefined),
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
