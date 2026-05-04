import React, { useContext, useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { AuthContext } from '../context/AuthContext';
import SignupScreen from './SignupScreen';

function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, isLoading, continueAsGuest } = useContext(AuthContext);
    const [errors, setErrors] = useState({});
    const [isSigningUp, setIsSigningUp] = useState(false);

    // Manual Validation Logic
    const validate = () => {
        let tempErrors = {};
        const emailRegex = /\S+@\S+\.\S+/;

        if (!email) {
            tempErrors.email = "Email is required";
        } else if (!emailRegex.test(email)) {
            tempErrors.email = "Please enter a valid email address";
        }

        if (!password) {
            tempErrors.password = "Password is required";
        } else if (password.length < 6) {
            tempErrors.password = "Password must be at least 6 characters";
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0; // Returns true if no errors
    };

    if (isSigningUp) {
  return <SignupScreen onBack={() => setIsSigningUp(false)} />;
}

    const handleLogin = async () => {
        if (validate()) {
            try {
                await login(email, password);
            } catch (err) {
                setTimeout(() => {
                    Alert.alert("Login Failed", typeof err === 'string' ? err : "Please check your credentials and try again.");
                }, 100);
            }
        }
    }
    return (
        <View className="flex-1 bg-background p-6 justify-center">
            <View className="mb-10">
                <Text className="text-5xl font-bold text-primary">Broke</Text>
                <Text className="text-5xl font-bold text-secondary">Together</Text>
                <Text className="text-secondary mt-2 text-lg">Smart spending for roommates.</Text>
            </View>

            <View className="space-y-4">
                {/* Email Input */}
                <View>
                    <Text className="text-secondary mb-2 font-semibold">Email Address</Text>
                    <TextInput
                        className="bg-white border border-secondary/30 p-4 rounded-2xl text-slate-900"
                        placeholder="example@gmail.com"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) setErrors({ ...errors, email: null }); // Clear error while typing
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType='email'
                    />
                    {errors.email && <Text className="text-red-500 mt-1 ml-2 text-sm">{errors.email}</Text>}
                </View>

                {/* Password Input */}
                <View className="mt-4">
                    <Text className="text-secondary mb-2 font-semibold">Password</Text>
                    <TextInput
                        className="bg-white border border-secondary/30 p-4 rounded-2xl text-slate-900"
                        placeholder="••••••••"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) setErrors({ ...errors, password: null });
                        }}
                        secureTextEntry
                    />
                    {errors.password && <Text className="text-red-500 mt-1 ml-2 text-sm">{errors.password}</Text>}
                </View>

                {/* Login Button */}
                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={isLoading}
                    className="bg-primary mt-8 p-4 rounded-2xl items-center shadow-lg shadow-primary/30"
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Sign In</Text>
                    )}
                </TouchableOpacity>
            </View>

            <TouchableOpacity className="mt-6 items-center">
                <Text className="text-secondary" onPress={() => setIsSigningUp(true)}>
                    Don't have an account? <Text className="text-primary font-bold">Sign Up</Text>
                </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center mt-8 mb-4">
                <View className="flex-1 h-px bg-secondary/30" />
                <Text className="mx-4 text-secondary/60 text-sm">or</Text>
                <View className="flex-1 h-px bg-secondary/30" />
            </View>

            {/* Continue as Guest Button */}
            <TouchableOpacity
                onPress={continueAsGuest}
                className="border-2 border-primary p-4 rounded-2xl items-center"
            >
                <Text className="text-primary font-bold text-lg">Continue as Guest</Text>
            </TouchableOpacity>
            <Text className="text-secondary/60 text-xs text-center mt-2">
                Browse the app. Sign in to create households and track expenses.
            </Text>
        </View>
    )
}

export default LoginScreen
