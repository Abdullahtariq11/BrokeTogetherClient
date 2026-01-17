import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const { userInfo, logout } = useContext(AuthContext);

  return (
    <View className="flex-1 bg-background p-6 justify-center items-center">
      <View className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 items-center w-full">
        <View className="bg-primary/10 p-4 rounded-full mb-4">
           <Text className="text-primary text-2xl font-bold">
             {userInfo?.name?.charAt(0) || 'U'}
           </Text>
        </View>
        
        <Text className="text-slate-800 text-2xl font-bold">Welcome, {userInfo?.name}!</Text>
        <Text className="text-slate-500 mt-1">{userInfo?.email}</Text>
        
        <View className="bg-slate-100 px-3 py-1 rounded-full mt-4">
          <Text className="text-slate-600 text-xs font-bold uppercase tracking-widest">
            {userInfo?.role}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={logout}
          className="mt-10 border border-red-200 p-4 rounded-2xl w-full items-center"
        >
          <Text className="text-red-500 font-semibold">Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}