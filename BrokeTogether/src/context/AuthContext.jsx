import { createContext, useEffect, useState, useRef, useCallback } from "react";
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';
import authService from "../api/authService";

export const AuthContext = createContext();

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Authentication context provider component that manages user authentication state and operations.
 */
export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isGuest, setIsGuest] = useState(false);

    // Inactivity tracking refs
    const inactivityTimer = useRef(null);
    const lastActiveTime = useRef(Date.now());
    const appState = useRef(AppState.currentState);

    // Clear all auth data
    const clearAuthData = async () => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userInfo');
        await SecureStore.deleteItemAsync('lastActiveTime');
        setUserToken(null);
        setUserInfo(null);
    };

    // Delete account function
    const deleteAccount = useCallback(async () => {
        setIsLoading(true);
        try {
            if (inactivityTimer.current) {
                clearTimeout(inactivityTimer.current);
                inactivityTimer.current = null;
            }
            await authService.deleteAccount();
            await clearAuthData();
            setIsGuest(false);
        } catch (e) {
            setIsLoading(false);
            throw e;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Logout function
    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            if (inactivityTimer.current) {
                clearTimeout(inactivityTimer.current);
                inactivityTimer.current = null;
            }
            await clearAuthData();
            setIsGuest(false);
        } catch (e) {
            // logout error — silently handled
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Continue as guest - lets users browse the app without an account
    const continueAsGuest = useCallback(() => {
        setIsGuest(true);
    }, []);

    // Exit guest mode - returns to login screen
    const exitGuestMode = useCallback(() => {
        setIsGuest(false);
    }, []);

    // Reset the inactivity timer
    const resetInactivityTimer = useCallback(() => {
        lastActiveTime.current = Date.now();

        // Clear existing timer
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }

        // Only set timer if user is logged in
        if (userToken) {
            inactivityTimer.current = setTimeout(() => {
                logout();
            }, INACTIVITY_TIMEOUT);

            // Save last active time
            SecureStore.setItemAsync('lastActiveTime', Date.now().toString());
        }
    }, [userToken, logout]);

    // Track app state changes (background/foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App came to foreground
                if (userToken) {
                    const timeSinceLastActive = Date.now() - lastActiveTime.current;

                    if (timeSinceLastActive >= INACTIVITY_TIMEOUT) {
                        logout();
                    } else {
                        resetInactivityTimer();
                    }
                }
            } else if (nextAppState.match(/inactive|background/)) {
                // App went to background - save time and clear timer
                if (userToken) {
                    SecureStore.setItemAsync('lastActiveTime', Date.now().toString());
                }
                if (inactivityTimer.current) {
                    clearTimeout(inactivityTimer.current);
                }
            }

            appState.current = nextAppState;
        });

        return () => subscription.remove();
    }, [userToken, logout, resetInactivityTimer]);

    // Start/stop timer when login state changes
    useEffect(() => {
        if (userToken) {
            resetInactivityTimer();
        } else {
            if (inactivityTimer.current) {
                clearTimeout(inactivityTimer.current);
                inactivityTimer.current = null;
            }
        }

        return () => {
            if (inactivityTimer.current) {
                clearTimeout(inactivityTimer.current);
            }
        };
    }, [userToken, resetInactivityTimer]);

    // Hydrate auth on app start
    useEffect(() => {
        const hydrateAuth = async () => {
            setIsLoading(true);
            try {
                const token = await SecureStore.getItemAsync('userToken');
                const storedUserInfo = await SecureStore.getItemAsync('userInfo');
                const storedLastActive = await SecureStore.getItemAsync('lastActiveTime');

                if (token) {
                    // Check if session expired while app was closed
                    if (storedLastActive) {
                        const timeSinceLastActive = Date.now() - parseInt(storedLastActive, 10);
                        if (timeSinceLastActive >= INACTIVITY_TIMEOUT) {
                            await clearAuthData();
                            setIsLoading(false);
                            return;
                        }
                    }

                    setUserToken(token);
                    lastActiveTime.current = Date.now();

                    // Set local data first for instant UI update
                    if (storedUserInfo) {
                        setUserInfo(JSON.parse(storedUserInfo));
                    }

                    // Refresh profile from API
                    try {
                        const freshUser = await authService.getProfile();
                        setUserInfo(freshUser);
                        await SecureStore.setItemAsync('userInfo', JSON.stringify(freshUser));
                    } catch (apiErr) {
                        // Profile refresh failed — using cached data
                    }
                }
            } catch (e) {
                // Hydration error — silently handled
            } finally {
                setIsLoading(false);
            }
        };

        hydrateAuth();
    }, []);

    // Login function
    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const data = await authService.login(email, password);

            if (data.token) {
                setUserToken(data.token);
                await SecureStore.setItemAsync('userToken', data.token);
                await SecureStore.setItemAsync('lastActiveTime', Date.now().toString());
            }

            // Fetch full profile to get ID
            const profile = await authService.getProfile();
            setUserInfo(profile);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(profile));

            lastActiveTime.current = Date.now();

        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            login,
            logout,
            deleteAccount,
            isLoading,
            userToken,
            userInfo,
            isGuest,
            continueAsGuest,
            exitGuestMode,
            resetInactivityTimer
        }}>
            {children}
        </AuthContext.Provider>
    );
};