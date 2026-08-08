import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert, TextInput, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { AuthContext } from '../context/AuthContext';
import homeService from '../api/homeService';
import expenseService from '../api/expenseService';
import HomeSetupScreen from './home/HomeSetupScreen';
import AddExpenseModal from './expense/AddExpenseModal';
import SettleScreen from './home/SettleScreen';
import ShoppingTab from './shopping/ShoppingTab';
import RecurringTab from './expense/RecurringTab';
import AnalyticsTab from './expense/AnalyticsTab';

const HOME_LIMIT_FREE = 1;
const HOME_LIMIT_PREMIUM = 3;

export default function DashboardScreen({ navigation }) {
    const { userInfo, logout, isGuest, exitGuestMode } = useContext(AuthContext);
    const isPremium = userInfo?.isPremium ?? false;
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    // View Management
    const [currentView, setCurrentView] = useState('dashboard');

    // Data State
    const [loading, setLoading] = useState(!isGuest);
    const [refreshing, setRefreshing] = useState(false);
    const [allHomes, setAllHomes] = useState([]);
    const [myHome, setMyHome] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [myBalance, setMyBalance] = useState(0);
    const [memberCount, setMemberCount] = useState(0);

    // Modal State
    const [isModalVisible, setModalVisible] = useState(false);

    // Home switcher state
    const [showHomeSwitcher, setShowHomeSwitcher] = useState(false);
    const [showAddHome, setShowAddHome] = useState(false);
    const [addHomeMode, setAddHomeMode] = useState('create'); // 'create' | 'join'
    const [addHomeInput, setAddHomeInput] = useState('');
    const [addHomeLoading, setAddHomeLoading] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState('activity');
    const [deletingExpenseId, setDeletingExpenseId] = useState(null);

    const homeLimit = isPremium ? HOME_LIMIT_PREMIUM : HOME_LIMIT_FREE;
    const atHomeLimit = allHomes.length >= homeLimit;

    // Ref to always have current myHome inside the loadDashboardData callback
    const myHomeRef = useRef(null);

    const loadDashboardData = useCallback(async (keepActiveHome = null) => {
        if (isGuest) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            const homes = await homeService.getMyHomes();
            const homesList = homes ? Array.from(homes) : [];
            setAllHomes(homesList);
            if (homesList.length > 0) {
                const currentHome = myHomeRef.current;
                const activeHome = keepActiveHome
                    ? homesList.find(h => h.id === keepActiveHome.id) || homesList[0]
                    : (currentHome ? homesList.find(h => h.id === currentHome.id) || homesList[0] : homesList[0]);
                myHomeRef.current = activeHome;
                setMyHome(activeHome);

                const [balanceResult, expensesResult] = await Promise.allSettled([
                    expenseService.getHomeBalances(activeHome.id),
                    expenseService.getHomeExpenses(activeHome.id, 0, 20),
                ]);

                if (balanceResult.status === 'fulfilled') {
                    const balanceMap = balanceResult.value;
                    if (userInfo?.id && balanceMap) {
                        const rawValue = balanceMap[userInfo.id] || balanceMap[userInfo.id.toString()] || 0;
                        setMyBalance(parseFloat(rawValue));
                        setMemberCount(Object.keys(balanceMap).length);
                    }
                }

                if (expensesResult.status === 'fulfilled') {
                    const data = expensesResult.value;
                    const expenseList = Array.isArray(data) ? data : (data?.expenses || []);
                    setExpenses(expenseList);
                }
            }
        } catch {
            // Dashboard load failed
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userInfo?.id, isGuest]); // eslint-disable-line react-hooks/exhaustive-deps

    const switchHome = (home) => {
        myHomeRef.current = home;
        setMyHome(home);
        setShowHomeSwitcher(false);
        setActiveTab('activity');
        setExpenses([]);
        setMyBalance(0);
        setMemberCount(0);
        loadDashboardData(home);
    };

    const handleAddHome = async () => {
        if (!addHomeInput.trim()) return Alert.alert('Error', 'Please enter a name or code.');
        setAddHomeLoading(true);
        try {
            if (addHomeMode === 'join') {
                await homeService.joinHome(addHomeInput.trim());
            } else {
                await homeService.createHome(addHomeInput.trim());
            }
            setShowAddHome(false);
            setAddHomeInput('');
            Alert.alert('Success', addHomeMode === 'join' ? 'Joined household!' : 'Household created!');
            loadDashboardData();
        } catch (err) {
            Alert.alert('Error', typeof err === 'string' ? err : 'Something went wrong. Please try again.');
        } finally {
            setAddHomeLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const copyInviteCode = async () => {
        await Clipboard.setStringAsync(myHome.inviteCode);
        Alert.alert("Copied!", "Invite code copied to clipboard.");
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

    const handleDeleteExpense = (expense) => {
        Alert.alert(
            'Delete Expense',
            `Delete "${expense.description}"? This will recalculate all balances.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        setDeletingExpenseId(expense.id);
                        try {
                            await expenseService.deleteExpense(expense.id);
                            loadDashboardData();
                        } catch {
                            Alert.alert('Error', 'Failed to delete expense. Please try again.');
                        } finally {
                            setDeletingExpenseId(null);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
                <ActivityIndicator size="large" color="#E98074" />
                <Text className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Syncing Household...</Text>
            </View>
        );
    }

    if (isGuest) {
        return (
            <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900" contentContainerStyle={{ flexGrow: 1 }}>
                <View className="bg-primary p-8 pt-16 rounded-b-[40px] shadow-lg">
                    <Text className="text-white/70 font-medium tracking-tight">Welcome to</Text>
                    <Text className="text-white text-3xl font-black">BrokeTogether</Text>
                    <Text className="text-white/80 mt-2">You're browsing as a guest</Text>
                </View>

                <View className="p-6">
                    <Text className="text-slate-800 dark:text-slate-100 text-xl font-black mb-3">What you can do</Text>
                    <View className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 mb-3">
                        <View className="flex-row items-center mb-3">
                            <View className="bg-primary/10 dark:bg-primary/20 p-3 rounded-2xl mr-3">
                                <Ionicons name="home" size={22} color="#E98074" />
                            </View>
                            <Text className="text-slate-800 dark:text-slate-100 font-bold flex-1">Create or join a household</Text>
                        </View>
                        <View className="flex-row items-center mb-3">
                            <View className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-2xl mr-3">
                                <Ionicons name="receipt" size={22} color="#10b981" />
                            </View>
                            <Text className="text-slate-800 dark:text-slate-100 font-bold flex-1">Track shared expenses</Text>
                        </View>
                        <View className="flex-row items-center mb-3">
                            <View className="bg-sky-50 dark:bg-sky-900/30 p-3 rounded-2xl mr-3">
                                <Ionicons name="calculator" size={22} color="#0ea5e9" />
                            </View>
                            <Text className="text-slate-800 dark:text-slate-100 font-bold flex-1">Auto-calculate balances</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-2xl mr-3">
                                <Ionicons name="checkmark-done" size={22} color="#f59e0b" />
                            </View>
                            <Text className="text-slate-800 dark:text-slate-100 font-bold flex-1">Settle up easily</Text>
                        </View>
                    </View>

                    <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-dashed border-slate-200 dark:border-slate-700 items-center mt-2">
                        <Ionicons name="lock-closed-outline" size={36} color={isDark ? '#475569' : '#cbd5e1'} />
                        <Text className="text-slate-600 dark:text-slate-300 text-center mt-3 font-semibold">
                            Sign in to start tracking expenses
                        </Text>
                        <Text className="text-slate-400 dark:text-slate-500 text-center text-xs mt-1 mb-4">
                            All features require an account because they're tied to you and your household members.
                        </Text>
                        <TouchableOpacity
                            onPress={exitGuestMode}
                            className="bg-primary px-8 py-4 rounded-2xl w-full items-center shadow-lg shadow-primary/30"
                        >
                            <Text className="text-white font-bold text-base">Sign In or Create Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    }

    if (!myHome) return <HomeSetupScreen onHomeCreated={loadDashboardData} />;

    if (currentView === 'settle') {
        return (
            <SettleScreen
                homeId={myHome.id}
                currentUserId={userInfo.id}
                onBack={() => setCurrentView('dashboard')}
                onRefreshDashboard={onRefresh}
            />
        );
    }

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View className="bg-primary p-8 pt-16 rounded-b-[40px] shadow-lg">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                            <Text className="text-white/70 font-medium tracking-tight">
                                Welcome back, {userInfo?.name}
                            </Text>
                            {/* Home name — tap to switch */}
                            <TouchableOpacity
                                onPress={() => setShowHomeSwitcher(true)}
                                className="flex-row items-center gap-2 mt-0.5"
                            >
                                <Text className="text-white text-3xl font-black">{myHome.name}</Text>
                                {allHomes.length > 0 && (
                                    <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.6)" />
                                )}
                            </TouchableOpacity>

                            <View className="flex-row items-center mt-3">
                                <View className="flex-row items-center bg-white/20 self-start px-3 py-1.5 rounded-xl border border-white/30">
                                    <Text className="text-white text-xs font-mono mr-3">
                                        Code: {myHome.inviteCode}
                                    </Text>
                                    <TouchableOpacity onPress={copyInviteCode}>
                                        <Ionicons name="copy-outline" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                                {memberCount > 0 && (
                                    <Text className="text-white/60 text-xs font-medium ml-3">
                                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleLogout}
                            className="bg-white/10 p-2 rounded-full border border-white/20"
                        >
                            <Ionicons name="log-out-outline" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Balance Card */}
                <View className="px-6 -mt-10 mb-4">
                    <View className="bg-white dark:bg-slate-800 p-6 rounded-[30px] shadow-xl border border-slate-50 dark:border-slate-700 flex-row justify-between items-center">
                        <View>
                            <Text className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-[2px]">
                                Your Net Balance
                            </Text>
                            <Text className={`text-3xl font-black mt-1 ${
                                myBalance > 0 ? 'text-emerald-500' :
                                myBalance < 0 ? 'text-rose-500' : 'text-slate-400'
                            }`}>
                                {myBalance > 0 ? `+$${myBalance.toFixed(2)}` :
                                 myBalance < 0 ? `-$${Math.abs(myBalance).toFixed(2)}` : '$0.00'}
                            </Text>
                        </View>

                        <View className={`p-4 rounded-2xl ${
                            myBalance > 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' :
                            myBalance < 0 ? 'bg-rose-50 dark:bg-rose-900/30' : 'bg-slate-50 dark:bg-slate-700'
                        }`}>
                            <Ionicons
                                name={
                                    myBalance > 0 ? "trending-up" :
                                    myBalance < 0 ? "trending-down" : "checkmark-circle"
                                }
                                size={28}
                                color={
                                    myBalance > 0 ? "#10b981" :
                                    myBalance < 0 ? "#f43f5e" : "#cbd5e1"
                                }
                            />
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View className="flex-row px-6 justify-between mb-6">
                    <TouchableOpacity
                        className="bg-white dark:bg-slate-800 flex-1 mr-2 p-5 rounded-3xl shadow-md items-center border border-slate-50 dark:border-slate-700"
                        onPress={() => setModalVisible(true)}
                    >
                        <View className="bg-primary/10 dark:bg-primary/20 p-3 rounded-2xl mb-2">
                            <Ionicons name="add" size={24} color="#E98074" />
                        </View>
                        <Text className="text-primary font-bold text-sm">Add Bill</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-white dark:bg-slate-800 flex-1 ml-2 p-5 rounded-3xl shadow-md items-center border border-slate-50 dark:border-slate-700"
                        onPress={() => setCurrentView('settle')}
                    >
                        <View className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-2xl mb-2">
                            <Ionicons name="checkmark-done" size={24} color="#10b981" />
                        </View>
                        <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Settle Up</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Bar */}
                <View className="flex-row mx-6 mb-4 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-3xl border border-slate-50 dark:border-slate-700 gap-1">
                    {[
                        { key: 'activity', label: 'Activity', icon: 'receipt-outline' },
                        { key: 'shopping', label: 'Shopping', icon: 'cart-outline' },
                        { key: 'recurring', label: 'Recurring', icon: 'repeat-outline' },
                        { key: 'analytics', label: userInfo?.isPremium ? 'Analytics' : '👑', icon: 'bar-chart-outline' },
                    ].map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                onPress={() => setActiveTab(tab.key)}
                                activeOpacity={0.7}
                                className="flex-1"
                            >
                                <View className={`py-3 rounded-2xl items-center flex-row justify-center ${
                                    isActive ? 'bg-white dark:bg-slate-700 border border-primary/25' : ''
                                }`}>
                                    <Ionicons
                                        name={tab.icon}
                                        size={16}
                                        color={isActive ? '#E98074' : '#64748b'}
                                    />
                                    <Text
                                        numberOfLines={1}
                                        className={`ml-1.5 font-bold text-xs ${
                                            isActive ? 'text-primary' : 'text-slate-500'
                                        }`}
                                    >
                                        {tab.label}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                    <View className="px-6 pt-0">
                        <Text className="text-slate-800 dark:text-slate-100 text-xl font-black mb-4 px-1">
                            Recent Activity
                        </Text>

                        {expenses.length === 0 ? (
                            <View className="bg-white dark:bg-slate-800 p-12 rounded-[30px] items-center border border-dashed border-slate-200 dark:border-slate-700">
                                <Ionicons name="receipt-outline" size={48} color={isDark ? '#475569' : '#cbd5e1'} />
                                <Text className="text-slate-400 dark:text-slate-500 text-center mt-4">
                                    No activity yet!
                                </Text>
                            </View>
                        ) : (
                            expenses.map((expense) => {
                                const isSettlement = expense.Category === 'SETTLEMENT' || expense.category === 'SETTLEMENT';
                                const isPayer = String(expense.payerId) === String(userInfo?.id);
                                const isDeleting = deletingExpenseId === expense.id;
                                return (
                                <View
                                    key={expense.id}
                                    className="bg-white dark:bg-slate-800 p-5 rounded-[24px] mb-3 flex-row justify-between items-center shadow-sm border border-slate-50 dark:border-slate-700"
                                >
                                    <View className="flex-1">
                                        <Text className="text-slate-800 dark:text-slate-100 font-bold text-base">
                                            {expense.description || expense.Description}
                                        </Text>
                                        <View className="flex-row items-center mt-1">
                                            <Text className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                                {expense.category || expense.Category || 'General'}
                                            </Text>
                                            {expense.payerName && (
                                                <Text className="text-slate-300 dark:text-slate-600 text-[10px] ml-2">
                                                    · {isPayer ? 'you' : expense.payerName}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <View className="items-end gap-2">
                                        <Text className={`font-black text-xl ${isSettlement ? 'text-teal-500' : 'text-primary'}`}>
                                            ${expense.amount?.toFixed(2)}
                                        </Text>
                                        {isPayer && !isSettlement && (
                                            <TouchableOpacity
                                                onPress={() => handleDeleteExpense(expense)}
                                                disabled={isDeleting}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                {isDeleting
                                                    ? <ActivityIndicator size="small" color="#f87171" />
                                                    : <Ionicons name="trash-outline" size={16} color="#f87171" />
                                                }
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                                );
                            })
                        )}
                        <View className="h-24" />
                    </View>
                )}

                {/* Shopping Tab */}
                {activeTab === 'shopping' && (
                    <ShoppingTab homeId={myHome.id} refreshTrigger={refreshing} />
                )}

                {/* Recurring Tab */}
                {activeTab === 'recurring' && (
                    <RecurringTab homeId={myHome.id} navigation={navigation} />
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <AnalyticsTab homeId={myHome.id} navigation={navigation} />
                )}
            </ScrollView>

            <AddExpenseModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                homeId={myHome.id}
                onRefresh={onRefresh}
            />

            {/* Home Switcher Overlay */}
            {showHomeSwitcher && (
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setShowHomeSwitcher(false)}
                >
                    <View className="bg-white dark:bg-slate-800 rounded-t-[36px] pb-10 overflow-hidden">
                        <View className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full self-center mt-4 mb-4" />
                        <Text className="text-slate-800 dark:text-slate-100 text-lg font-black px-6 mb-4">Your Households</Text>

                        {allHomes.map((h) => {
                            const isActiveHome = h.id === myHome.id;
                            return (
                                <TouchableOpacity key={h.id} onPress={() => switchHome(h)}>
                                    <View className={`flex-row items-center px-6 py-4 ${isActiveHome ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                        <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 ${
                                            isActiveHome ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-700'
                                        }`}>
                                            <Text className={`font-black text-sm ${isActiveHome ? 'text-white' : 'text-slate-500'}`}>
                                                {h.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text className={`flex-1 font-bold text-base ${
                                            isActiveHome ? 'text-primary' : 'text-slate-700 dark:text-slate-200'
                                        }`}>
                                            {h.name}
                                        </Text>
                                        {isActiveHome && (
                                            <Ionicons name="checkmark" size={20} color="#E98074" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        <View className="border-t border-slate-100 dark:border-slate-700 mt-2">
                            {atHomeLimit ? (
                                <View className="px-6 py-4">
                                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 text-center">
                                        {isPremium
                                            ? `Limit reached (${HOME_LIMIT_PREMIUM} households max)`
                                            : 'Free plan: 1 household'}
                                    </Text>
                                    {!isPremium && (
                                        <TouchableOpacity
                                            onPress={() => { setShowHomeSwitcher(false); navigation?.navigate('Settings', { screen: 'Premium' }); }}
                                            className="mt-2"
                                        >
                                            <Text className="text-xs font-bold text-primary text-center">
                                                Upgrade for up to {HOME_LIMIT_PREMIUM} households →
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => { setShowHomeSwitcher(false); setAddHomeMode('create'); setAddHomeInput(''); setShowAddHome(true); }}
                                    className="flex-row items-center px-6 py-4"
                                >
                                    <View className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 items-center justify-center mr-4">
                                        <Ionicons name="add" size={20} color="#10b981" />
                                    </View>
                                    <View>
                                        <Text className="font-bold text-slate-700 dark:text-slate-200 text-base">Add Household</Text>
                                        <Text className="text-[10px] text-slate-400 dark:text-slate-500">{allHomes.length}/{homeLimit} used</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            )}

            {/* Add / Join Household Overlay */}
            {showAddHome && (
                <View style={styles.overlay}>
                    <View className="bg-white dark:bg-slate-800 rounded-t-[36px] p-6 pb-10">
                        <View className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full self-center mb-5" />
                        <Text className="text-slate-800 dark:text-slate-100 text-xl font-black mb-5">
                            {addHomeMode === 'join' ? 'Join a Household' : 'Create a Household'}
                        </Text>

                        {/* Mode toggle */}
                        <View className="flex-row gap-3 mb-4">
                            {['create', 'join'].map((m) => {
                                const isActiveMode = addHomeMode === m;
                                return (
                                    <TouchableOpacity
                                        key={m}
                                        onPress={() => { setAddHomeMode(m); setAddHomeInput(''); }}
                                        disabled={addHomeLoading}
                                        className="flex-1"
                                    >
                                        <View className={`py-3 rounded-2xl items-center border ${
                                            isActiveMode
                                                ? 'bg-primary border-primary'
                                                : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                                        }`}>
                                            <Text className={`font-bold text-sm ${isActiveMode ? 'text-white' : 'text-slate-500'}`}>
                                                {m === 'create' ? 'Create New' : 'Join with Code'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TextInput
                            value={addHomeInput}
                            onChangeText={setAddHomeInput}
                            placeholder={addHomeMode === 'join' ? 'Invite code (e.g. AB123)' : 'Household name (e.g. Apt 4B)'}
                            placeholderTextColor="#94a3b8"
                            editable={!addHomeLoading}
                            className="border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 text-base mb-5 bg-slate-50 dark:bg-slate-700"
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowAddHome(false)}
                                disabled={addHomeLoading}
                                className="flex-1 p-4 rounded-2xl items-center bg-slate-100 dark:bg-slate-700"
                            >
                                <Text className="text-slate-600 dark:text-slate-300 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddHome}
                                disabled={addHomeLoading || !addHomeInput.trim()}
                                className="flex-1"
                            >
                                <View className={`p-4 rounded-2xl items-center ${
                                    addHomeLoading || !addHomeInput.trim() ? 'bg-primary/50' : 'bg-primary'
                                }`}>
                                    {addHomeLoading
                                        ? <ActivityIndicator color="white" />
                                        : <Text className="text-white font-bold">{addHomeMode === 'join' ? 'Join' : 'Create'}</Text>
                                    }
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        zIndex: 100,
    },
});
