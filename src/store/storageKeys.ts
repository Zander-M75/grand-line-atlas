/**
 * The localStorage keys behind persist.ts. They live on their own, with no imports, so Node
 * scripts can use them too (scripts/capture.ts sets up a returning viewer before the app loads).
 */
export const STORAGE_KEYS = {
  spoilerLimit: 'gla:spoiler-limit',
  settings: 'gla:settings',
  introSeen: 'gla:intro-seen',
} as const;
