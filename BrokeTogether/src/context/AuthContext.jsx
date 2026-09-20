import { createContext, useEffect, useState, useCallback } from "react";
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import authService from "../api/authService";
import { setUnauthorizedHandler } from "../api/client";
import { PREMIUM_ENTITLEMENT_ID } from "../config/revenuecat";

// Links the RevenueCat app-user id to our backend user id so purchase
// webhooks can be attributed to the right account. Never fatal — a failure
// here shouldn't block login.
const identifyPurchaser = async (userId) => {
    try {
        await Purchases.logIn(String(userId));
    } catch (_) {}
};

export const AuthContext = createContext();

/**
 * Authentication context provider component that manages user authentication state and operations.
 *
 * Sessions stay signed in until the backend's JWT expires (30 days for the mobile
 * app — see AuthController#login) or the user explicitly logs out; there is no
 * separate client-side inactivity timeout.
 */
export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isGuest, setIsGuest] = useState(false);

    // Clear all auth data
    const clearAuthData = useCallback(async () => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userInfo');
        setUserToken(null);
        setUserInfo(null);
        try {
            await Purchases.logOut();
        } catch (_) {}
    }, []);

    // If the API layer ever sees a 401 (shouldn't happen within the token's
    // 30-day life, but can from a revoked/rotated secret, a deleted account,
    // etc.), it clears SecureStore directly (see client.js) since it has no
    // access to this context. Registering here keeps React state in sync —
    // otherwise userToken/userInfo would stay stale in memory even though the
    // token is already gone from storage.
    useEffect(() => {
        setUnauthorizedHandler(() => {
            setIsGuest(false);
            clearAuthData();
        });
        return () => setUnauthorizedHandler(null);
    }, [clearAuthData]);

    // Keep userInfo.isPremium in sync with RevenueCat's own SDK state, the
    // instant it changes — a purchase, restore, renewal, or expiration
    // anywhere in the app. Without this, isPremium only ever came from the
    // backend profile fetched at login, so upgrading required a full
    // logout/login before premium-gated screens (home limits, Recurring/
    // Analytics tabs, etc.) would recognize it.
    useEffect(() => {
        const onCustomerInfoUpdate = (info) => {
            const hasEntitlement = !!info?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
            setUserInfo((prev) => {
                if (!prev || prev.isPremium === hasEntitlement) return prev;
                const updated = { ...prev, isPremium: hasEntitlement };
                SecureStore.setItemAsync('userInfo', JSON.stringify(updated)).catch(() => {});
                return updated;
            });
        };
        Purchases.addCustomerInfoUpdateListener(onCustomerInfoUpdate);
        return () => Purchases.removeCustomerInfoUpdateListener(onCustomerInfoUpdate);
    }, []);

    // Delete account function
    const deleteAccount = useCallback(async () => {
        setIsLoading(true);
        try {
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

    // Hydrate auth on app start
    useEffect(() => {
        const hydrateAuth = async () => {
            setIsLoading(true);
            try {
                const token = await SecureStore.getItemAsync('userToken');
                const storedUserInfo = await SecureStore.getItemAsync('userInfo');

                if (token) {
                    setUserToken(token);

                    // Set local data first for instant UI update. Guarded on its own —
                    // a corrupted/malformed cached value must not abort the function
                    // before the fallback profile fetch below runs, or userInfo would
                    // stay null indefinitely while userToken stays set.
                    if (storedUserInfo) {
                        try {
                            const cachedUser = JSON.parse(storedUserInfo);
                            setUserInfo(cachedUser);
                            identifyPurchaser(cachedUser.id);
                        } catch (parseErr) {
                            // Corrupted cache — ignore and rely on the API refresh below
                        }
                    }

                    // Refresh profile from API
                    try {
                        const freshUser = await authService.getProfile();
                        setUserInfo(freshUser);
                        await SecureStore.setItemAsync('userInfo', JSON.stringify(freshUser));
                        identifyPurchaser(freshUser.id);
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
            }

            // Fetch full profile to get ID
            const profile = await authService.getProfile();
            setUserInfo(profile);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(profile));
            await identifyPurchaser(profile.id);

        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Logs the user in using a JWT already obtained externally (e.g., Google OAuth).
     * Stores the token and fetches the profile, exactly like login() does.
     */
    const loginWithToken = async (token) => {
        setIsLoading(true);
        try {
            await SecureStore.setItemAsync('userToken', token);
            setUserToken(token);

            const profile = await authService.getProfile();
            setUserInfo(profile);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(profile));
            await identifyPurchaser(profile.id);
        } catch (error) {
            await clearAuthData();
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserInfo = async (updated) => {
        const merged = { ...userInfo, ...updated };
        setUserInfo(merged);
        await SecureStore.setItemAsync('userInfo', JSON.stringify(merged));
    };

    return (
        <AuthContext.Provider value={{
            login,
            loginWithToken,
            logout,
            deleteAccount,
            updateUserInfo,
            isLoading,
            userToken,
            userInfo,
            isGuest,
            continueAsGuest,
            exitGuestMode,
        }}>
            {children}
        </AuthContext.Provider>
    );
};