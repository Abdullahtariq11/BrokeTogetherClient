import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../../../context/AuthContext', () => {
  const RN_React = require('react');
  return { AuthContext: RN_React.createContext({}) };
});

jest.mock('../../../api/expenseService', () => ({
  getAnalytics: jest.fn(),
}));

import { AuthContext } from '../../../context/AuthContext';
import expenseService from '../../../api/expenseService';
import AnalyticsTab from '../AnalyticsTab';

const renderAnalyticsTab = async (isPremium, navigation = { navigate: jest.fn() }) =>
  render(
    <AuthContext.Provider value={{ userInfo: { id: 1, isPremium } }}>
      <AnalyticsTab homeId={1} navigation={navigation} />
    </AuthContext.Provider>
  );

describe('AnalyticsTab', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders an upgrade CTA for non-premium users and does not fetch data', async () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = await renderAnalyticsTab(false, navigation);

    expect(getByText('Analytics')).toBeTruthy();
    expect(getByText('Upgrade to Premium')).toBeTruthy();
    expect(expenseService.getAnalytics).not.toHaveBeenCalled();

    await fireEvent.press(getByText('Upgrade to Premium'));
    expect(navigation.navigate).toHaveBeenCalledWith('Settings', { screen: 'Premium' });
  });

  it('renders the data view for premium users', async () => {
    expenseService.getAnalytics.mockResolvedValue({
      spendingByCategory: { Groceries: 100, Rent: 500 },
      spendingByMember: { Alice: 400, Bob: 200 },
      monthlyTotals: { '2026-06': 300, '2026-07': 300 },
      totalSettlements: 0,
      largestExpenseAmount: 500,
      largestExpenseDescription: 'Rent Payment',
    });

    const { findByText, getByText } = await renderAnalyticsTab(true);

    expect(await findByText('Rent Payment')).toBeTruthy();
    expect(getByText('$600.00')).toBeTruthy(); // You Paid stat card
    expect(getByText('Groceries')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(expenseService.getAnalytics).toHaveBeenCalledWith(1);
  });

  it('shows the empty state and retries when there is no analytics data yet', async () => {
    expenseService.getAnalytics.mockResolvedValue(null);

    const { findByText, getByText } = await renderAnalyticsTab(true);

    expect(await findByText('No analytics data yet.')).toBeTruthy();

    expenseService.getAnalytics.mockResolvedValue({
      spendingByCategory: { Groceries: 50 },
      spendingByMember: {},
      monthlyTotals: {},
      totalSettlements: 0,
      largestExpenseAmount: 0,
    });
    await fireEvent.press(getByText('Retry'));

    expect(await findByText('Your Spending by Category')).toBeTruthy();
  });
});
