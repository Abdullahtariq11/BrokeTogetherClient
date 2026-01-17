import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import "./global.css"; 

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-slate-800">
        <View className="p-6">
          <Text className="text-3xl font-bold text-primary">BrokeTogether</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}