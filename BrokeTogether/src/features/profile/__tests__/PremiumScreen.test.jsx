import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

jest.mock('../../../context/AuthContext', () => {
  const RN_React = require('react');
  return { AuthContext: RN_React.createContext({}) };
});

jest.mock('../../../api/billingService', () => ({
  getStatus: jest.fn(),
  createCheckoutSession: jest.fn(),
  createPortalSession: jest.fn(),
}));

import { AuthContext } from '../../../context/AuthContext';
import billingService from '../../../api/billingService';
import PremiumScreen from '../PremiumScreen';

jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve());

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

    const { findByText, queryByText } = await renderPremiumScreen({ id: 1, isPremium: false });

    expect(await findByText('Upgrade to Premium')).toBeTruthy();
    expect(queryByText('Manage Subscription')).toBeNull();
  });

  it('calls createCheckoutSession and opens the URL when the upgrade CTA is pressed', async () => {
    billingService.getStatus.mockResolvedValue({ isPremium: false, subscriptionStatus: 'NONE' });
    billingService.createCheckoutSession.mockResolvedValue({ url: 'https://checkout.example.com' });

    const { findByText } = await renderPremiumScreen({ id: 1, isPremium: false });

    const upgradeButton = await findByText('Upgrade to Premium');
    await fireEvent.press(upgradeButton);

    await waitFor(() => {
      expect(billingService.createCheckoutSession).toHaveBeenCalled();
    });
    expect(Linking.openURL).toHaveBeenCalledWith('https://checkout.example.com');
  });

  it('renders the manage-subscription CTA when the user is premium', async () => {
    billingService.getStatus.mockResolvedValue({ isPremium: true, subscriptionStatus: 'ACTIVE' });

    const { findByText, queryByText } = await renderPremiumScreen({ id: 1, isPremium: true });

    expect(await findByText('Manage Subscription')).toBeTruthy();
    expect(await findByText('Subscription: Active')).toBeTruthy();
    expect(queryByText('Upgrade to Premium')).toBeNull();
  });

  it('calls createPortalSession and opens the URL when Manage Subscription is pressed', async () => {
    billingService.getStatus.mockResolvedValue({ isPremium: true, subscriptionStatus: 'ACTIVE' });
    billingService.createPortalSession.mockResolvedValue({ url: 'https://portal.example.com' });

    const { findByText } = await renderPremiumScreen({ id: 1, isPremium: true });

    const manageButton = await findByText('Manage Subscription');
    await fireEvent.press(manageButton);

    await waitFor(() => {
      expect(billingService.createPortalSession).toHaveBeenCalled();
    });
    expect(Linking.openURL).toHaveBeenCalledWith('https://portal.example.com');
  });
});
