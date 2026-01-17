import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import "./global.css";
import LoginScreen from './src/features/LoginScreen';

// 1. This component decides what to show
const AppNav = () => {
  const { isLoading, userToken } = useContext(AuthContext);

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
        <View className="flex-1  bg-slate-800 justify-center items-center">
          <Text className="text-white">Welcome to the Dashboard!</Text>
          <TouchableOpacity onPress={logout} className="mt-4 p-2 bg-red-400 rounded">
            <Text>Logout</Text>
          </TouchableOpacity>
        </View>
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