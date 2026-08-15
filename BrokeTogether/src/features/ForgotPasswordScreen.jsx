import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../api/authService';

export default function ForgotPasswordScreen({ onBack }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async () => {
        const emailRegex = /\S+@\S+\.\S+/;
        if (!email) return setError('Email is required');
        if (!emailRegex.test(email)) return setError('Please enter a valid email address');

        setError('');
        setLoading(true);
        try {
            await authService.forgotPassword(email.trim());
            setSent(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <View className="flex-1 bg-background dark:bg-slate-900 p-6 justify-center items-center">
                <View className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full items-center justify-center mb-6">
                    <Ionicons name="mail-open-outline" size={36} color="#10b981" />
                </View>
                <Text className="text-slate-800 dark:text-slate-100 text-2xl font-black text-center mb-2">Check your email</Text>
                <Text className="text-secondary dark:text-slate-400 text-sm text-center mb-8">
                    If {email} is registered, you'll receive a reset link shortly.
                </Text>
                <TouchableOpacity
                    className="bg-primary w-full p-4 rounded-2xl items-center"
                    onPress={onBack}
                >
                    <Text className="text-white font-black text-base">Back to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background dark:bg-slate-900 p-6 justify-center">
            <TouchableOpacity onPress={onBack} className="mb-8 w-10 h-10 items-center justify-center bg-white dark:bg-slate-800 rounded-full self-start">
                <Ionicons name="arrow-back" size={22} color="#64748b" />
            </TouchableOpacity>

            <Text className="text-slate-800 dark:text-slate-100 text-3xl font-black mb-2">Forgot password?</Text>
            <Text className="text-secondary dark:text-slate-400 text-base mb-8">
                Enter your email and we'll send you a reset link.
            </Text>

            <View>
                <Text className="text-secondary dark:text-slate-300 mb-2 font-semibold">Email Address</Text>
                <TextInput
                    className="bg-white dark:bg-slate-800 border border-secondary/30 dark:border-slate-600 p-4 rounded-2xl text-slate-900 dark:text-slate-100"
                    placeholder="example@gmail.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={(text) => { setEmail(text); if (error) setError(''); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                />
                {error ? <Text className="text-red-500 mt-1 ml-2 text-sm">{error}</Text> : null}
            </View>

            <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="bg-primary mt-8 p-4 rounded-2xl items-center shadow-lg shadow-primary/30"
            >
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Send Reset Link</Text>}
            </TouchableOpacity>

            <TouchableOpacity className="mt-6 items-center" onPress={onBack}>
                <Text className="text-primary font-bold">Back to Login</Text>
            </TouchableOpacity>
        </View>
    );
}
