// RevenueCat SDK public API keys are meant to be embedded in the client
// (same trust model as a Stripe publishable key) — this is safe to ship.
//
// This is currently the sandbox/test key. Before a store release, swap in
// the production iOS/Android keys from the RevenueCat dashboard
// (Project settings -> API keys) — RevenueCat issues a separate key per
// platform in production.
export const REVENUECAT_API_KEY = 'test_pTCbMjHCYDxDKdqHDnmMuulMibk';

// Must match the Entitlement identifier configured in the RevenueCat
// dashboard, with the monthly/yearly products attached to it.
export const PREMIUM_ENTITLEMENT_ID = 'Broketogether Pro';
