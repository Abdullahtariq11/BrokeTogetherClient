import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme, colorScheme } from 'nativewind';

const ThemeContext = createContext();
const STORAGE_KEY = 'bt_theme';

export const ThemeProvider = ({ children }) => {
    const { colorScheme: scheme } = useColorScheme();

    useEffect(() => {
        SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
            if (stored === 'dark' || stored === 'light') {
                colorScheme.set(stored);
            }
        });
    }, []);

    const toggleTheme = useCallback(() => {
        const next = scheme === 'dark' ? 'light' : 'dark';
        colorScheme.set(next);
        SecureStore.setItemAsync(STORAGE_KEY, next);
    }, [scheme]);

    return (
        <ThemeContext.Provider value={{ isDark: scheme === 'dark', toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
