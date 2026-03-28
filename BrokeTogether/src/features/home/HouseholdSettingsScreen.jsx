import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import homeService from '../../api/homeService';

export default function HouseholdSettingsScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);

  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Rename state
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadHome = useCallback(async () => {
    try {
      const homes = await homeService.getMyHomes();
      if (homes && homes.length > 0) {
        const activeHome = homes[0];
        setHome(activeHome);
        setNewName(activeHome.name);
        setIsAdmin(activeHome.creatorId === userInfo?.id);
      }
    } catch (err) {
      // Failed to load home
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  const handleRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert('Invalid Name', 'Household name cannot be empty.');
      return;
    }
    if (trimmed === home.name) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await homeService.renameHome(home.id, trimmed);
      setHome({ ...home, name: trimmed });
      setEditing(false);
      Alert.alert('Success', 'Household name updated.');
    } catch (err) {
      // Rename failed
      Alert.alert('Error', 'Failed to rename household. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Household',
      `Are you sure you want to leave "${home.name}"? You will lose access to all shared expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await homeService.leaveHome(home.id);
              Alert.alert('Left Household', 'You have left the household.');
              navigation.navigate('Home');
            } catch (err) {
              // Leave failed
              Alert.alert('Error', 'Failed to leave household. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#E98074" />
      </View>
    );
  }

  if (!home) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 px-6">
        <Ionicons name="home-outline" size={48} color="#cbd5e1" />
        <Text className="text-slate-400 text-center mt-4">
          You are not part of any household.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-6 bg-primary px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary p-8 pt-16 rounded-b-[40px] shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-white/10 p-2 rounded-full border border-white/20 mr-4"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-black">Household Settings</Text>
        </View>
      </View>

      <View className="p-6 mt-4">
        {/* Household Name Section */}
        <Text className="text-slate-400 font-bold uppercase text-xs mb-4 ml-2">
          Household Name
        </Text>
        <View className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 mb-6">
          {editing ? (
            <View>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                className="text-slate-800 text-lg font-bold border-b border-slate-200 pb-2 mb-4"
                autoFocus
                maxLength={30}
              />
              <View className="flex-row justify-end">
                <TouchableOpacity
                  onPress={() => {
                    setNewName(home.name);
                    setEditing(false);
                  }}
                  className="px-4 py-2 mr-3"
                >
                  <Text className="text-slate-400 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRename}
                  disabled={saving}
                  className="bg-primary px-5 py-2 rounded-xl"
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold">Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-slate-800 text-lg font-bold">{home.name}</Text>
                <Text className="text-slate-400 text-xs mt-1">
                  Code: {home.inviteCode}
                </Text>
              </View>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => setEditing(true)}
                  className="bg-slate-100 p-2.5 rounded-xl"
                >
                  <Ionicons name="pencil" size={18} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Role Info */}
        <Text className="text-slate-400 font-bold uppercase text-xs mb-4 ml-2">
          Your Role
        </Text>
        <View className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 mb-6 flex-row items-center">
          <View className={`p-2.5 rounded-xl mr-4 ${isAdmin ? 'bg-amber-50' : 'bg-blue-50'}`}>
            <Ionicons
              name={isAdmin ? 'shield-checkmark' : 'person'}
              size={20}
              color={isAdmin ? '#f59e0b' : '#3b82f6'}
            />
          </View>
          <View>
            <Text className="text-slate-800 font-bold">
              {isAdmin ? 'Admin' : 'Member'}
            </Text>
            <Text className="text-slate-400 text-xs mt-0.5">
              {isAdmin
                ? 'You created this household'
                : 'You can leave this household anytime'}
            </Text>
          </View>
        </View>

        {/* Leave Household (non-admin only) */}
        {!isAdmin && (
          <>
            <Text className="text-slate-400 font-bold uppercase text-xs mt-4 mb-4 ml-2">
              Danger Zone
            </Text>
            <TouchableOpacity
              onPress={handleLeave}
              className="bg-red-50 p-5 rounded-3xl flex-row items-center border border-red-100 shadow-sm"
            >
              <Ionicons name="exit-outline" size={22} color="#ef4444" />
              <View className="ml-4">
                <Text className="text-red-500 font-bold text-base">Leave Household</Text>
                <Text className="text-red-300 text-xs mt-0.5">
                  You will lose access to shared expenses
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}
