import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import homeService from '../api/homeService';
import expenseService from '../api/expenseService';
import HomeSetupScreen from './home/HomeSetupScreen';
import AddExpenseModal from './expense/AddExpenseModal';
import SettleScreen from './home/SettleScreen';

export default function DashboardScreen() {
    const { userInfo, logout } = useContext(AuthContext);
    
    // View Management
    const [currentView, setCurrentView] = useState('dashboard');
    
    // Data State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [myHome, setMyHome] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [myBalance, setMyBalance] = useState(0);

    // Modal State
    const [isModalVisible, setModalVisible] = useState(false);

    const loadDashboardData = useCallback(async () => {
        try {
            const homes = await homeService.getMyHomes();
            if (homes && homes.length > 0) {
                const activeHome = homes[0];
                setMyHome(activeHome);

                const [balanceMap, recentExpenses] = await Promise.all([
                    expenseService.getHomeBalances(activeHome.id),
                    expenseService.getHomeExpenses(activeHome.id)
                ]);
                
                // Extract your specific balance
                if (userInfo?.id && balanceMap) {
                    const rawValue = balanceMap[userInfo.id] || balanceMap[userInfo.id.toString()] || 0;
                    setMyBalance(parseFloat(rawValue));
                }

                setExpenses(recentExpenses || []);
            }
        } catch (err) {
            // Dashboard load failed
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userInfo?.id]);

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

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50">
                <ActivityIndicator size="large" color="#E98074" />
                <Text className="mt-4 text-slate-500 font-medium">Syncing Household...</Text>
            </View>
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
        <View className="flex-1 bg-slate-50">
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
                            <Text className="text-white text-3xl font-black">{myHome.name}</Text>
                            
                            <View className="flex-row items-center mt-3 bg-white/20 self-start px-3 py-1.5 rounded-xl border border-white/30">
                                <Text className="text-white text-xs font-mono mr-3">
                                    Code: {myHome.inviteCode}
                                </Text>
                                <TouchableOpacity onPress={copyInviteCode}>
                                    <Ionicons name="copy-outline" size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={logout} 
                            className="bg-white/10 p-2 rounded-full border border-white/20"
                        >
                            <Ionicons name="log-out-outline" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Balance Card */}
                <View className="px-6 -mt-10 mb-4">
                    <View className="bg-white p-6 rounded-[30px] shadow-xl border border-slate-50 flex-row justify-between items-center">
                        <View>
                            <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px]">
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
                            myBalance > 0 ? 'bg-emerald-50' : 
                            myBalance < 0 ? 'bg-rose-50' : 'bg-slate-50'
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
                        className="bg-white flex-1 mr-2 p-5 rounded-3xl shadow-md items-center border border-slate-50"
                        onPress={() => setModalVisible(true)}
                    >
                        <View className="bg-primary/10 p-3 rounded-2xl mb-2">
                            <Ionicons name="add" size={24} color="#E98074" />
                        </View>
                        <Text className="text-primary font-bold text-sm">Add Bill</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-white flex-1 ml-2 p-5 rounded-3xl shadow-md items-center border border-slate-50"
                        onPress={() => setCurrentView('settle')}
                    >
                        <View className="bg-emerald-50 p-3 rounded-2xl mb-2">
                            <Ionicons name="checkmark-done" size={24} color="#10b981" />
                        </View>
                        <Text className="text-emerald-600 font-bold text-sm">Settle Up</Text>
                    </TouchableOpacity>
                </View>

                {/* History List */}
                <View className="p-6 pt-0">
                    <Text className="text-slate-800 text-xl font-black mb-4 px-1">
                        Recent Activity
                    </Text>
                    
                    {expenses.length === 0 ? (
                        <View className="bg-white p-12 rounded-[30px] items-center border border-dashed border-slate-200">
                            <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
                            <Text className="text-slate-400 text-center mt-4">
                                No activity yet!
                            </Text>
                        </View>
                    ) : (
                        expenses.map((expense) => (
                            <View 
                                key={expense.id} 
                                className="bg-white p-5 rounded-[24px] mb-3 flex-row justify-between items-center shadow-sm border border-slate-50"
                            >
                                <View className="flex-1">
                                    <Text className="text-slate-800 font-bold text-base">
                                        {expense.Description}
                                    </Text>
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                            {expense.Category || 'General'}
                                        </Text>
                                        <View className="mx-2 w-1 h-1 rounded-full bg-slate-300" />
                                    </View>
                                </View>
                                <Text className="text-primary font-black text-xl">
                                    ${expense.amount?.toFixed(2)}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
                
                <View className="h-24" />
            </ScrollView>

            <AddExpenseModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                homeId={myHome.id}
                onRefresh={onRefresh}
            />
        </View>
    );
}