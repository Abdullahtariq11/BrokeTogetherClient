import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import shoppingService from '../../api/shoppingService';
import homeService from '../../api/homeService';

const SPLIT_TYPES = [
  { value: 'EQUAL',    label: 'Equal',    desc: 'Split evenly' },
  { value: 'PERSONAL', label: 'Personal', desc: 'Only you'     },
  { value: 'FIXED',    label: 'Fixed',    desc: 'Set your share' },
  { value: 'CUSTOM',   label: 'Custom',   desc: 'Per-person amounts' },
];

/* ─── Convert Modal ──────────────────────────────────────────── */
function ConvertModal({ item, homeId, onConvert, onClose, submitting }) {
  const { userInfo } = useContext(AuthContext);
  const [splitType, setSplitType]         = useState('EQUAL');
  const [allMembers, setAllMembers]       = useState([]);
  const [fetchingMembers, setFetchingMembers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [payerFixed, setPayerFixed]       = useState('');
  const [customAmounts, setCustomAmounts] = useState({});

  const totalAmt = parseFloat(item.price || 0);
  const otherMembers = allMembers.filter(m =>
    String(m.id) !== String(userInfo?.id) &&
    m.name?.toLowerCase().trim() !== userInfo?.name?.toLowerCase().trim()
  );

  useEffect(() => {
    let active = true;
    setFetchingMembers(true);
    homeService.getMembers(homeId)
      .then(data => { if (active) setAllMembers(data || []); })
      .catch(() => {})
      .finally(() => { if (active) setFetchingMembers(false); });
    return () => { active = false; };
  }, [homeId]);

  useEffect(() => {
    if (otherMembers.length > 0) setSelectedUserIds(otherMembers.map(m => m.id));
  }, [allMembers]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPayerFixed(''); setCustomAmounts({});
  }, [splitType]);

  const toggleMember = (id) =>
    setSelectedUserIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const participantIds = splitType === 'PERSONAL' ? [] : selectedUserIds;
  const totalPeople    = participantIds.length + 1;
  const equalShare     = totalPeople > 0 ? totalAmt / totalPeople : 0;
  const fixedRemainder = totalAmt - parseFloat(payerFixed || 0);
  const fixedOther     = participantIds.length > 0 ? fixedRemainder / participantIds.length : 0;
  const customTotal    = Object.values(customAmounts).reduce((s, v) => s + parseFloat(v || 0), 0);
  const isBalanced     = Math.abs(customTotal - totalAmt) < 0.01;

  const handleSubmit = () => {
    if (splitType !== 'PERSONAL' && participantIds.length === 0)
      return Alert.alert('Selection Required', 'Select at least one roommate.');
    if (splitType === 'FIXED') {
      const pf = parseFloat(payerFixed || 0);
      if (isNaN(pf) || pf < 0 || pf > totalAmt)
        return Alert.alert('Invalid Amount', "Your fixed share can't exceed the total.");
    }
    if (splitType === 'CUSTOM' && !isBalanced)
      return Alert.alert('Amounts Mismatch', `Amounts must sum to $${totalAmt.toFixed(2)}.`);

    const payload = { splitType, userIds: participantIds.map(Number) };
    if (splitType === 'FIXED') payload.payerFixedAmount = parseFloat(payerFixed);
    if (splitType === 'CUSTOM') {
      const exactSplits = { [Number(userInfo.id)]: parseFloat(customAmounts[userInfo.id] || 0) };
      for (const id of participantIds) exactSplits[Number(id)] = parseFloat(customAmounts[id] || 0);
      payload.exactSplits = exactSplits;
    }
    onConvert(payload);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => !submitting && onClose()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/60">
        <View className="bg-white dark:bg-slate-800 rounded-t-[32px] px-5 pt-5 pb-8 max-h-[88%]">
          <View className="w-10 h-1 bg-slate-200 dark:bg-slate-600 self-center rounded-full mb-4" />

          {/* Header */}
          <View className="flex-row items-center mb-4">
            <View className="bg-amber-50 dark:bg-amber-900/30 p-2.5 rounded-2xl mr-3">
              <Ionicons name="receipt-outline" size={20} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="font-black text-slate-800 dark:text-slate-100 text-base" numberOfLines={1}>{item.name}</Text>
              {item.price != null && <Text className="text-primary font-bold text-sm">${totalAmt.toFixed(2)}</Text>}
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Split type selector */}
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 ml-0.5">How to split</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {SPLIT_TYPES.map(st => (
                <TouchableOpacity key={st.value} onPress={() => setSplitType(st.value)} className="flex-1 min-w-[44%]">
                  <View className={`p-3 rounded-2xl border ${
                    splitType === st.value
                      ? 'bg-primary/10 dark:bg-primary/20 border-primary/40'
                      : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                  }`}>
                    <Text className={`text-sm font-bold ${splitType === st.value ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{st.label}</Text>
                    <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{st.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payer row */}
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 ml-0.5">Paid by</Text>
            <View className="flex-row items-center p-3.5 rounded-2xl mb-3 bg-primary/5 dark:bg-primary/10 border border-primary/20">
              <View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-3">
                <Text className="text-primary font-bold text-xs">{userInfo?.name?.charAt(0).toUpperCase() || '?'}</Text>
              </View>
              <Text className="flex-1 text-slate-800 dark:text-slate-100 font-bold text-sm">{userInfo?.name} (You)</Text>
              {splitType === 'EQUAL' && totalAmt > 0
                ? <Text className="text-primary font-bold text-sm">${equalShare.toFixed(2)}</Text>
                : splitType === 'PERSONAL'
                ? <Text className="text-primary font-bold text-sm">${totalAmt.toFixed(2)}</Text>
                : splitType === 'FIXED'
                ? (
                  <TextInput
                    keyboardType="decimal-pad" placeholder="Your share" placeholderTextColor="#94a3b8"
                    value={payerFixed} onChangeText={setPayerFixed}
                    className="w-24 px-2 py-1.5 rounded-xl border border-primary/30 bg-white dark:bg-slate-700 text-primary font-bold text-sm text-right"
                  />
                ) : splitType === 'CUSTOM' ? (
                  <TextInput
                    keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#94a3b8"
                    value={customAmounts[userInfo?.id] || ''}
                    onChangeText={v => setCustomAmounts(p => ({ ...p, [userInfo.id]: v }))}
                    className="w-20 px-2 py-1.5 rounded-xl border border-primary/30 bg-white dark:bg-slate-700 text-primary font-bold text-sm text-right"
                  />
                ) : null}
            </View>

            {/* PERSONAL notice */}
            {splitType === 'PERSONAL' && (
              <View className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-3 mb-4">
                <Text className="text-slate-400 dark:text-slate-500 text-xs text-center">Recorded only for you — no one else owes anything.</Text>
              </View>
            )}

            {/* FIXED remainder */}
            {splitType === 'FIXED' && payerFixed && participantIds.length > 0 && (
              <View className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-3 mb-3">
                <Text className="text-xs text-slate-400 dark:text-slate-500 text-center">
                  Remainder ${fixedRemainder.toFixed(2)} ÷ {participantIds.length} = <Text className="text-primary font-bold">${fixedOther.toFixed(2)} each</Text>
                </Text>
              </View>
            )}

            {/* Member selection */}
            {splitType !== 'PERSONAL' && (
              <>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 ml-0.5">Include members</Text>
                {fetchingMembers ? (
                  <ActivityIndicator color="#E98074" className="my-4" />
                ) : otherMembers.length === 0 ? (
                  <View className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl items-center mb-4">
                    <Text className="text-slate-400 dark:text-slate-500 text-sm">No other roommates</Text>
                  </View>
                ) : (
                  <View className="mb-4">
                    {otherMembers.map(m => {
                      const sel = selectedUserIds.includes(m.id);
                      return (
                        <TouchableOpacity key={m.id} onPress={() => toggleMember(m.id)} className="mb-2">
                          <View className={`flex-row items-center p-3.5 rounded-2xl border ${sel ? 'bg-primary/5 dark:bg-primary/10 border-primary/20' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600'}`}>
                            <Ionicons name={sel ? 'checkbox' : 'square-outline'} size={20} color={sel ? '#E98074' : '#cbd5e1'} />
                            <Text className={`ml-3 flex-1 text-sm font-semibold ${sel ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>{m.name}</Text>
                            {splitType === 'EQUAL' && sel && totalAmt > 0
                              ? <Text className="text-primary font-bold text-sm">${equalShare.toFixed(2)}</Text>
                              : splitType === 'FIXED' && sel && payerFixed
                              ? <Text className="text-primary font-bold text-sm">${fixedOther.toFixed(2)}</Text>
                              : splitType === 'CUSTOM' && sel
                              ? (
                                <TextInput
                                  keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#94a3b8"
                                  value={customAmounts[m.id] || ''}
                                  onChangeText={v => setCustomAmounts(p => ({ ...p, [m.id]: v }))}
                                  onStartShouldSetResponder={() => true}
                                  className="w-20 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary font-bold text-sm text-right"
                                />
                              ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* CUSTOM balance */}
            {splitType === 'CUSTOM' && totalAmt > 0 && (
              <View className={`rounded-2xl p-3 mb-4 ${isBalanced ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                <Text className={`text-xs font-semibold text-center ${isBalanced ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isBalanced ? '✓ Amounts balance' : `Assigned $${customTotal.toFixed(2)} of $${totalAmt.toFixed(2)}`}
                </Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
              <View className={`p-4 rounded-2xl items-center mb-3 ${submitting ? 'bg-slate-300 dark:bg-slate-600' : 'bg-primary'}`}>
                {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base">Convert to Expense</Text>}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => !submitting && onClose()} disabled={submitting} className="items-center pb-2">
              <Text className="text-slate-400 dark:text-slate-500 font-bold">Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Edit Modal ─────────────────────────────────────────────── */
function EditModal({ item, onSave, onClose, saving }) {
  const [editName, setEditName] = useState(item.name);
  const [editPrice, setEditPrice] = useState(item.price != null ? String(item.price) : '');

  const handleSave = () => {
    if (!editName.trim()) return Alert.alert('Error', 'Item name cannot be empty.');
    onSave(item.id, editName.trim(), editPrice);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => !saving && onClose()}>
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full shadow-2xl">
          <Text className="text-slate-800 dark:text-slate-100 text-xl font-black mb-4">Edit Item</Text>

          <TextInput
            autoFocus
            value={editName}
            onChangeText={setEditName}
            placeholder="Item name"
            placeholderTextColor="#94a3b8"
            editable={!saving}
            className="border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 text-base mb-3 bg-slate-50 dark:bg-slate-700"
          />
          <TextInput
            value={editPrice}
            onChangeText={setEditPrice}
            placeholder="Price (optional)"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            editable={!saving}
            className="border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 text-base mb-5 bg-slate-50 dark:bg-slate-700"
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              disabled={saving}
              className="flex-1 p-4 rounded-2xl items-center bg-slate-100 dark:bg-slate-700"
            >
              <Text className="text-slate-600 dark:text-slate-300 font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !editName.trim()}
              className="flex-1 p-4 rounded-2xl items-center bg-primary"
            >
              {saving
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-bold">Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Item Row ───────────────────────────────────────────────── */
function ItemRow({ item, onMark, onEdit, onDelete, onConvert, markingId, deletingId, convertingId }) {
  const isMarking    = markingId    === item.id;
  const isDeleting   = deletingId   === item.id;
  const isConverting = convertingId === item.id;
  const busy = isMarking || isDeleting || isConverting;

  const canConvert = item.isChecked && item.price != null && !item.convertedToExpense;

  return (
    <View className={`bg-white dark:bg-slate-800 rounded-[24px] p-4 mb-3 flex-row items-center shadow-sm border border-slate-50 dark:border-slate-700 ${item.isChecked ? 'opacity-70' : ''}`}>
      {/* Check toggle */}
      <TouchableOpacity
        onPress={() => onMark(item)}
        disabled={isMarking || busy}
        className="mr-3"
      >
        {isMarking
          ? <ActivityIndicator size="small" color="#10b981" />
          : <Ionicons
              name={item.isChecked ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={item.isChecked ? '#10b981' : '#cbd5e1'}
            />}
      </TouchableOpacity>

      {/* Name + meta */}
      <View className="flex-1 mr-2">
        <Text
          className={`font-semibold text-base ${item.isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.checkedByName ? (
          <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">by {item.checkedByName}</Text>
        ) : null}
      </View>

      {/* Price */}
      {item.price != null && (
        <Text className="text-primary font-black text-base mr-2">
          ${parseFloat(item.price).toFixed(2)}
        </Text>
      )}

      {/* Convert to expense */}
      {canConvert && (
        <TouchableOpacity
          onPress={() => onConvert(item)}
          disabled={busy}
          className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded-xl mr-1"
        >
          {isConverting
            ? <ActivityIndicator size="small" color="#f59e0b" />
            : <Ionicons name="receipt-outline" size={18} color="#f59e0b" />}
        </TouchableOpacity>
      )}

      {/* Edit — only for unchecked */}
      {!item.isChecked && (
        <TouchableOpacity
          onPress={() => onEdit(item)}
          disabled={busy}
          className="bg-sky-50 dark:bg-sky-900/30 p-2 rounded-xl mr-1"
        >
          <Ionicons name="pencil-outline" size={18} color="#38bdf8" />
        </TouchableOpacity>
      )}

      {/* Delete */}
      <TouchableOpacity
        onPress={() => onDelete(item)}
        disabled={busy}
        className="bg-rose-50 dark:bg-rose-900/30 p-2 rounded-xl"
      >
        {isDeleting
          ? <ActivityIndicator size="small" color="#f43f5e" />
          : <Ionicons name="trash-outline" size={18} color="#f43f5e" />}
      </TouchableOpacity>
    </View>
  );
}

/* ─── ShoppingTab ────────────────────────────────────────────── */
export default function ShoppingTab({ homeId, refreshTrigger }) {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  // add-item form
  const [name,    setName]    = useState('');
  const [price,   setPrice]   = useState('');
  const [adding,  setAdding]  = useState(false);

  // per-item loading states
  const [markingId,    setMarkingId]    = useState(null);
  const [deletingId,   setDeletingId]   = useState(null);
  const [convertingId, setConvertingId] = useState(null);
  const [savingId,     setSavingId]     = useState(null);

  // modal targets
  const [editTarget,    setEditTarget]    = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);
  const [convertLoading, setConvertLoading] = useState(null);

  /* ── data loading ─────────────────────────────────────── */
  const loadItems = useCallback(async () => {
    try {
      const data = await shoppingService.getItems(homeId);
      setItems(data || []);
    } catch {
      Alert.alert('Error', 'Failed to load shopping list.');
    } finally {
      setLoading(false);
    }
  }, [homeId]);

  useEffect(() => {
    loadItems();
  }, [loadItems, refreshTrigger]);

  /* ── add ──────────────────────────────────────────────── */
  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      await shoppingService.addItem(name.trim(), price || null, homeId);
      setName('');
      setPrice('');
      await loadItems();
    } catch {
      Alert.alert('Error', 'Failed to add item.');
    } finally {
      setAdding(false);
    }
  };

  /* ── mark ─────────────────────────────────────────────── */
  const handleMark = async (item) => {
    if (markingId === item.id) return;
    setMarkingId(item.id);
    try {
      await shoppingService.markItem(item.id);
      await loadItems();
    } catch {
      Alert.alert('Error', 'Failed to update item.');
    } finally {
      setMarkingId(null);
    }
  };

  /* ── edit ─────────────────────────────────────────────── */
  const handleEdit = async (itemId, newName, newPrice) => {
    setSavingId(itemId);
    try {
      await shoppingService.editItem(itemId, newName, newPrice, homeId);
      setEditTarget(null);
      await loadItems();
    } catch {
      Alert.alert('Error', 'Failed to update item.');
    } finally {
      setSavingId(null);
    }
  };

  /* ── delete ───────────────────────────────────────────── */
  const openDelete = (item) => {
    Alert.alert(
      'Remove Item',
      `Remove "${item.name}" from the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(item.id);
            try {
              await shoppingService.deleteItem(item.id);
              await loadItems();
            } catch {
              Alert.alert('Error', 'Failed to remove item.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  /* ── convert ──────────────────────────────────────────── */
  const openConvert = (item) => {
    if (!item.isChecked) {
      Alert.alert('Info', 'Mark the item as purchased first.');
      return;
    }
    if (item.price == null) {
      Alert.alert('Info', 'Add a price to the item before converting.');
      return;
    }
    if (item.convertedToExpense) {
      Alert.alert('Info', 'This item has already been converted to an expense.');
      return;
    }
    setConvertTarget(item);
  };

  const handleConvert = async (payload) => {
    const item = convertTarget;
    setConvertLoading('submitting');
    setConvertingId(item.id);
    try {
      await shoppingService.convertToExpense(item.id, payload);
      setConvertTarget(null);
      Alert.alert('Success', 'Expense recorded!');
      await loadItems();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to convert item.');
    } finally {
      setConvertLoading(null);
      setConvertingId(null);
    }
  };

  /* ── render ───────────────────────────────────────────── */
  const unchecked = items.filter((i) => !i.isChecked);
  const checked   = items.filter((i) =>  i.isChecked);

  return (
    <View className="px-6 pb-6">
      {/* Add item row */}
      <View className="bg-white dark:bg-slate-800 rounded-[24px] p-4 mb-4 shadow-sm border border-slate-50 dark:border-slate-700">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Item name…"
          placeholderTextColor="#94a3b8"
          className="border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 text-sm mb-2 bg-slate-50 dark:bg-slate-700"
        />
        <View className="flex-row gap-2">
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="Price (optional)"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            className="flex-1 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 text-sm bg-slate-50 dark:bg-slate-700"
          />
          <TouchableOpacity
            testID="shopping-add-button"
            onPress={handleAdd}
            disabled={adding || !name.trim()}
            className="px-5 rounded-2xl items-center justify-center"
          >
            <View className={`absolute top-0 bottom-0 left-0 right-0 rounded-2xl ${adding || !name.trim() ? 'bg-primary/40' : 'bg-primary'}`} />
            {adding
              ? <ActivityIndicator size="small" color="white" />
              : <Ionicons name="add" size={22} color="white" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View className="items-center py-10">
          <ActivityIndicator size="large" color="#E98074" />
          <Text className="text-slate-400 dark:text-slate-500 mt-3 text-sm">Loading list…</Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <View className="bg-white dark:bg-slate-800 rounded-[30px] py-12 items-center border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Ionicons name="cart-outline" size={48} color="#cbd5e1" />
          <Text className="text-slate-400 dark:text-slate-500 text-center mt-4 px-6">
            Your shopping list is empty — add an item above!
          </Text>
          <TouchableOpacity onPress={loadItems} className="mt-3">
            <Text className="text-primary font-semibold text-xs">Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* To buy */}
      {!loading && unchecked.length > 0 && (
        <View className="mb-2">
          {unchecked.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onMark={handleMark}
              onEdit={setEditTarget}
              onDelete={openDelete}
              onConvert={openConvert}
              markingId={markingId}
              deletingId={deletingId}
              convertingId={convertingId}
            />
          ))}
        </View>
      )}

      {/* Purchased */}
      {!loading && checked.length > 0 && (
        <View>
          <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 ml-1">
            Purchased
          </Text>
          {checked.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onMark={handleMark}
              onEdit={setEditTarget}
              onDelete={openDelete}
              onConvert={openConvert}
              markingId={markingId}
              deletingId={deletingId}
              convertingId={convertingId}
            />
          ))}
        </View>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          item={editTarget}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
          saving={savingId === editTarget.id}
        />
      )}

      {/* Convert Modal */}
      {convertTarget && (
        <ConvertModal
          item={convertTarget}
          homeId={homeId}
          submitting={!!convertLoading}
          onConvert={handleConvert}
          onClose={() => { if (!convertLoading) setConvertTarget(null); }}
        />
      )}
    </View>
  );
}
