import React, { useContext, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { AuthContext } from '../context/AuthContext';
import authService from '../api/authService';
import { Ionicons } from '@expo/vector-icons';
import SignupScreen from './SignupScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';

const MAX_ATTEMPTS = 5;

// Backend Google OAuth URL — same flow as the web app, no expo-auth-session needed
const BACKEND_GOOGLE_URL = 'https://broketogetherbackend-production.up.railway.app/oauth2/authorization/google';

function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loginWithToken, isLoading, continueAsGuest } = useContext(AuthContext);
    const [errors, setErrors] = useState({});
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockMessage, setLockMessage] = useState('');

    const validate = () => {
        const tempErrors = {};
        const emailRegex = /\S+@\S+\.\S+/;
        if (!email) tempErrors.email = 'Email is required';
        else if (!emailRegex.test(email)) tempErrors.email = 'Please enter a valid email address';
        if (!password) tempErrors.password = 'Password is required';
        else if (password.length < 8) tempErrors.password = 'Password must be at least 8 characters';
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        try {
            await login(email, password);
            setFailedAttempts(0);
        } catch (err) {
            if (err?.isLocked) {
                setIsLocked(true);
                setLockMessage(err.message || 'Account temporarily locked.');
            } else {
                const newCount = failedAttempts + 1;
                setFailedAttempts(newCount);
                const remaining = MAX_ATTEMPTS - newCount;
                const baseMsg = typeof err === 'string' ? err : 'Please check your credentials and try again.';
                const warning = newCount >= 2 && remaining > 0
                    ? `\n\n⚠️ ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before your account is locked for 15 minutes.`
                    : '';
                setTimeout(() => Alert.alert('Login Failed', baseMsg + warning), 100);
            }
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        try {
            // Open backend Google OAuth in a browser — same as web app
            await WebBrowser.openBrowserAsync(BACKEND_GOOGLE_URL);
        } catch {
            Alert.alert('Error', 'Could not open Google Sign-In. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    if (isSigningUp) return <SignupScreen onBack={() => setIsSigningUp(false)} />;
    if (isForgotPassword) return <ForgotPasswordScreen onBack={() => setIsForgotPassword(false)} />;

    // ── Account Locked Screen ────────────────────────────────────────
    if (isLocked) {
        return (
            <View className="flex-1 bg-slate-100 dark:bg-slate-900 p-6 justify-center items-center">
                <View className="w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full items-center justify-center mb-6">
                    <Ionicons name="lock-closed" size={36} color="#ef4444" />
                </View>
                <Text className="text-slate-800 dark:text-slate-100 text-2xl font-black text-center mb-2">Account Locked</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mb-2">
                    Too many failed login attempts.
                </Text>
                {lockMessage ? (
                    <Text className="text-red-500 text-sm font-bold text-center mb-6">{lockMessage}</Text>
                ) : null}

                <View className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6 w-full">
                    <Text className="text-amber-800 dark:text-amber-300 font-bold mb-2">What can you do?</Text>
                    <Text className="text-amber-700 dark:text-amber-400 text-sm mb-1">• Wait 15 minutes — lock lifts automatically</Text>
                    <Text className="text-amber-700 dark:text-amber-400 text-sm mb-1">• Reset your password to unlock immediately</Text>
                    <Text className="text-amber-700 dark:text-amber-400 text-sm">• Contact support if you need help</Text>
                </View>

                <TouchableOpacity
                    className="bg-primary w-full p-4 rounded-2xl items-center mb-3"
                    onPress={() => Alert.alert(
                        'Reset Password',
                        'We will send a reset link to your email.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Send Link', onPress: async () => {
                                    try {
                                        await authService.forgotPassword(email);
                                        Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
                                    } catch {
                                        Alert.alert('Error', 'Could not send reset email. Please try again.');
                                    }
                                }
                            }
                        ]
                    )}
                >
                    <Text className="text-white font-black text-base">Reset Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 w-full p-4 rounded-2xl items-center mb-3 flex-row justify-center gap-2"
                    onPress={() => Linking.openURL('mailto:support.broketogether@gmail.com?subject=Account Locked&body=My account has been locked. Please help.')}
                >
                    <Ionicons name="mail-outline" size={18} color="#64748b" />
                    <Text className="text-slate-600 dark:text-slate-300 font-bold text-base">Contact Support</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setIsLocked(false); setLockMessage(''); setFailedAttempts(0); }}>
                    <Text className="text-slate-400 dark:text-slate-500 text-sm mt-2">Try again anyway</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Main Login Screen ────────────────────────────────────────────
    return (
        <View className="flex-1 bg-background dark:bg-slate-900 p-6 justify-center">
            <View className="mb-10">
                <Text className="text-5xl font-bold text-primary">Broke</Text>
                <Text className="text-5xl font-bold text-secondary dark:text-slate-200">Together</Text>
                <Text className="text-secondary dark:text-slate-400 mt-2 text-lg">Smart spending for roommates.</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-secondary dark:text-slate-300 mb-2 font-semibold">Email Address</Text>
                    <TextInput
                        className="bg-white dark:bg-slate-800 border border-secondary/30 dark:border-slate-600 p-4 rounded-2xl text-slate-900 dark:text-slate-100"
                        placeholder="example@gmail.com"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={(text) => { setEmail(text); if (errors.email) setErrors({ ...errors, email: null }); }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                    />
                    {errors.email && <Text className="text-red-500 mt-1 ml-2 text-sm">{errors.email}</Text>}
                </View>

                <View className="mt-4">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-secondary dark:text-slate-300 font-semibold">Password</Text>
                        <TouchableOpacity onPress={() => setIsForgotPassword(true)}>
                            <Text className="text-primary text-xs font-semibold">Forgot password?</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        className="bg-white dark:bg-slate-800 border border-secondary/30 dark:border-slate-600 p-4 rounded-2xl text-slate-900 dark:text-slate-100"
                        placeholder="••••••••"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={(text) => { setPassword(text); if (errors.password) setErrors({ ...errors, password: null }); }}
                        secureTextEntry
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                    />
                    {errors.password && <Text className="text-red-500 mt-1 ml-2 text-sm">{errors.password}</Text>}
                </View>

                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={isLoading}
                    className="bg-primary mt-8 p-4 rounded-2xl items-center shadow-lg shadow-primary/30"
                >
                    {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Sign In</Text>}
                </TouchableOpacity>
            </View>

            <TouchableOpacity className="mt-6 items-center" onPress={() => setIsSigningUp(true)}>
                <Text className="text-secondary dark:text-slate-400">
                    Don't have an account? <Text className="text-primary font-bold">Sign Up</Text>
                </Text>
            </TouchableOpacity>

            <View className="flex-row items-center mt-8 mb-4">
                <View className="flex-1 h-px bg-secondary/30 dark:bg-slate-700" />
                <Text className="mx-4 text-secondary/60 dark:text-slate-500 text-sm">or</Text>
                <View className="flex-1 h-px bg-secondary/30 dark:bg-slate-700" />
            </View>

            <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={googleLoading || isLoading}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-4 rounded-2xl items-center flex-row justify-center mb-3 shadow-sm"
            >
                {googleLoading ? (
                    <ActivityIndicator color="#E98074" />
                ) : (
                    <>
                        <View className="mr-3">
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4285F4' }}>G</Text>
                        </View>
                        <Text className="text-slate-700 dark:text-slate-200 font-bold text-base">Continue with Google</Text>
                    </>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={continueAsGuest}
                className="border-2 border-primary p-4 rounded-2xl items-center"
            >
                <Text className="text-primary font-bold text-lg">Continue as Guest</Text>
            </TouchableOpacity>
            <Text className="text-secondary/60 dark:text-slate-500 text-xs text-center mt-2">
                Browse the app. Sign in to create households and track expenses.
            </Text>
        </View>
    );
}

export default LoginScreen;
