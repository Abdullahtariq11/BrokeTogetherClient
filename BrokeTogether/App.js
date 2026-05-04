import React, { useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import "./global.css";

import LoginScreen from './src/features/LoginScreen';
import AppTabs from './src/navigation/AppTabs';
import ActivityTracker from './src/component/ActivityTracker';

// Keep splash screen visible until we manually hide it
SplashScreen.preventAutoHideAsync();

const SPLASH_DURATION = 2500; // milliseconds — adjust as needed

const AppNav = () => {
  const { isLoading, userToken, isGuest } = useContext(AuthContext);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
      setSplashDone(true);
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Keep showing splash until both the timer and auth are done
  if (!splashDone || isLoading === true) {
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