import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Share, Modal, TextInput, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import homeService from '../../api/homeService';
import authService from '../../api/authService';

export default function ProfileScreen({ navigation }) {
  const { userInfo, logout, deleteAccount, updateUserInfo, isGuest, exitGuestMode } = useContext(AuthContext);

  const [isAdminOfHome, setIsAdminOfHome] = useState(false);
  const [adminHomeName, setAdminHomeName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Edit name state
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Reset password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isGuest && userInfo?.id) {
      homeService.getMyHomes().then((homes) => {
        if (homes && homes.length > 0) {
          const adminHome = homes.find(h => h.creatorId === userInfo.id);
          if (adminHome) {
            setIsAdminOfHome(true);
            setAdminHomeName(adminHome.name);
          }
        }
      }).catch(() => {});
    }
  }, [userInfo?.id, isGuest]);

  const handleEditName = async () => {
    if (!newName.trim()) return Alert.alert('Error', 'Name cannot be empty.');
    setSavingName(true);
    try {
      const updated = await authService.editName(newName.trim());
      await updateUserInfo(updated);
      setShowEditNameModal(false);
      Alert.alert('Success', 'Name updated successfully.');
    } catch (err) {
      Alert.alert('Error', typeof err === 'string' ? err : 'Failed to update name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) return Alert.alert('Error', 'New passwords do not match.');
    if (newPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters.');
    setSavingPassword(true);
    try {
      await authService.resetPassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully.');
    } catch (err) {
      Alert.alert('Error', typeof err === 'string' ? err : 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

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

  const handleDeleteAccount = () => {
    setConfirmText('');
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (error) {
      setDeleting(false);
      setShowDeleteModal(false);
      Alert.alert("Error", typeof error === 'string' ? error : "Failed to delete account. Please try again.");
    }
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
    <ScrollView className="flex-1 bg-slate-100 dark:bg-slate-900">
      {/* Header Profile Section */}
      <View className="bg-primary p-10 pt-20 rounded-b-[50px] items-center shadow-lg">
        <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center border-4 border-white/30 mb-4">
          <Text className="text-white text-4xl font-bold">
            {isGuest ? 'G' : (userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'U')}
          </Text>
        </View>
        <Text className="text-white text-2xl font-bold">
          {isGuest ? 'Guest' : (userInfo?.name || 'User Name')}
        </Text>
        <Text className="text-white/80 text-base">
          {isGuest ? 'Browsing without an account' : (userInfo?.email || 'user@email.com')}
        </Text>
      </View>

      {/* Settings Options */}
      <View className="p-6 mt-4">
        {isGuest && (
          <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-dashed border-slate-200 dark:border-slate-700 items-center mb-6">
            <Ionicons name="person-add-outline" size={36} color="#E98074" />
            <Text className="text-slate-800 dark:text-slate-100 text-center mt-3 font-bold text-base">
              Create an account to get started
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 text-center text-xs mt-1 mb-4">
              Sign in to create households, track expenses, and split bills with roommates.
            </Text>
            <TouchableOpacity
              onPress={exitGuestMode}
              className="bg-primary px-8 py-4 rounded-2xl w-full items-center shadow-lg shadow-primary/30"
            >
              <Text className="text-white font-bold text-base">Sign In or Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Premium Banner */}
        {!isGuest && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Premium')}
            className="mb-6"
          >
            <View className={`p-5 rounded-3xl flex-row items-center shadow-sm ${userInfo?.isPremium ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800' : 'bg-primary'}`}>
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${userInfo?.isPremium ? 'bg-amber-100 dark:bg-amber-800/50' : 'bg-white/20'}`}>
                <Ionicons name="star" size={20} color={userInfo?.isPremium ? '#d97706' : 'white'} />
              </View>
              <View className="flex-1">
                <Text className={`font-black text-base ${userInfo?.isPremium ? 'text-amber-800 dark:text-amber-300' : 'text-white'}`}>
                  {userInfo?.isPremium ? 'Premium Member' : 'Upgrade to Premium'}
                </Text>
                <Text className={`text-xs mt-0.5 ${userInfo?.isPremium ? 'text-amber-600 dark:text-amber-400' : 'text-white/80'}`}>
                  {userInfo?.isPremium ? 'Manage your subscription' : 'Unlock shopping lists & more features'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={userInfo?.isPremium ? '#d97706' : 'white'} />
            </View>
          </TouchableOpacity>
        )}

        <Text className="text-slate-400 dark:text-slate-500 font-bold uppercase text-xs mb-4 ml-2">Account Settings</Text>

        <View className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          {/* Household Info */}
          <TouchableOpacity
            onPress={() => isGuest ? exitGuestMode() : navigation.navigate('HouseholdSettings')}
            className="flex-row items-center p-5 border-b border-slate-50 dark:border-slate-700"
          >
            <Ionicons name="home-outline" size={22} color="#64748b" />
            <Text className="flex-1 ml-4 text-slate-700 dark:text-slate-200 font-medium">Household Settings</Text>
            {isGuest && <Ionicons name="lock-closed" size={14} color="#cbd5e1" style={{ marginRight: 6 }} />}
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          {/* Edit Name */}
          {!isGuest && (
            <TouchableOpacity
              onPress={() => { setNewName(userInfo?.name ?? ''); setShowEditNameModal(true); }}
              className="flex-row items-center p-5 border-b border-slate-50 dark:border-slate-700"
            >
              <Ionicons name="person-outline" size={22} color="#64748b" />
              <Text className="flex-1 ml-4 text-slate-700 dark:text-slate-200 font-medium">Edit Name</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          )}

          {/* Change Password */}
          {!isGuest && (
            <TouchableOpacity
              onPress={() => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowPasswordModal(true); }}
              className="flex-row items-center p-5 border-b border-slate-50 dark:border-slate-700"
            >
              <Ionicons name="key-outline" size={22} color="#64748b" />
              <Text className="flex-1 ml-4 text-slate-700 dark:text-slate-200 font-medium">Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          )}

          {/* Subscription */}
          {!isGuest && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Premium')}
              className="flex-row items-center p-5 border-b border-slate-50 dark:border-slate-700"
            >
              <Ionicons
                name="star"
                size={22}
                color={userInfo?.isPremium ? '#d97706' : '#64748b'}
              />
              <Text className="flex-1 ml-4 text-slate-700 dark:text-slate-200 font-medium">Subscription</Text>
              <View className={`px-2 py-0.5 rounded-full mr-2 ${userInfo?.isPremium ? 'bg-amber-100 dark:bg-amber-800/50' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <Text className={`text-xs font-bold ${userInfo?.isPremium ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {userInfo?.isPremium ? 'Premium' : 'Free'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          )}

          {/* Share App */}
          <TouchableOpacity onPress={onShareApp} className="flex-row items-center p-5 border-b border-slate-50 dark:border-slate-700">
            <Ionicons name="share-social-outline" size={22} color="#64748b" />
            <Text className="flex-1 ml-4 text-slate-700 dark:text-slate-200 font-medium">Invite Friends</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          {/* Support */}
          <TouchableOpacity
            onPress={() => navigation.navigate('HelpSupport')}
            className="flex-row items-center p-5"
          >
            <Ionicons name="help-circle-outline" size={22} color="#64748b" />
            <Text className="flex-1 ml-4 text-slate-700 dark:text-slate-200 font-medium">Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <Text className="text-slate-400 dark:text-slate-500 font-bold uppercase text-xs mt-8 mb-4 ml-2">Legal</Text>

        <View className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <TouchableOpacity
            onPress={() => navigation.navigate('PrivacyPolicy')}
            className="flex-row items-center p-5 border-b border-slate-50 dark:border-slate-700"
          >
            <Ionicons name="shield-checkmark-outline" size={22} color="#64748b" />
            <Text className="flex-1 ml-4 text-slate-700 dark:text-slate-200 font-medium">Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('TermsConditions')}
            className="flex-row items-center p-5"
          >
            <Ionicons name="document-text-outline" size={22} color="#64748b" />
            <Text className="flex-1 ml-4 text-slate-700 dark:text-slate-200 font-medium">Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <Text className="text-slate-400 dark:text-slate-500 font-bold uppercase text-xs mt-8 mb-4 ml-2">
          {isGuest ? 'Account' : 'Danger Zone'}
        </Text>
        <TouchableOpacity
          onPress={isGuest ? exitGuestMode : handleLogout}
          className="bg-red-50 dark:bg-red-900/30 p-5 rounded-3xl flex-row items-center border border-red-100 dark:border-red-800 shadow-sm"
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text className="ml-4 text-red-500 font-bold text-base">
            {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        {!isGuest && (
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="bg-red-100 dark:bg-red-900/40 p-5 rounded-3xl flex-row items-center border border-red-200 dark:border-red-800 shadow-sm mt-3"
          >
            <Ionicons name="trash-outline" size={22} color="#dc2626" />
            <Text className="ml-4 text-red-600 dark:text-red-400 font-bold text-base">Delete Account</Text>
          </TouchableOpacity>
        )}

        <Text className="text-center text-slate-300 dark:text-slate-600 text-xs mt-10 mb-10">
          BrokeTogether v1.0.4
        </Text>
      </View>

      {/* Edit Name Modal */}
      <Modal visible={showEditNameModal} transparent animationType="fade" onRequestClose={() => !savingName && setShowEditNameModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full shadow-2xl">
            <Text className="text-slate-800 dark:text-slate-100 text-xl font-black mb-4">Edit Name</Text>
            <TextInput
              autoFocus
              value={newName}
              onChangeText={setNewName}
              placeholder="Your name"
              placeholderTextColor="#94a3b8"
              maxLength={100}
              editable={!savingName}
              className="border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 text-base mb-5 bg-slate-50 dark:bg-slate-700"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowEditNameModal(false)} disabled={savingName}
                className="flex-1 p-4 rounded-2xl items-center bg-slate-100 dark:bg-slate-700">
                <Text className="text-slate-600 dark:text-slate-300 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditName} disabled={savingName}
                className="flex-1 p-4 rounded-2xl items-center bg-primary">
                {savingName ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => !savingPassword && setShowPasswordModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full shadow-2xl">
            <Text className="text-slate-800 dark:text-slate-100 text-xl font-black mb-4">Change Password</Text>
            <TextInput secureTextEntry value={currentPassword} onChangeText={setCurrentPassword}
              placeholder="Current password" placeholderTextColor="#94a3b8" editable={!savingPassword}
              className="border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 text-base mb-3 bg-slate-50 dark:bg-slate-700" />
            <TextInput secureTextEntry value={newPassword} onChangeText={setNewPassword}
              placeholder="New password" placeholderTextColor="#94a3b8" editable={!savingPassword}
              className="border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 text-base mb-3 bg-slate-50 dark:bg-slate-700" />
            <TextInput secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword}
              placeholder="Confirm new password" placeholderTextColor="#94a3b8" editable={!savingPassword}
              className="border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 text-base mb-5 bg-slate-50 dark:bg-slate-700" />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} disabled={savingPassword}
                className="flex-1 p-4 rounded-2xl items-center bg-slate-100 dark:bg-slate-700">
                <Text className="text-slate-600 dark:text-slate-300 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResetPassword} disabled={savingPassword}
                className="flex-1 p-4 rounded-2xl items-center bg-primary">
                {savingPassword ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setShowDeleteModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full shadow-2xl">
            {/* Icon */}
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full items-center justify-center">
                <Ionicons name="warning-outline" size={32} color="#dc2626" />
              </View>
            </View>

            <Text className="text-slate-800 dark:text-slate-100 text-xl font-black text-center mb-2">
              Delete Account
            </Text>

            {/* Admin warning */}
            {isAdminOfHome && (
              <View className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-4">
                <View className="flex-row items-start">
                  <Ionicons name="home-outline" size={18} color="#d97706" style={{ marginTop: 1 }} />
                  <Text className="ml-2 text-amber-700 dark:text-amber-400 text-sm font-medium flex-1">
                    You are the admin of <Text className="font-black">"{adminHomeName}"</Text>. Deleting your account will permanently delete this household and remove all members from it.
                  </Text>
                </View>
              </View>
            )}

            <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mb-5">
              This will permanently delete your account and all associated data. {'\n'}
              <Text className="font-bold text-slate-700 dark:text-slate-200">This cannot be undone.</Text>
            </Text>

            {/* Confirm input */}
            <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2 ml-1">
              Type <Text className="font-black text-red-500">DELETE</Text> to confirm
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Type DELETE here"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              editable={!deleting}
              className="border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 font-bold text-base mb-5 bg-slate-50 dark:bg-slate-700"
            />

            {/* Buttons */}
            <TouchableOpacity
              onPress={confirmDeleteAccount}
              disabled={confirmText !== 'DELETE' || deleting}
              className="mb-3"
            >
              <View className={`p-4 rounded-2xl items-center ${confirmText === 'DELETE' ? 'bg-red-600' : 'bg-red-200 dark:bg-red-900/40'}`}>
                {deleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-black text-base">Delete My Account</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="p-4 rounded-2xl items-center bg-slate-100 dark:bg-slate-700"
            >
              <Text className="text-slate-600 dark:text-slate-300 font-bold text-base">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}