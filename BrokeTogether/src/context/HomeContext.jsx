import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from './AuthContext';

const STORAGE_KEY = 'bt_active_home_id';

// Default value used whenever a component reads this context without a
// HomeProvider above it (e.g. in tests that render a screen in isolation).
// `hydrated: true` + `activeHomeId: null` makes every consumer fall back to
// "pick the first home" immediately, matching the old pre-context behavior.
const HomeContext = createContext({
    activeHomeId: null,
    setActiveHome: () => {},
    hydrated: true,
});

// Tracks which household is "active" for the whole app — the Home tab's
// switcher, the People tab, and Household Settings all read/write this
// instead of each independently defaulting to whatever household the
// backend happens to return first. That mismatch was the root cause of
// switching households on Home not being reflected on the other tabs.
export const HomeProvider = ({ children }) => {
    const { userInfo, userToken, isGuest } = useContext(AuthContext);
    const [activeHomeId, setActiveHomeIdState] = useState(null);
    const [hydrated, setHydrated] = useState(false);
    const lastUserIdRef = useRef(null);

    // Load whatever household id was last active, once, on mount.
    useEffect(() => {
        SecureStore.getItemAsync(STORAGE_KEY)
            .then((stored) => {
                if (stored != null) {
                    const parsed = Number(stored);
                    if (!Number.isNaN(parsed)) setActiveHomeIdState(parsed);
                }
            })
            .catch(() => {})
            .finally(() => setHydrated(true));
    }, []);

    // Forget the remembered household whenever the signed-in user changes
    // (logout, or a different account logging in) so a fresh login never
    // inherits someone else's active household.
    useEffect(() => {
        const currentUserId = userInfo?.id ?? null;

        if (!userToken && !isGuest) {
            if (lastUserIdRef.current !== null) {
                setActiveHomeIdState(null);
                SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
            }
            lastUserIdRef.current = null;
            return;
        }

        if (currentUserId !== null && lastUserIdRef.current !== null && lastUserIdRef.current !== currentUserId) {
            setActiveHomeIdState(null);
            SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
        }
        lastUserIdRef.current = currentUserId;
    }, [userInfo?.id, userToken, isGuest]);

    const setActiveHome = useCallback((homeId) => {
        setActiveHomeIdState(homeId);
        if (homeId == null) {
            SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
        } else {
            SecureStore.setItemAsync(STORAGE_KEY, String(homeId)).catch(() => {});
        }
    }, []);

    return (
        <HomeContext.Provider value={{ activeHomeId, setActiveHome, hydrated }}>
            {children}
        </HomeContext.Provider>
    );
};

export const useHome = () => useContext(HomeContext);
