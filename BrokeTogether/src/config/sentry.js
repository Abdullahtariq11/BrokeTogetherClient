// DSNs are public identifiers (like a Stripe publishable key) — safe to embed
// in the client. Source-map upload during EAS builds uses SENTRY_AUTH_TOKEN
// from .env.local instead (gitignored, not embedded in the app).
export const SENTRY_DSN =
  'https://5754d5233c3566416a9faaa1bf96d3cc@o4512054024208384.ingest.us.sentry.io/4512054031745024';
