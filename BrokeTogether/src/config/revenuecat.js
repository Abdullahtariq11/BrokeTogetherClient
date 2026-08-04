import { Platform } from 'react-native';

// RevenueCat SDK public API keys are meant to be embedded in the client
// (same trust model as a Stripe publishable key) — this is safe to ship.
// Each platform has its own app entry (and key) in the RevenueCat dashboard.
//
// TODO: no App Store app is configured in RevenueCat yet, so iOS still falls
// back to the sandbox/test key — swap it for the real `appl_...` key once
// that app entry exists.
export const REVENUECAT_API_KEY = Platform.select({
  android: 'goog_qwJzxvpTrpjvBNqrAnOyCdBKbvM',
  ios: 'test_pTCbMjHCYDxDKdqHDnmMuulMibk',
});

// Must match the Entitlement identifier configured in the RevenueCat
// dashboard, with the monthly/yearly products attached to it.
export const PREMIUM_ENTITLEMENT_ID = 'Broketogether Pro';
