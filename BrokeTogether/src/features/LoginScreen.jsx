import React, { useContext, useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthContext } from '../context/AuthContext';

function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, isLoading } = useContext(AuthContext);
    const [errors, setErrors] = useState({});

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

    const handleLogin = async () => {
        if (validate()) {
            try {
                await login(email, password);
            } catch (err) {
                setTimeout(() => {
                    Alert.alert("Login Failed", err.toString());
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
                <Text className="text-secondary">
                    Don't have an account? <Text className="text-primary font-bold">Sign Up</Text>
                </Text>
            </TouchableOpacity>
        </View>
    )
}

export default LoginScreen