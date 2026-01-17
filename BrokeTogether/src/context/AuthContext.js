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
export const authProvider = ({ Children }) => {
    const [loading, setLoading] = useState(null);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    // Check if user is already logged in when app boots
    useEffect(() => {
        const loadStoredData = async () => {
            try {
                const token = await SecureStore.getItemAsync('userToken');
                const user = await SecureStore.getItemAsync('userInfo');

                if (token) {
                    setUserToken(token);
                    setUserInfo(JSON.parse(user));
                }
            } catch (e) {
                console.log('Error loading auth data:', e);
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredData();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const data = await authService.login(email, password);
            // Save to State
            setUserToken(data.token);
            setUserInfo(data.user);

            // Save to Secure Phone Storage
            await SecureStore.setItemAsync('userToken', data.token);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(data.user));

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