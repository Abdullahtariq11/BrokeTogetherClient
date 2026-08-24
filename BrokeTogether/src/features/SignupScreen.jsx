import React, { useState, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../api/authService';
import { AuthContext } from '../context/AuthContext';

export default function SignupScreen({ onBack }) {
  const { login } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      return Alert.alert("Missing Fields", "Please fill in all details.");
    }

    setLoading(true);
    try {
      // 1. Register the user
      await authService.register(email, name, password);
      
      Alert.alert("Account Created", "Welcome to BrokeTogether!", [
        { text: "Continue", onPress: () => login(email, password) }
      ]);
    } catch (err) {
      Alert.alert("Signup Failed", "That email might already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-100 dark:bg-slate-900"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-8 pt-20 pb-10">
          {/* Back Button */}
          <TouchableOpacity onPress={onBack} className="mb-8 w-10 h-10 items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-full">
            <Ionicons name="arrow-back" size={24} color="#64748b" />
          </TouchableOpacity>

          <Text className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-2">Create Account</Text>
          <Text className="text-slate-400 dark:text-slate-500 text-lg mb-10">Start splitting bills with ease.</Text>

          {/* Full Name Input */}
          <View className="mb-5">
            <Text className="text-slate-500 dark:text-slate-400 font-bold mb-2 ml-1">Full Name</Text>
            <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl">
              <Ionicons name="person-outline" size={20} color="#94a3b8" />
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#94a3b8"
                className="flex-1 ml-3 text-slate-700 dark:text-slate-100"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email/Username Input */}
          <View className="mb-5">
            <Text className="text-slate-500 dark:text-slate-400 font-bold mb-2 ml-1">Email Address</Text>
            <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl">
              <Ionicons name="mail-outline" size={20} color="#94a3b8" />
              <TextInput
                placeholder="email@example.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 ml-3 text-slate-700 dark:text-slate-100"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-10">
            <Text className="text-slate-500 dark:text-slate-400 font-bold mb-2 ml-1">Password</Text>
            <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl">
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
              <TextInput
                placeholder="Min. 6 characters"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                className="flex-1 ml-3 text-slate-700 dark:text-slate-100"
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
          >
            <View className={`p-5 rounded-2xl items-center shadow-lg ${loading ? 'bg-slate-300' : 'bg-primary shadow-primary/30'}`}>
              <Text className="text-white font-bold text-lg">
                {loading ? "Creating Account..." : "Sign Up"}
              </Text>
            </View>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-8">
            <Text className="text-slate-400 dark:text-slate-500">Already have an account? </Text>
            <TouchableOpacity onPress={onBack}>
              <Text className="text-primary font-bold">Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
