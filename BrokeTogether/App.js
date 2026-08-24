import React, { useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Purchases from 'react-native-purchases';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import * as SplashScreen from 'expo-splash-screen';
import { REVENUECAT_API_KEY } from './src/config/revenuecat';
import "./global.css";

import LoginScreen from './src/features/LoginScreen';
import AppTabs from './src/navigation/AppTabs';

// Keep splash screen visible until we manually hide it 
SplashScreen.preventAutoHideAsync();

if (__DEV__) {
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
}
Purchases.configure({ apiKey: REVENUECAT_API_KEY });

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

  if (!splashDone || isLoading === true) {
    return (
      <View className="flex-1 bg-slate-800 justify-center items-center">
        <ActivityIndicator size="large" color="#E98074" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!!userToken || isGuest ? (
        <AppTabs />
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNav />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}