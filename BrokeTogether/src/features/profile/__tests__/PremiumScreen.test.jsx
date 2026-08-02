import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

jest.mock('../../../context/AuthContext', () => {
  const RN_React = require('react');
  return { AuthContext: RN_React.createContext({}) };
});

jest.mock('../../../api/billingService', () => ({
  getStatus: jest.fn(),
}));

import { AuthContext } from '../../../context/AuthContext';
import billingService from '../../../api/billingService';
import PremiumScreen from '../PremiumScreen';

const renderPremiumScreen = async (userInfo, navigation = { navigate: jest.fn(), goBack: jest.fn() }) =>
  render(
    <AuthContext.Provider value={{ userInfo }}>
      <PremiumScreen navigation={navigation} />
    </AuthContext.Provider>
  );

describe('PremiumScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the upgrade CTA when the user is not premium', async () => {
    billingService.getStatus.mockResolvedValue({ isPremium: false, subscriptionStatus: 'NONE' });
    Purchases.getCustomerInfo.mockResolvedValue({ entitlements: { active: {} } });

    const { findByText, queryByText } = await renderPremiumScreen({ id: 1, isPremium: false });

    expect(await findByText('Upgrade to Premium')).toBeTruthy();
    expect(queryByText('Manage Subscription')).toBeNull();
  });

  it('presents the RevenueCat paywall and refreshes entitlements when the upgrade CTA is pressed', async () => {
    billingService.getStatus.mockResolvedValue({ isPremium: false, subscriptionStatus: 'NONE' });
    Purchases.getCustomerInfo
      .mockResolvedValueOnce({ entitlements: { active: {} } })
      .mockResolvedValueOnce({ entitlements: { active: { 'Broketogether Pro': {} } } });
    RevenueCatUI.presentPaywall.mockResolvedValue(PAYWALL_RESULT.PURCHASED);

    const { findByText } = await renderPremiumScreen({ id: 1, isPremium: false });

    const upgradeButton = await findByText('Upgrade to Premium');
    await fireEvent.press(upgradeButton);

    await waitFor(() => {
      expect(RevenueCatUI.presentPaywall).toHaveBeenCalled();
    });
    expect(await findByText('Manage Subscription')).toBeTruthy();
  });

  it('renders the manage-subscription CTA when the user is premium', async () => {
    billingService.getStatus.mockResolvedValue({ isPremium: true, subscriptionStatus: 'ACTIVE' });
    Purchases.getCustomerInfo.mockResolvedValue({ entitlements: { active: {} } });

    const { findByText, queryByText } = await renderPremiumScreen({ id: 1, isPremium: true });

    expect(await findByText('Manage Subscription')).toBeTruthy();
    expect(await findByText('Subscription: Active')).toBeTruthy();
    expect(queryByText('Upgrade to Premium')).toBeNull();
  });

  it('presents the RevenueCat customer center when Manage Subscription is pressed', async () => {
    billingService.getStatus.mockResolvedValue({ isPremium: true, subscriptionStatus: 'ACTIVE' });
    Purchases.getCustomerInfo.mockResolvedValue({ entitlements: { active: {} } });
    RevenueCatUI.presentCustomerCenter.mockResolvedValue();

    const { findByText } = await renderPremiumScreen({ id: 1, isPremium: true });

    const manageButton = await findByText('Manage Subscription');
    await fireEvent.press(manageButton);

    await waitFor(() => {
      expect(RevenueCatUI.presentCustomerCenter).toHaveBeenCalled();
    });
  });

  it('restores purchases when Restore Purchases is pressed', async () => {
    billingService.getStatus.mockResolvedValue({ isPremium: false, subscriptionStatus: 'NONE' });
    Purchases.getCustomerInfo.mockResolvedValue({ entitlements: { active: {} } });
    Purchases.restorePurchases.mockResolvedValue({ entitlements: { active: { 'Broketogether Pro': {} } } });

    const { findByText } = await renderPremiumScreen({ id: 1, isPremium: false });

    const restoreButton = await findByText('Restore Purchases');
    await fireEvent.press(restoreButton);

    await waitFor(() => {
      expect(Purchases.restorePurchases).toHaveBeenCalled();
    });
    expect(await findByText('Manage Subscription')).toBeTruthy();
  });
});
