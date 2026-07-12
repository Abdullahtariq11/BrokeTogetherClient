import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../../context/AuthContext', () => {
  const RN_React = require('react');
  return { AuthContext: RN_React.createContext({}) };
});

jest.mock('../../api/authService', () => ({
  login: jest.fn(),
  register: jest.fn(),
  getProfile: jest.fn(),
  forgotPassword: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve()),
}));

import { AuthContext } from '../../context/AuthContext';
import authService from '../../api/authService';
import LoginScreen from '../LoginScreen';

const renderLogin = async (authValue) =>
  render(
    <AuthContext.Provider value={authValue}>
      <LoginScreen />
    </AuthContext.Provider>
  );

describe('LoginScreen', () => {
  afterEach(() => jest.clearAllMocks());

  const makeAuthValue = (overrides = {}) => ({
    login: jest.fn().mockResolvedValue(),
    loginWithToken: jest.fn(),
    isLoading: false,
    continueAsGuest: jest.fn(),
    ...overrides,
  });

  it('renders the email and password inputs and sign-in button', async () => {
    const { getByPlaceholderText, getByText } = await renderLogin(makeAuthValue());

    expect(getByPlaceholderText('example@gmail.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('shows validation errors and does not call login when fields are invalid', async () => {
    const authValue = makeAuthValue();
    const { getByText, findByText } = await renderLogin(authValue);

    await fireEvent.press(getByText('Sign In'));

    expect(await findByText('Email is required')).toBeTruthy();
    expect(await findByText('Password is required')).toBeTruthy();
    expect(authValue.login).not.toHaveBeenCalled();
  });

  it('calls context login with the entered credentials on valid submit', async () => {
    const authValue = makeAuthValue();
    const { getByPlaceholderText, getByText } = await renderLogin(authValue);

    await fireEvent.changeText(getByPlaceholderText('example@gmail.com'), 'user@example.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    await fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(authValue.login).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });

  it('continues as guest when the guest button is pressed', async () => {
    const authValue = makeAuthValue();
    const { getByText } = await renderLogin(authValue);

    await fireEvent.press(getByText('Continue as Guest'));

    expect(authValue.continueAsGuest).toHaveBeenCalled();
  });
});
