import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import shoppingService from '../../api/shoppingService';

/* ─── Convert Modal ──────────────────────────────────────────── */
function ConvertModal({ item, onSplit, onPersonal, onClose, loading }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => !loading && onClose()}>
      <View className="flex-1 justify-end pb-6 px-4 bg-black/50">
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl">
          {/* header */}
          <View className="flex-row items-center mb-1">
            <View className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-2xl mr-3">
              <Ionicons name="receipt-outline" size={20} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="font-black text-slate-800 dark:text-slate-100 text-base" numberOfLines={1}>
                {item.name}
              </Text>
              {item.price != null && (
                <Text className="text-primary font-bold text-sm">
                  ${parseFloat(item.price).toFixed(2)}
                </Text>
              )}
            </View>
          </View>

          <Text className="text-slate-400 dark:text-slate-500 text-xs mt-3 mb-5">
            How would you like to record this expense?
          </Text>

          {/* Split equally */}
          <TouchableOpacity
            onPress={onSplit}
            disabled={!!loading}
            className="flex-row items-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-100 dark:border-emerald-800 mb-3"
          >
            <View className="bg-emerald-100 dark:bg-emerald-800/50 p-2 rounded-xl mr-4">
              <Ionicons name="people-outline" size={20} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">Split Equally</Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Divide the cost among all members</Text>
            </View>
            {loading === 'split' && <ActivityIndicator size="small" color="#10b981" />}
          </TouchableOpacity>

          {/* Personal */}
          <TouchableOpacity
            onPress={onPersonal}
            disabled={!!loading}
            className="flex-row items-center p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-100 dark:border-amber-800 mb-4"
          >
            <View className="bg-amber-100 dark:bg-amber-800/50 p-2 rounded-xl mr-4">
              <Ionicons name="person-outline" size={20} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">My Expense</Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Record as your personal expense</Text>
            </View>
            {loading === 'personal' && <ActivityIndicator size="small" color="#f59e0b" />}
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={onClose}
            disabled={!!loading}
            className="py-3 rounded-2xl items-center bg-slate-100 dark:bg-slate-700"
          >
            <Text className="text-slate-500 dark:text-slate-300 font-semibold text-sm">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  const [convertLoading, setConvertLoading] = useState(null); // 'split' | 'personal' | null

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

  const handleConvert = async (split) => {
    const item = convertTarget;
    const key = split ? 'split' : 'personal';
    setConvertLoading(key);
    setConvertingId(item.id);
    try {
      await shoppingService.convertToExpense(item.id, split);
      setConvertTarget(null);
      Alert.alert('Success', split ? 'Expense added and split among all members!' : 'Recorded as your personal expense.');
      await loadItems();
    } catch (err) {
      Alert.alert('Error', 'Failed to convert item.');
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
          loading={convertLoading}
          onSplit={() => handleConvert(true)}
          onPersonal={() => handleConvert(false)}
          onClose={() => { if (!convertLoading) setConvertTarget(null); }}
        />
      )}
    </View>
  );
}
