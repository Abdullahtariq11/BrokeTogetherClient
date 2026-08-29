import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import expenseService from '../../api/expenseService';
import homeService from '../../api/homeService';

const CATEGORIES = ['General', 'Groceries', 'Rent', 'Utilities', 'Entertainment'];

const SPLIT_TYPES = [
  { value: 'EQUAL',    label: 'Equal',    desc: 'Split evenly among members' },
  { value: 'PERSONAL', label: 'Personal', desc: 'Record for yourself only'   },
  { value: 'FIXED',   label: 'Fixed',    desc: "Set your share; split the rest" },
  { value: 'CUSTOM',  label: 'Custom',   desc: 'Enter exact amount per person' },
];

// Strips anything that isn't a digit or decimal point, and keeps only the first
// decimal point — keyboardType="decimal-pad" only picks the on-screen keyboard,
// it doesn't stop paste or a hardware keyboard from entering letters.
const sanitizeAmountInput = (text) => {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
};

export default function AddExpenseModal({ visible, onClose, homeId, onRefresh }) {
  const { userInfo } = useContext(AuthContext);

  const [amount, setAmount]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('General');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [splitType, setSplitType]     = useState('EQUAL');
  const [loading, setLoading]         = useState(false);

  const [allMembers, setAllMembers]           = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [fetchingMembers, setFetchingMembers] = useState(false);

  const [payerFixed, setPayerFixed]       = useState('');
  const [customAmounts, setCustomAmounts] = useState({});

  const otherMembers = allMembers.filter(m =>
    String(m.id) !== String(userInfo?.id) && m.name?.toLowerCase().trim() !== userInfo?.name?.toLowerCase().trim()
  );

  useEffect(() => {
    if (visible && homeId) loadMembers();
  }, [visible, homeId]);

  useEffect(() => {
    if (otherMembers.length > 0) setSelectedUserIds(otherMembers.map(m => m.id));
  }, [allMembers, userInfo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPayerFixed('');
    setCustomAmounts({});
  }, [splitType]);

  const loadMembers = async () => {
    setFetchingMembers(true);
    try {
      const data = await homeService.getMembers(homeId);
      setAllMembers(data || []);
    } catch { /* silent */ }
    finally { setFetchingMembers(false); }
  };

  const toggleMember = (id) =>
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── derived values ─────────────────────────────────────────────────────────
  const totalAmt        = parseFloat(amount || 0);
  const participantIds  = splitType === 'PERSONAL' ? [] : selectedUserIds;
  const totalPeople     = participantIds.length + 1;
  const equalShare      = totalPeople > 0 ? totalAmt / totalPeople : 0;
  const fixedRemainder  = totalAmt - parseFloat(payerFixed || 0);
  const fixedOtherShare = participantIds.length > 0 ? fixedRemainder / participantIds.length : 0;
  const customTotal     = Object.values(customAmounts).reduce((s, v) => s + parseFloat(v || 0), 0);
  const isBalanced      = Math.abs(customTotal - totalAmt) < 0.01;

  // ── validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    if (!amount || isNaN(totalAmt) || totalAmt <= 0)
      return ['Invalid Amount', 'Please enter a valid amount.'];
    if (!description || description.trim().length < 3)
      return ['Invalid Description', 'Please add a short description (min 3 chars).'];
    if (isCustomCategory && !category.trim())
      return ['Category Required', 'Enter a name for your custom category.'];
    if (splitType !== 'PERSONAL' && participantIds.length === 0)
      return ['Selection Required', 'Select at least one roommate.'];
    if (splitType === 'FIXED') {
      const pf = parseFloat(payerFixed || 0);
      if (isNaN(pf) || pf < 0 || pf > totalAmt)
        return ['Invalid Amount', "Your fixed share can't exceed the total."];
    }
    if (splitType === 'CUSTOM' && !isBalanced)
      return ['Amounts Mismatch', `Amounts must sum to $${totalAmt.toFixed(2)} (currently $${customTotal.toFixed(2)}).`];
    return null;
  };

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate();
    if (err) return Alert.alert(...err);

    setLoading(true);
    try {
      const payload = {
        totalAmount: totalAmt,
        description: description.trim(),
        category: category.trim(),
        homeId: Number(homeId),
        splitType,
        userIds: participantIds.map(Number),
      };

      if (splitType === 'FIXED') {
        payload.payerFixedAmount = parseFloat(payerFixed);
      }

      if (splitType === 'CUSTOM') {
        const exactSplits = { [Number(userInfo.id)]: parseFloat(customAmounts[userInfo.id] || 0) };
        for (const id of participantIds) exactSplits[Number(id)] = parseFloat(customAmounts[id] || 0);
        payload.exactSplits = exactSplits;
      }

      await expenseService.createSplitExpense(payload);
      Alert.alert('Success', 'Expense added!');
      resetForm();
      onRefresh();
      onClose();
    } catch (err) {
      Alert.alert('Submission Failed', err.response?.data?.message || 'Error saving bill.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount(''); setDescription(''); setCategory('General'); setIsCustomCategory(false);
    setSplitType('EQUAL'); setSelectedUserIds([]); setPayerFixed(''); setCustomAmounts({});
  };

  const handleClose = () => { resetForm(); onClose(); };

  // ── member row helper ──────────────────────────────────────────────────────
  const renderMemberRow = (member, opts = {}) => {
    const { showCustomInput = false, showFixedPreview = false, showEqualPreview = false } = opts;
    const isSelected = selectedUserIds.includes(member.id);
    return (
      <TouchableOpacity key={member.id} onPress={() => toggleMember(member.id)} className="mb-2">
        <View className={`flex-row items-center p-4 rounded-2xl border ${
          isSelected ? 'bg-primary/5 dark:bg-primary/10 border-primary/20' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600'
        }`}>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={22} color={isSelected ? '#E98074' : '#cbd5e1'}
          />
          <View className="ml-3 flex-1">
            <Text className={`text-sm font-semibold ${isSelected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
              {member.name}
            </Text>
          </View>
          {showEqualPreview && isSelected && amount ? (
            <Text className="text-primary font-bold text-sm">${equalShare.toFixed(2)}</Text>
          ) : null}
          {showFixedPreview && isSelected && payerFixed ? (
            <Text className="text-primary font-bold text-sm">${fixedOtherShare.toFixed(2)}</Text>
          ) : null}
          {showCustomInput && isSelected ? (
            <TextInput
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              value={customAmounts[member.id] || ''}
              onChangeText={(v) => setCustomAmounts(p => ({ ...p, [member.id]: sanitizeAmountInput(v) }))}
              onStartShouldSetResponder={() => true}
              className="w-20 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary font-bold text-sm text-right"
            />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-white dark:bg-slate-800 p-6 rounded-t-[40px] shadow-2xl max-h-[92%]">
          <View className="w-12 h-1 bg-slate-200 dark:bg-slate-600 self-center rounded-full mb-6" />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">
              New Expense
            </Text>

            {/* Amount */}
            <Text className="text-slate-500 dark:text-slate-400 mb-2 ml-1 font-semibold uppercase text-[10px] tracking-widest">Amount</Text>
            <TextInput
              placeholder="0.00" placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              className="bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 p-4 rounded-2xl text-2xl font-black text-primary mb-4"
              value={amount} onChangeText={(v) => setAmount(sanitizeAmountInput(v))}
            />

            {/* Description */}
            <Text className="text-slate-500 dark:text-slate-400 mb-2 ml-1 font-semibold uppercase text-[10px] tracking-widest">What was it for?</Text>
            <TextInput
              placeholder="e.g. Weekly Groceries" placeholderTextColor="#94a3b8"
              className="bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 p-4 rounded-2xl text-base text-slate-700 dark:text-slate-100 font-medium mb-6"
              value={description} onChangeText={setDescription}
            />

            {/* Category */}
            <View className="flex-row items-center justify-between mb-3 ml-1 mr-1">
              <Text className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-widest">Category</Text>
              <TouchableOpacity onPress={() => {
                const next = !isCustomCategory;
                setIsCustomCategory(next);
                setCategory(next ? '' : 'General');
              }}>
                <View className={`px-3 py-1 rounded-full border flex-row items-center ${
                  isCustomCategory ? 'bg-primary border-primary' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                }`}>
                  <Ionicons name="add" size={12} color={isCustomCategory ? '#ffffff' : '#E98074'} />
                  <Text className={`font-bold text-[11px] ml-1 ${isCustomCategory ? 'text-white' : 'text-primary'}`}>Custom</Text>
                </View>
              </TouchableOpacity>
            </View>
            {isCustomCategory ? (
              <TextInput
                placeholder="Enter category name" placeholderTextColor="#94a3b8"
                maxLength={30}
                autoFocus
                className="bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 p-4 rounded-2xl text-base text-slate-700 dark:text-slate-100 font-medium mb-6"
                value={category} onChangeText={setCategory}
              />
            ) : (
              <View className="flex-row flex-wrap gap-2 mb-6">
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat} onPress={() => setCategory(cat)}>
                    <View className={`px-5 py-2 rounded-full border ${
                      category === cat ? 'bg-primary border-primary' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                    }`}>
                      <Text className={`font-bold text-sm ${category === cat ? 'text-white' : 'text-slate-500 dark:text-slate-300'}`}>{cat}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Split type */}
            <Text className="text-slate-500 dark:text-slate-400 mb-3 ml-1 font-semibold uppercase text-[10px] tracking-widest">How to split</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {SPLIT_TYPES.map(st => (
                <TouchableOpacity
                  key={st.value} onPress={() => setSplitType(st.value)}
                  className="flex-1 min-w-[44%]"
                >
                  <View className={`p-3 rounded-2xl border ${
                    splitType === st.value
                      ? 'bg-primary/10 dark:bg-primary/20 border-primary/40'
                      : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                  }`}>
                    <Text className={`text-sm font-bold ${splitType === st.value ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                      {st.label}
                    </Text>
                    <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{st.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Paid by */}
            <Text className="text-slate-500 dark:text-slate-400 mb-3 ml-1 font-semibold uppercase text-[10px] tracking-widest">Paid by</Text>
            <View className="flex-row items-center p-4 rounded-2xl mb-4 bg-primary/5 dark:bg-primary/10 border border-primary/20">
              <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mr-3">
                <Text className="text-primary font-bold">{userInfo?.name?.charAt(0).toUpperCase() || '?'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 dark:text-slate-100 font-bold">{userInfo?.name} (You)</Text>
                <Text className="text-[10px] text-primary font-bold uppercase tracking-wide">Payer · auto included</Text>
              </View>
              {splitType === 'EQUAL' && amount ? (
                <Text className="text-primary font-bold">${equalShare.toFixed(2)}</Text>
              ) : splitType === 'PERSONAL' && amount ? (
                <Text className="text-primary font-bold">${totalAmt.toFixed(2)}</Text>
              ) : splitType === 'FIXED' ? (
                <TextInput
                  keyboardType="decimal-pad" placeholder="Your share" placeholderTextColor="#94a3b8"
                  value={payerFixed} onChangeText={(v) => setPayerFixed(sanitizeAmountInput(v))}
                  className="w-28 px-3 py-1.5 rounded-xl border border-primary/30 bg-white dark:bg-slate-700 text-primary font-bold text-sm text-right"
                />
              ) : null}
              {/* CUSTOM payer row input */}
              {splitType === 'CUSTOM' ? (
                <TextInput
                  keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#94a3b8"
                  value={customAmounts[userInfo?.id] || ''}
                  onChangeText={(v) => setCustomAmounts(p => ({ ...p, [userInfo.id]: sanitizeAmountInput(v) }))}
                  className="w-20 px-2 py-1 rounded-xl border border-primary/30 bg-white dark:bg-slate-700 text-primary font-bold text-sm text-right"
                />
              ) : null}
            </View>

            {/* PERSONAL notice */}
            {splitType === 'PERSONAL' && (
              <View className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4 mb-4">
                <Text className="text-slate-400 dark:text-slate-500 text-sm text-center">
                  This expense will only be recorded for you — no one else will owe anything.
                </Text>
              </View>
            )}

            {/* FIXED: remainder preview */}
            {splitType === 'FIXED' && payerFixed && participantIds.length > 0 && (
              <View className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-3 mb-4">
                <Text className="text-slate-400 dark:text-slate-500 text-xs text-center">
                  Remainder ${fixedRemainder.toFixed(2)} ÷ {participantIds.length} = <Text className="text-primary font-bold">${fixedOtherShare.toFixed(2)} each</Text>
                </Text>
              </View>
            )}

            {/* Member selection (EQUAL / FIXED / CUSTOM) */}
            {splitType !== 'PERSONAL' && (
              <>
                <Text className="text-slate-500 dark:text-slate-400 mb-3 ml-1 font-semibold uppercase text-[10px] tracking-widest">
                  {splitType === 'EQUAL' ? `Split with (${otherMembers.length} roommates)` : 'Include members'}
                </Text>
                <View className="mb-6">
                  {fetchingMembers ? (
                    <ActivityIndicator color="#E98074" />
                  ) : otherMembers.length === 0 ? (
                    <View className="bg-slate-50 dark:bg-slate-700 p-6 rounded-2xl items-center">
                      <Text className="text-slate-400 dark:text-slate-500 text-center">No other roommates yet</Text>
                    </View>
                  ) : (
                    otherMembers.map(m => renderMemberRow(m, {
                      showEqualPreview: splitType === 'EQUAL',
                      showFixedPreview: splitType === 'FIXED',
                      showCustomInput:  splitType === 'CUSTOM',
                    }))
                  )}
                </View>
              </>
            )}

            {/* CUSTOM balance indicator */}
            {splitType === 'CUSTOM' && amount ? (
              <View className={`rounded-2xl p-3 mb-4 ${isBalanced ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                <Text className={`text-xs font-semibold text-center ${isBalanced ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isBalanced ? '✓ Amounts balance' : `Assigned $${customTotal.toFixed(2)} of $${totalAmt.toFixed(2)}`}
                </Text>
              </View>
            ) : null}

            {/* EQUAL summary */}
            {splitType === 'EQUAL' && amount && participantIds.length > 0 ? (
              <View className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4 mb-6">
                <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">
                  Split <Text className="font-bold text-slate-700 dark:text-slate-200">${totalAmt.toFixed(2)}</Text> between{' '}
                  <Text className="font-bold text-slate-700 dark:text-slate-200">{totalPeople} people</Text>{' '}={' '}
                  <Text className="font-bold text-primary">${equalShare.toFixed(2)} each</Text>
                </Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || (splitType !== 'PERSONAL' && otherMembers.length === 0)}
              className="mb-4"
            >
              <View className={`p-5 rounded-2xl items-center ${
                loading || (splitType !== 'PERSONAL' && otherMembers.length === 0)
                  ? 'bg-slate-300 dark:bg-slate-600'
                  : 'bg-primary'
              }`}>
                {loading ? <ActivityIndicator color="white" /> : (
                  <Text className={`font-black text-lg ${
                    (splitType !== 'PERSONAL' && otherMembers.length === 0)
                      ? 'text-slate-500 dark:text-slate-300'
                      : 'text-white'
                  }`}>Add Expense</Text>
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
