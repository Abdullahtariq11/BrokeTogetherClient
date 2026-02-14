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

  // DEBUG: Log to see what's happening
  useEffect(() => {
    if (allMembers.length > 0 && userInfo) {
      console.log('=== DEBUG INFO ===');
      console.log('userInfo.id:', userInfo.id, 'type:', typeof userInfo.id);
      console.log('All members:', allMembers.map(m => ({ id: m.id, type: typeof m.id, name: m.name })));
    }
  }, [allMembers, userInfo]);

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
      console.log('Raw members from API:', data);
      setAllMembers(data || []);
    } catch (err) {
      console.error("Error loading members for split:", err);
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
        <View className="bg-white p-6 rounded-t-[40px] shadow-2xl max-h-[90%]">
          <View className="w-12 h-1 bg-slate-200 self-center rounded-full mb-6" />
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-2xl font-bold text-slate-800 mb-6 text-center">
              New Expense
            </Text>
            
            {/* Amount Input */}
            <View className="mb-4">
              <Text className="text-slate-500 mb-2 ml-1 font-semibold uppercase text-[10px] tracking-widest">
                Amount
              </Text>
              <TextInput 
                placeholder="0.00"
                keyboardType="decimal-pad"
                className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-2xl font-black text-primary"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Description Input */}
            <View className="mb-6">
              <Text className="text-slate-500 mb-2 ml-1 font-semibold uppercase text-[10px] tracking-widest">
                What was it for?
              </Text>
              <TextInput 
                placeholder="e.g. Weekly Groceries"
                className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-lg text-slate-700 font-medium"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Category Selector */}
            <Text className="text-slate-500 mb-3 ml-1 font-semibold uppercase text-[10px] tracking-widest">
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`mr-2 px-6 py-2 rounded-full border ${
                    category === cat ? 'bg-primary border-primary' : 'bg-white border-slate-200'
                  }`}
                >
                  <Text className={`font-bold ${category === cat ? 'text-white' : 'text-slate-500'}`}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Payer Info (You) */}
            <Text className="text-slate-500 mb-3 ml-1 font-semibold uppercase text-[10px] tracking-widest">
              Paid by
            </Text>
            <View className="flex-row items-center p-4 rounded-2xl mb-4 bg-primary/5 border border-primary/20">
              <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mr-3">
                <Text className="text-primary font-bold">
                  {userInfo?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 font-bold">{userInfo?.name} (You)</Text>
                <Text className="text-[10px] text-primary font-bold">PAYER - AUTO INCLUDED IN SPLIT</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#E98074" />
            </View>

            {/* Split Selection */}
            <Text className="text-slate-500 mb-3 ml-1 font-semibold uppercase text-[10px] tracking-widest">
              Split with ({otherMembers.length} roommates)
            </Text>
            <View className="mb-8">
              {fetchingMembers ? (
                <ActivityIndicator color="#E98074" />
              ) : otherMembers.length === 0 ? (
                <View className="bg-slate-50 p-6 rounded-2xl items-center">
                  <Ionicons name="people-outline" size={32} color="#cbd5e1" />
                  <Text className="text-slate-400 text-center mt-2">
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
                      className={`flex-row items-center p-4 rounded-2xl mb-2 border ${
                        isSelected ? 'bg-primary/5 border-primary/20' : 'bg-white border-slate-50'
                      }`}
                    >
                      <Ionicons 
                        name={isSelected ? "checkbox" : "square-outline"} 
                        size={24} 
                        color={isSelected ? "#E98074" : "#cbd5e1"} 
                      />
                      <View className="ml-3 flex-1">
                        <Text className={`text-base ${isSelected ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                          {member.name}
                        </Text>
                      </View>
                      {isSelected && amount && (
                        <Text className="text-primary font-bold">
                          ${splitAmount.toFixed(2)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={loading || otherMembers.length === 0}
              className={`p-5 rounded-2xl items-center shadow-lg mb-4 ${
                loading || otherMembers.length === 0 ? 'bg-slate-300' : 'bg-primary shadow-primary/40'
              }`}
            >
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
            </TouchableOpacity>

            <TouchableOpacity onPress={handleClose} className="mb-10 items-center">
              <Text className="text-slate-400 font-bold">Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}