import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import expenseService from '../../api/expenseService';
import homeService from '../../api/homeService';

export default function SettleScreen({ homeId, onBack, onRefreshDashboard }) {
    // Get userInfo directly from context instead of relying on prop
    const { userInfo } = useContext(AuthContext);
    
    const [allMembers, setAllMembers] = useState([]);
    const [balanceMap, setBalanceMap] = useState({});
    const [loading, setLoading] = useState(true);

    // Filter out current user - compare by ID AND name as fallback
    const otherMembers = allMembers.filter(m => {
        const currentUserId = userInfo?.id;
        const currentUserName = userInfo?.name?.toLowerCase().trim();
        
        // Compare by ID (handle both number and string)
        const idMatch = String(m.id) === String(currentUserId) || 
                        Number(m.id) === Number(currentUserId);
        
        // Compare by name as fallback
        const nameMatch = m.name?.toLowerCase().trim() === currentUserName;
        
        // Exclude if EITHER matches
        return !idMatch && !nameMatch;
    });

    useEffect(() => {
        const loadSettleData = async () => {
            try {
                const [m, b] = await Promise.all([
                    homeService.getMembers(homeId),
                    expenseService.getHomeBalances(homeId)
                ]);
                
                // DEBUG
                console.log('=== SETTLE DEBUG ===');
                console.log('userInfo:', userInfo?.id, userInfo?.name);
                console.log('Members:', m);
                console.log('Balances:', b);
                
                setAllMembers(m || []);
                setBalanceMap(b || {});
            } catch (error) {
                console.error("Settle Load Error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadSettleData();
    }, [homeId]);

    const handleSettle = async (member, balance) => {
        // Only allow settling if YOU owe THEM (their balance > 0)
        if (balance <= 0) {
            Alert.alert("Info", `${member.name} owes you! Wait for them to settle.`);
            return;
        }

        const cleanAmt = Math.abs(parseFloat(balance));
        if (cleanAmt < 0.01) return;

        Alert.alert(
            "Confirm Payment",
            `Pay $${cleanAmt.toFixed(2)} to ${member.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        try {
                            await expenseService.settleDebt(homeId, member.id, cleanAmt);
                            Alert.alert("Success", "Payment recorded!");
                            onRefreshDashboard();
                            onBack();
                        } catch (e) {
                            Alert.alert("Error", "Settlement failed.");
                        }
                    }
                }
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

    return (
        <View className="flex-1 bg-slate-50 pt-12 px-6">
            <TouchableOpacity onPress={onBack} className="mb-4">
                <Ionicons name="close" size={28} color="#334155" />
            </TouchableOpacity>

            <Text className="text-2xl font-black mb-6">Roommate Ledger</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
                {otherMembers.length === 0 ? (
                    <View className="bg-white p-12 rounded-[30px] items-center border border-dashed border-slate-200">
                        <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                        <Text className="text-slate-400 text-center mt-4">
                            No roommates to settle with
                        </Text>
                    </View>
                ) : (
                    otherMembers.map((member) => {
                        const raw = balanceMap[member.id] || balanceMap[String(member.id)] || 0;
                        const balance = parseFloat(raw);
                        const isSettled = Math.abs(balance) < 0.01;

                        // Backend logic:
                        // Positive balance = member is OWED money (you owe them)
                        // Negative balance = member OWES money (they owe you)
                        const theyOweYou = balance < 0;
                        const youOweThem = balance > 0;

                        return (
                            <TouchableOpacity
                                key={member.id}
                                onPress={() => handleSettle(member, balance)}
                                disabled={isSettled || theyOweYou}
                                className={`bg-white p-5 rounded-[24px] mb-3 flex-row justify-between items-center shadow-sm border border-slate-50 ${(isSettled || theyOweYou) ? 'opacity-40' : ''}`}
                            >
                                <View>
                                    <Text className="font-bold text-lg text-slate-800">
                                        {member.name}
                                    </Text>
                                    <Text className={`font-black text-[10px] ${
                                        theyOweYou ? 'text-emerald-500' :
                                        youOweThem ? 'text-rose-500' : 'text-slate-400'
                                    }`}>
                                        {theyOweYou ? "OWES YOU" : youOweThem ? "YOU OWE THEM" : "ALL SETTLED"}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className={`text-xl font-black ${
                                        theyOweYou ? 'text-emerald-500' :
                                        youOweThem ? 'text-rose-500' : 'text-slate-300'
                                    }`}>
                                        ${Math.abs(balance).toFixed(2)}
                                    </Text>
                                    {youOweThem && !isSettled && (
                                        <Text className="text-[10px] text-rose-400 mt-1">
                                            TAP TO PAY
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}