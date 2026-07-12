import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../../../context/AuthContext', () => {
  const RN_React = require('react');
  return { AuthContext: RN_React.createContext({}) };
});

jest.mock('../../../api/recurringExpenseService', () => ({
  getByHome: jest.fn(),
  create: jest.fn(),
  deactivate: jest.fn(),
}));

import { AuthContext } from '../../../context/AuthContext';
import recurringExpenseService from '../../../api/recurringExpenseService';
import RecurringTab from '../RecurringTab';

const renderRecurringTab = async (isPremium, navigation = { navigate: jest.fn() }) =>
  render(
    <AuthContext.Provider value={{ userInfo: { id: 1, isPremium } }}>
      <RecurringTab homeId={1} navigation={navigation} />
    </AuthContext.Provider>
  );

describe('RecurringTab', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders an upgrade CTA for non-premium users and does not fetch data', async () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = await renderRecurringTab(false, navigation);

    expect(getByText('Recurring Expenses')).toBeTruthy();
    expect(getByText('Upgrade to Premium')).toBeTruthy();
    expect(recurringExpenseService.getByHome).not.toHaveBeenCalled();

    await fireEvent.press(getByText('Upgrade to Premium'));
    expect(navigation.navigate).toHaveBeenCalledWith('Settings', { screen: 'Premium' });
  });

  it('renders the list for premium users', async () => {
    recurringExpenseService.getByHome.mockResolvedValue([
      { id: 1, description: 'Rent', amount: 1200, frequency: 'MONTHLY', splitType: 'SPLIT', nextDueDate: '2026-08-01' },
    ]);

    const { findByText, getByText } = await renderRecurringTab(true);

    expect(await findByText('Rent')).toBeTruthy();
    expect(getByText('$1200.00')).toBeTruthy();
    expect(recurringExpenseService.getByHome).toHaveBeenCalledWith(1);
  });

  it('shows the empty state for premium users with no recurring expenses', async () => {
    recurringExpenseService.getByHome.mockResolvedValue([]);

    const { findByText } = await renderRecurringTab(true);

    expect(await findByText('No recurring expenses yet.')).toBeTruthy();
  });
});
