import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../../context/AuthContext', () => {
  const RN_React = require('react');
  return { AuthContext: RN_React.createContext({}) };
});

jest.mock('../../api/homeService', () => ({
  getMyHomes: jest.fn(),
  createHome: jest.fn(),
  joinHome: jest.fn(),
  getMembers: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../api/expenseService', () => ({
  getHomeBalances: jest.fn(),
  getHomeExpenses: jest.fn(),
  getAnalytics: jest.fn(),
  deleteExpense: jest.fn(),
  createSelectiveExpense: jest.fn(),
}));

jest.mock('../../api/shoppingService', () => ({
  getItems: jest.fn(),
  addItem: jest.fn(),
  editItem: jest.fn(),
  markItem: jest.fn(),
  deleteItem: jest.fn(),
  convertToExpense: jest.fn(),
}));

jest.mock('../../api/recurringExpenseService', () => ({
  getByHome: jest.fn(),
  create: jest.fn(),
  deactivate: jest.fn(),
}));

import { AuthContext } from '../../context/AuthContext';
import homeService from '../../api/homeService';
import expenseService from '../../api/expenseService';
import shoppingService from '../../api/shoppingService';
import recurringExpenseService from '../../api/recurringExpenseService';
import DashboardScreen from '../Dashboard';

const baseNavigation = () => ({ navigate: jest.fn(), goBack: jest.fn() });

const renderDashboard = async (authValue, navigation = baseNavigation()) =>
  render(
    <AuthContext.Provider value={authValue}>
      <DashboardScreen navigation={navigation} />
    </AuthContext.Provider>
  );

describe('DashboardScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows a loading spinner while dashboard data is being fetched', async () => {
    homeService.getMyHomes.mockReturnValue(new Promise(() => {})); // never resolves

    const { getByText } = await renderDashboard({
      userInfo: { id: 1, name: 'Alice', isPremium: false },
      logout: jest.fn(),
      isGuest: false,
      exitGuestMode: jest.fn(),
    });

    expect(getByText('Syncing Household...')).toBeTruthy();
  });

  it('shows the guest CTA screen when browsing as a guest', async () => {
    const { getByText } = await renderDashboard({
      userInfo: null,
      logout: jest.fn(),
      isGuest: true,
      exitGuestMode: jest.fn(),
    });

    expect(getByText(/browsing as a guest/i)).toBeTruthy();
    expect(getByText('Sign In or Create Account')).toBeTruthy();
  });

  describe('with a loaded home', () => {
    beforeEach(() => {
      homeService.getMyHomes.mockResolvedValue([
        { id: 1, name: 'Test Home', inviteCode: 'ABC123' },
      ]);
      expenseService.getHomeBalances.mockResolvedValue({ 1: 25.5 });
      expenseService.getHomeExpenses.mockResolvedValue({ expenses: [] });
      expenseService.getAnalytics.mockResolvedValue(null);
      shoppingService.getItems.mockResolvedValue([]);
      recurringExpenseService.getByHome.mockResolvedValue([]);
    });

    const premiumAuthValue = {
      userInfo: { id: 1, name: 'Alice', isPremium: true },
      logout: jest.fn(),
      isGuest: false,
      exitGuestMode: jest.fn(),
    };

    it('renders home name, balance, and tab bar once data loads', async () => {
      const { findByText, getByText } = await renderDashboard(premiumAuthValue);

      expect(await findByText('Test Home')).toBeTruthy();
      expect(getByText('+$25.50')).toBeTruthy();
      expect(getByText('Activity')).toBeTruthy();
      expect(getByText('Shopping')).toBeTruthy();
      expect(getByText('Recurring')).toBeTruthy();
      expect(getByText('Analytics')).toBeTruthy();
    });

    it('shows an upgrade crown instead of the Analytics label for non-premium users', async () => {
      const { findByText, getByText } = await renderDashboard({
        ...premiumAuthValue,
        userInfo: { id: 1, name: 'Alice', isPremium: false },
      });

      expect(await findByText('Test Home')).toBeTruthy();
      expect(getByText('👑')).toBeTruthy();
    });

    it('switches between all tab bar entries without crashing (NativeWind conditional-className regression guard)', async () => {
      const { findByText, getByText } = await renderDashboard(premiumAuthValue);

      // Wait for initial load (Activity tab, default)
      expect(await findByText('Test Home')).toBeTruthy();
      expect(await findByText(/No activity yet/i)).toBeTruthy();

      await fireEvent.press(getByText('Shopping'));
      expect(await findByText(/shopping list is empty/i)).toBeTruthy();

      await fireEvent.press(getByText('Recurring'));
      expect(await findByText(/No recurring expenses yet/i)).toBeTruthy();

      await fireEvent.press(getByText('Analytics'));
      expect(await findByText(/No analytics data yet/i)).toBeTruthy();

      await fireEvent.press(getByText('Activity'));
      expect(await findByText(/No activity yet/i)).toBeTruthy();
    });
  });
});
