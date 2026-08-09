import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Modal, 
  Alert, KeyboardAvoidingView, Platform, ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import expenseService from '../../api/expenseService';
import homeService from '../../api/homeService';

const CATEGORIES = ['General', 'Groceries', 'Rent', 'Utilities', 'Entertainment'];

export default function AddExpenseModal({ visible, onClose, homeId, onRefresh }) {
  const { userInfo } = useContext(AuthContext);
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  
  const [allMembers, setAllMembers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [fetchingMembers, setFetchingMembers] = useState(false);

  // Filter out current user - compare by ID AND name as fallback
  const otherMembers = allMembers.filter(m => {
    const currentUserId = userInfo?.id;
    const currentUserName = userInfo?.name?.toLowerCase().trim();
    
    // Compare by ID (handle both number and string)
    const idMatch = String(m.id) === String(currentUserId) || 
                    Number(m.id) === Number(currentUserId);
    
    // Compare by name as fallback
    const nameMatch = m.name?.toLowerCase().trim() === currentUserName;
    
    // Exclude if either matches
    return !idMatch && !nameMatch;
  });

  useEffect(() => {
    if (visible && homeId) {
      loadMembers();
    }
  }, [visible, homeId]);

  useEffect(() => {
    if (otherMembers.length > 0) {
      setSelectedUserIds(otherMembers.map(m => m.id));
    }
  }, [allMembers, userInfo?.id]);

  const loadMembers = async () => {
    setFetchingMembers(true);
    try {
      const data = await homeService.getMembers(homeId);
      setAllMembers(data || []);
    } catch (err) {
      // Failed to load members
    } finally {
      setFetchingMembers(false);
    }
  };

  const toggleMember = (id) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return Alert.alert("Invalid Amount", "Please enter a valid amount.");
    }
    if (!description || description.trim().length < 3) {
      return Alert.alert("Invalid Description", "Please add a short description.");
    }
    if (selectedUserIds.length < 1) {
      return Alert.alert("Selection Required", "Select at least one roommate to split with.");
    }

    setLoading(true);
    try {
      const payload = {
        amount: parsedAmount,
        description: description.trim(),
        category: category,
        homeId: Number(homeId),
        userId: selectedUserIds.map(id => Number(id))
      };

      await expenseService.createSelectiveExpense(payload);
      Alert.alert("Success", "Expense added and split!");
      resetForm();
      onRefresh(); 
      onClose();   
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error saving bill.";
      Alert.alert("Submission Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('General');
    setSelectedUserIds([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const totalParticipants = selectedUserIds.length + 1;
  const splitAmount = parseFloat(amount || 0) / totalParticipants;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-white dark:bg-slate-800 p-6 rounded-t-[40px] shadow-2xl max-h-[90%]">
          <View className="w-12 h-1 bg-slate-200 dark:bg-slate-600 self-center rounded-full mb-6" />

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">
              New Expense
            </Text>

            {/* Amount Input */}
            <View className="mb-4">
              <Text className="text-slate-500 dark:text-slate-400 mb-2 ml-1 font-semibold uppercase text-[10px] tracking-widest">
                Amount
              </Text>
              <TextInput
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                className="bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 p-4 rounded-2xl text-2xl font-black text-primary"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Description Input */}
            <View className="mb-6">
              <Text className="text-slate-500 dark:text-slate-400 mb-2 ml-1 font-semibold uppercase text-[10px] tracking-widest">
                What was it for?
              </Text>
              <TextInput
                placeholder="e.g. Weekly Groceries"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 p-4 rounded-2xl text-lg text-slate-700 dark:text-slate-100 font-medium"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Category Selector */}
            <Text className="text-slate-500 dark:text-slate-400 mb-3 ml-1 font-semibold uppercase text-[10px] tracking-widest">
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className="mr-2"
                >
                  <View className={`px-6 py-2 rounded-full border ${
                    category === cat ? 'bg-primary border-primary' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                  }`}>
                    <Text className={`font-bold ${category === cat ? 'text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                      {cat}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Payer Info (You) */}
            <Text className="text-slate-500 dark:text-slate-400 mb-3 ml-1 font-semibold uppercase text-[10px] tracking-widest">
              Paid by
            </Text>
            <View className="flex-row items-center p-4 rounded-2xl mb-4 bg-primary/5 dark:bg-primary/10 border border-primary/20">
              <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mr-3">
                <Text className="text-primary font-bold">
                  {userInfo?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 dark:text-slate-100 font-bold">{userInfo?.name} (You)</Text>
                <Text className="text-[10px] text-primary font-bold">PAYER - AUTO INCLUDED IN SPLIT</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#E98074" />
            </View>

            {/* Split Selection */}
            <Text className="text-slate-500 dark:text-slate-400 mb-3 ml-1 font-semibold uppercase text-[10px] tracking-widest">
              Split with ({otherMembers.length} roommates)
            </Text>
            <View className="mb-8">
              {fetchingMembers ? (
                <ActivityIndicator color="#E98074" />
              ) : otherMembers.length === 0 ? (
                <View className="bg-slate-50 dark:bg-slate-700 p-6 rounded-2xl items-center">
                  <Ionicons name="people-outline" size={32} color="#cbd5e1" />
                  <Text className="text-slate-400 dark:text-slate-500 text-center mt-2">
                    No other roommates yet
                  </Text>
                </View>
              ) : (
                otherMembers.map((member) => {
                  const isSelected = selectedUserIds.includes(member.id);

                  return (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => toggleMember(member.id)}
                      className="mb-2"
                    >
                      <View className={`flex-row items-center p-4 rounded-2xl border ${
                        isSelected ? 'bg-primary/5 dark:bg-primary/10 border-primary/20' : 'bg-white dark:bg-slate-700 border-slate-50 dark:border-slate-600'
                      }`}>
                        <Ionicons
                          name={isSelected ? "checkbox" : "square-outline"}
                          size={24}
                          color={isSelected ? "#E98074" : "#cbd5e1"}
                        />
                        <View className="ml-3 flex-1">
                          <Text className={`text-base ${isSelected ? 'text-slate-800 dark:text-slate-100 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            {member.name}
                          </Text>
                        </View>
                        {isSelected && amount && (
                          <Text className="text-primary font-bold">
                            ${splitAmount.toFixed(2)}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || otherMembers.length === 0}
              className="mb-4"
            >
              <View className={`p-5 rounded-2xl items-center shadow-lg ${
                loading || otherMembers.length === 0 ? 'bg-slate-300 dark:bg-slate-600' : 'bg-primary shadow-primary/40'
              }`}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-black text-lg">
                    {selectedUserIds.length === 0
                      ? "Select roommates"
                      : `Split $${splitAmount.toFixed(2)} each (${totalParticipants} people)`
                    }
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleClose} className="mb-10 items-center">
              <Text className="text-slate-400 dark:text-slate-500 font-bold">Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}