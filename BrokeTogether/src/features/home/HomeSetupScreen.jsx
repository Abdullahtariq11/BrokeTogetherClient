import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import homeService from '../../api/homeService';

export default function HomeSetupScreen({ onHomeCreated }) {
  const [isJoining, setIsJoining] = useState(false); // Toggle between Create and Join
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!inputValue) return Alert.alert("Error", "Please enter a name or code");
    
    setLoading(true);
    try {
      if (isJoining) {
        await homeService.joinHome(inputValue);
        Alert.alert("Success", "You have joined the home!");
      } else {
        await homeService.createHome(inputValue);
        Alert.alert("Success", `Home "${inputValue}" created!`);
      }
      onHomeCreated(); // Callback to refresh the Dashboard
    } catch (err) {
      Alert.alert("Error", typeof err === 'string' ? err : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background p-8 justify-center">
      <Text className="text-3xl font-bold text-slate-800 mb-2">
        {isJoining ? "Join a Home" : "Create a Home"}
      </Text>
      <Text className="text-slate-500 mb-8">
        {isJoining 
          ? "Enter the invite code shared by your roommate." 
          : "Start a new group to track expenses with roommates."}
      </Text>

      <View className="mb-6">
        <TextInput
          className="bg-white border border-slate-200 p-4 rounded-2xl text-lg"
          placeholder={isJoining ? "Invite Code (e.g. AB123)" : "Home Name (e.g. Apartment 4B)"}
          value={inputValue}
          onChangeText={setInputValue}
          autoCapitalize={isJoining ? "characters" : "words"}
        />
      </View>

      <TouchableOpacity 
        onPress={handleAction}
        disabled={loading}
        className="bg-primary p-4 rounded-2xl items-center shadow-md shadow-primary/30"
      >
        {loading ? <ActivityIndicator color="white" /> : (
          <Text className="text-white font-bold text-lg">
            {isJoining ? "Join Group" : "Create Group"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => {
          setIsJoining(!isJoining);
          setInputValue('');
        }}
        className="mt-6 items-center"
      >
        <Text className="text-secondary font-medium">
          {isJoining ? "Need to create a new home?" : "Have an invite code? Join instead"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}