import { Children, createContext, useEffect, useState } from "react";
import * as SecureStore from 'expo-secure-store';
import authService from "../api/authService";


export const AuthContext = createContext();

/**
 * Authentication context provider component that manages user authentication state and operations.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be wrapped by the auth provider
 * @returns {JSX.Element} Provider component with authentication context
 * 
 * @description
 * Provides authentication functionality including:
 * - User login with email and password
 * - User logout with secure storage cleanup
 * - Token and user info persistence using secure storage
 * - Loading state management during auth operations
 * 
 * @context
 * Exposes the following values through AuthContext:
 * - {Function} login - Async function to authenticate user (email, password)
 * - {Function} logout - Async function to logout user and clear stored credentials
 * - {boolean} isLoading - Loading state indicator for auth operations
 * - {string|null} userToken - Current user's authentication token
 * - {Object|null} userInfo - Current user's information object
 */
export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(null);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        const hydrateAuth = async () => {
            try {
                const token = await SecureStore.getItemAsync('userToken');

                if (token) {
                    // 1. Set the token so the Axios Interceptor can use it
                    setUserToken(token);

                    // 2. Fetch fresh data from your /me endpoint
                    const freshUser = await authService.getProfile();
                    setUserInfo(freshUser);

                    // 3. Keep the local storage updated
                    await SecureStore.setItemAsync('userInfo', JSON.stringify(freshUser));
                }
            } catch (e) {
                console.log("Token expired or network error, logging out...");
                logout(); // Clear everything if the token is invalid
            } finally {
                setIsLoading(false);
            }
        };

        hydrateAuth();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const data = await authService.login(email, password);
            // 1. The token is at data.token
            if (data.token) {
                setUserToken(data.token);
                await SecureStore.setItemAsync('userToken', data.token);
            }

            // 2. Map the user info correctly 
            // Based on your JSON, 'name' and 'username' are at the top level
            const userData = {
                name: data.name,
                username: data.username,
                type: data.type
            };

            setUserInfo(userData);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(userData));

        } catch (error) {
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }
    const logout = async () => {
        setIsLoading(true);
        try {
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userInfo');
            setUserToken(null);
            setUserInfo(null);
        } catch (e) {
            console.log('Logout error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );


};