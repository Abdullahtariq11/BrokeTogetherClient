jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
  getStringAsync: jest.fn(() => Promise.resolve('')),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  const makeIconSet = () => (props) => require('react').createElement(View, props);
  return new Proxy({}, { get: () => makeIconSet() });
});

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    logIn: jest.fn(() => Promise.resolve({ customerInfo: {} })),
    logOut: jest.fn(() => Promise.resolve({})),
    getCustomerInfo: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
    restorePurchases: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
    setLogLevel: jest.fn(),
    LOG_LEVEL: { DEBUG: 'DEBUG' },
  },
}));

jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: {
    presentPaywall: jest.fn(() => Promise.resolve('CANCELLED')),
    presentCustomerCenter: jest.fn(() => Promise.resolve()),
  },
  PAYWALL_RESULT: {
    NOT_PRESENTED: 'NOT_PRESENTED',
    ERROR: 'ERROR',
    CANCELLED: 'CANCELLED',
    PURCHASED: 'PURCHASED',
    RESTORED: 'RESTORED',
  },
}));
