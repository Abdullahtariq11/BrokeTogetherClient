import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Purchases from 'react-native-purchases';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { HomeProvider } from './src/context/HomeContext';
import { ThemeProvider } from './src/context/ThemeContext';
import * as SplashScreen from 'expo-splash-screen';
import { REVENUECAT_API_KEY } from './src/config/revenuecat';
import "./global.css";

import LoginScreen from './src/features/LoginScreen';
import AppTabs from './src/navigation/AppTabs';
import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN } from './src/config/sentry';

Sentry.init({
  dsn: SENTRY_DSN,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Keep splash screen visible until we manually hide it 
SplashScreen.preventAutoHideAsync();

if (__DEV__) {
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
}
Purchases.configure({ apiKey: REVENUECAT_API_KEY });

const SPLASH_DURATION = 2500; // milliseconds — adjust as needed

// Shown when a render-time error escapes a screen (the bug class that used to
// take the whole app down — see AuthContext/userInfo null-guard fixes).
// Sentry.ErrorBoundary reports the error and lets the user recover in place
// instead of the app hard-crashing.
function ErrorFallback({ resetError }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
        Something went wrong
      </Text>
      <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
        This has been reported. If it keeps happening, try logging out and back in.
      </Text>
      <TouchableOpacity
        onPress={resetError}
        style={{ backgroundColor: '#E98074', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16 }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

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

export default Sentry.wrap(function App() {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <HomeProvider>
              <AppNav />
            </HomeProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Sentry.ErrorBoundary>
  );
});