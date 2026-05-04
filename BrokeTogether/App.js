import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import "./global.css";

import LoginScreen from './src/features/LoginScreen';
import AppTabs from './src/navigation/AppTabs';
import ActivityTracker from './src/component/ActivityTracker';

const AppNav = () => {
  const { isLoading, userToken, isGuest } = useContext(AuthContext);

  // Strict boolean check for the spinner
  if (isLoading === true) {
    return (
      <View className="flex-1 bg-slate-800 justify-center items-center">
        <ActivityIndicator size="large" color="#E98074" />
      </View>
    );
  }


  return (
    <View className="flex-1">
      {/* Show app if user is logged in OR browsing as guest */}
      {!!userToken || isGuest ? (
        <NavigationContainer>
          <AppTabs />
        </NavigationContainer>
      ) : (
        <LoginScreen />
      )}
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ActivityTracker>
        <AppNav />
        </ActivityTracker>
      </AuthProvider>
    </SafeAreaProvider>
  );
}