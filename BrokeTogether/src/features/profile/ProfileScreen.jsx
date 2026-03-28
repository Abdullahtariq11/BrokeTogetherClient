import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const { userInfo, logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: () => logout() 
        }
      ]
    );
  };

  // Optional: Function to contact support or share the app
  const onShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out BrokeTogether - the best way to split bills with roommates!',
      });
    } catch (error) {
      // Share failed — silently handled
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Header Profile Section */}
      <View className="bg-primary p-10 pt-20 rounded-b-[50px] items-center shadow-lg">
        <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center border-4 border-white/30 mb-4">
          <Text className="text-white text-4xl font-bold">
            {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text className="text-white text-2xl font-bold">{userInfo?.name || 'User Name'}</Text>
        <Text className="text-white/80 text-base">{userInfo?.username || 'user@email.com'}</Text>
      </View>

      {/* Settings Options */}
      <View className="p-6 mt-4">
        <Text className="text-slate-400 font-bold uppercase text-xs mb-4 ml-2">Account Settings</Text>
        
        <View className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Household Info */}
          <TouchableOpacity
            onPress={() => navigation.navigate('HouseholdSettings')}
            className="flex-row items-center p-5 border-b border-slate-50"
          >
            <Ionicons name="home-outline" size={22} color="#64748b" />
            <Text className="flex-1 ml-4 text-slate-700 font-medium">Household Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          {/* Share App */}
          <TouchableOpacity onPress={onShareApp} className="flex-row items-center p-5 border-b border-slate-50">
            <Ionicons name="share-social-outline" size={22} color="#64748b" />
            <Text className="flex-1 ml-4 text-slate-700 font-medium">Invite Friends</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          {/* Support */}
          <TouchableOpacity
            onPress={() => navigation.navigate('HelpSupport')}
            className="flex-row items-center p-5"
          >
            <Ionicons name="help-circle-outline" size={22} color="#64748b" />
            <Text className="flex-1 ml-4 text-slate-700 font-medium">Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <Text className="text-slate-400 font-bold uppercase text-xs mt-8 mb-4 ml-2">Legal</Text>

        <View className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <TouchableOpacity
            onPress={() => navigation.navigate('PrivacyPolicy')}
            className="flex-row items-center p-5 border-b border-slate-50"
          >
            <Ionicons name="shield-checkmark-outline" size={22} color="#64748b" />
            <Text className="flex-1 ml-4 text-slate-700 font-medium">Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('TermsConditions')}
            className="flex-row items-center p-5"
          >
            <Ionicons name="document-text-outline" size={22} color="#64748b" />
            <Text className="flex-1 ml-4 text-slate-700 font-medium">Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <Text className="text-slate-400 font-bold uppercase text-xs mt-8 mb-4 ml-2">Danger Zone</Text>
        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-red-50 p-5 rounded-3xl flex-row items-center border border-red-100 shadow-sm"
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text className="ml-4 text-red-500 font-bold text-base">Sign Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-slate-300 text-xs mt-10 mb-10">
          BrokeTogether v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}