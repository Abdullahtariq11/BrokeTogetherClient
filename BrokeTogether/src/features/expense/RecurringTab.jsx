import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Modal,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import recurringExpenseService from '../../api/recurringExpenseService';

const FREQUENCIES = ['WEEKLY', 'MONTHLY'];

const CATEGORIES = ['General', 'Rent', 'Utilities', 'Groceries', 'Internet', 'Insurance', 'Subscriptions', 'Other'];

function FrequencyBadge({ frequency }) {
  const isWeekly = frequency === 'WEEKLY';
  return (
    <View className={`px-2 py-0.5 rounded-full ${isWeekly ? 'bg-sky-50 dark:bg-sky-900/30' : 'bg-violet-50 dark:bg-violet-900/30'}`}>
      <Text className={`text-[10px] font-bold uppercase ${isWeekly ? 'text-sky-500' : 'text-violet-500'}`}>
        {isWeekly ? 'Weekly' : 'Monthly'}
      </Text>
    </View>
  );
}

export default function RecurringTab({ homeId, navigation }) {
  const { userInfo } = useContext(AuthContext);
  const isPremium = userInfo?.isPremium ?? false;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [splitType, setSplitType] = useState('SPLIT');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isPremium) { setLoading(false); return; }
    try {
      const data = await recurringExpenseService.getByHome(homeId);
      setItems(data || []);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [homeId, isPremium]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!description.trim()) return Alert.alert('Error', 'Description is required.');
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return Alert.alert('Error', 'Enter a valid amount greater than 0.');
    }

    setSaving(true);
    try {
      const created = await recurringExpenseService.create({
        homeId,
        description: description.trim(),
        amount: parsedAmount,
        category: category || null,
        frequency,
        splitType,
      });
      setItems(prev => [created, ...prev]);
      setShowAdd(false);
      setDescription(''); setAmount(''); setCategory('General'); setFrequency('MONTHLY'); setSplitType('SPLIT');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create recurring expense.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Stop Recurring?',
      `This will deactivate "${item.description}". No more automatic expenses will be created.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              await recurringExpenseService.deactivate(item.id);
              setItems(prev => prev.filter(i => i.id !== item.id));
            } catch {
              Alert.alert('Error', 'Failed to deactivate. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Premium gate
  if (!isPremium) {
    return (
      <View className="px-6 pt-4 pb-24 items-center">
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-8 items-center border border-dashed border-slate-200 dark:border-slate-700 w-full">
          <View className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center mb-4">
            <Ionicons name="repeat" size={30} color="#d97706" />
          </View>
          <Text className="text-slate-800 dark:text-slate-100 font-black text-lg text-center">Recurring Expenses</Text>
          <Text className="text-slate-400 dark:text-slate-500 text-sm text-center mt-2 mb-5">
            Set up automatic weekly or monthly expenses — rent, subscriptions, utilities and more.
            This is a Premium feature.
          </Text>
          <TouchableOpacity
            onPress={() => navigation?.navigate('Settings', { screen: 'Premium' })}
            className="bg-primary px-6 py-4 rounded-2xl flex-row items-center gap-2"
          >
            <Ionicons name="star" size={16} color="white" />
            <Text className="text-white font-black">Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator color="#E98074" />
      </View>
    );
  }

  return (
    <View className="px-6 pt-2 pb-24">
      {/* Header row */}
      <View className="flex-row justify-between items-center mb-4 px-1">
        <Text className="text-slate-800 dark:text-slate-100 text-xl font-black">Recurring Expenses</Text>
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          className="bg-primary px-4 py-2 rounded-2xl flex-row items-center gap-1"
        >
          <Ionicons name="add" size={18} color="white" />
          <Text className="text-white font-bold text-sm">Add</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View className="bg-white dark:bg-slate-800 rounded-[28px] p-12 items-center border border-dashed border-slate-200 dark:border-slate-700">
          <Ionicons name="repeat-outline" size={48} color="#cbd5e1" />
          <Text className="text-slate-400 dark:text-slate-500 text-center mt-4">No recurring expenses yet.</Text>
          <Text className="text-slate-300 dark:text-slate-600 text-xs text-center mt-1">
            Add rent, subscriptions, or any regular bills.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-slate-800 rounded-[24px] p-5 flex-row items-center shadow-sm border border-slate-50 dark:border-slate-700">
              <View className="bg-primary/10 dark:bg-primary/20 w-11 h-11 rounded-2xl items-center justify-center mr-4">
                <Ionicons name="repeat" size={20} color="#E98074" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 dark:text-slate-100 font-bold text-base" numberOfLines={1}>
                  {item.description}
                </Text>
                <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                  <FrequencyBadge frequency={item.frequency} />
                  <View className={`px-2 py-0.5 rounded-full ${item.splitType === 'PERSONAL' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${item.splitType === 'PERSONAL' ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {item.splitType === 'PERSONAL' ? 'Personal' : 'Split'}
                    </Text>
                  </View>
                  {item.category ? (
                    <Text className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wide">
                      {item.category}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-slate-300 dark:text-slate-600 text-xs mt-1">
                  Next: {item.nextDueDate}
                </Text>
              </View>
              <View className="items-end ml-3">
                <Text className="text-primary font-black text-lg">${parseFloat(item.amount).toFixed(2)}</Text>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  className="mt-2 p-1"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="stop-circle-outline" size={18} color="#f87171" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => !saving && setShowAdd(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-slate-800 rounded-t-[36px] p-6 pb-10">
            <View className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full self-center mb-5" />
            <Text className="text-slate-800 dark:text-slate-100 text-xl font-black mb-5">New Recurring Expense</Text>

            {/* Description */}
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1 ml-1">DESCRIPTION</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Monthly Rent"
              placeholderTextColor="#94a3b8"
              editable={!saving}
              maxLength={100}
              className="border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 text-base mb-4 bg-slate-50 dark:bg-slate-700"
            />

            {/* Amount */}
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1 ml-1">AMOUNT</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              editable={!saving}
              className="border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 text-base mb-4 bg-slate-50 dark:bg-slate-700"
            />

            {/* Frequency */}
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-2 ml-1">FREQUENCY</Text>
            <View className="flex-row gap-3 mb-4">
              {FREQUENCIES.map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFrequency(f)}
                  disabled={saving}
                  className="flex-1"
                >
                  <View className={`py-3 rounded-2xl items-center border ${
                    frequency === f ? 'bg-primary border-primary' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                  }`}>
                    <Text className={`font-bold text-sm ${frequency === f ? 'text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                      {f === 'WEEKLY' ? 'Weekly' : 'Monthly'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Split Type */}
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-2 ml-1">SPLIT</Text>
            <View className="flex-row gap-3 mb-4">
              {[
                { key: 'SPLIT', label: 'Split Equally', icon: 'people-outline', color: '#10b981' },
                { key: 'PERSONAL', label: 'Personal', icon: 'person-outline', color: '#f59e0b' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSplitType(opt.key)}
                  disabled={saving}
                  className="flex-1"
                >
                  <View className={`py-3 rounded-2xl items-center border flex-row justify-center gap-1 ${
                    splitType === opt.key
                      ? opt.key === 'SPLIT' ? 'bg-emerald-500 border-emerald-500' : 'bg-amber-500 border-amber-500'
                      : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                  }`}>
                    <Ionicons name={opt.icon} size={14} color={splitType === opt.key ? 'white' : '#94a3b8'} />
                    <Text className={`font-bold text-xs ${splitType === opt.key ? 'text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                      {opt.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-2 ml-1">CATEGORY (optional)</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  disabled={saving}
                >
                  <View className={`px-3 py-1.5 rounded-xl border ${
                    category === c ? 'bg-primary border-primary' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                  }`}>
                    <Text className={`text-xs font-bold ${category === c ? 'text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                      {c}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowAdd(false)}
                disabled={saving}
                className="flex-1 p-4 rounded-2xl items-center bg-slate-100 dark:bg-slate-700"
              >
                <Text className="text-slate-600 dark:text-slate-300 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdd}
                disabled={saving}
                className="flex-1 p-4 rounded-2xl items-center bg-primary"
              >
                {saving
                  ? <ActivityIndicator color="white" />
                  : <Text className="text-white font-bold">Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
