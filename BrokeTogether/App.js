import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import client from './src/api/client';
import "./global.css";

export default function App() {
  const [status, setStatus] = useState('Checking connection...');

  useEffect(() => {
    // Simple test to check if backend is reachable
    client.get('/health') // or any public endpoint you have
      .then(() => setStatus('Backend Connected! ✅'))
      .catch((err) => setStatus(`Connection Failed ❌: ${err.message}`));
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-slate-800 justify-center items-center">
        <View className="bg-white/10 p-8 rounded-3xl border border-white/20">
          <Text className="text-4xl font-bold text-primary text-center">BrokeTogether</Text>
          <Text className="text-secondary text-center mt-4 text-lg">{status}</Text>
          {status.includes('Checking') && <ActivityIndicator className="mt-4" color="#E98074" />}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}