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
