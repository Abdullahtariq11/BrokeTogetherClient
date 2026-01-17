import React, { useContext } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import "./global.css";
import LoginScreen from './src/features/LoginScreen';
import Dashboard from './src/features/Dashboard';

// 1. This component decides what to show
const AppNav = () => {
  const { isLoading, userToken, logout } = useContext(AuthContext);

  // Show a loading spinner while checking SecureStore
  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-800 justify-center items-center">
        <ActivityIndicator size="large" color="#E98074" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {userToken !== null ? (
        <Dashboard />
      ) : (
        <LoginScreen /> // <--- Show the real login screen here
      )}
    </View>
  );
};

// 2. The main export wraps everything in the Provider
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}