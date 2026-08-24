import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import homeService from '../../api/homeService';
import expenseService from '../../api/expenseService';

export default function MembersScreen() {
    const { userInfo, isGuest, exitGuestMode } = useContext(AuthContext);

    const [home, setHome] = useState(null);
    const [members, setMembers] = useState([]);
    const [balances, setBalances] = useState({});
    const [loading, setLoading] = useState(!isGuest);
    const [refreshing, setRefreshing] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const fetchData = useCallback(async () => {
        if (isGuest) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            const homes = await homeService.getMyHomes();

            if (homes && homes.length > 0) {
                const activeHome = homes[0];
                setHome(activeHome);

                const [membersData, balanceMap] = await Promise.all([
                    homeService.getMembers(activeHome.id),
                    expenseService.getHomeBalances(activeHome.id),
                ]);
                setMembers(membersData || []);
                setBalances(balanceMap || {});
            }
        } catch (err) {
            // Failed to fetch member data
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isGuest]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleRemoveMember = (member) => {
        Alert.alert(
            "Remove Member",
            `Are you sure you want to remove ${member.name} from this home?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        setDeleting(member.id);
                        try {
                            await homeService.removeMember(home.id, member.id);
                            Alert.alert("Success", `${member.name} has been removed.`);
                            fetchData();
                        } catch (err) {
                            const errorMsg = err.response?.data?.message || "Only the home creator can remove members.";
                            Alert.alert("Error", errorMsg);
                        } finally {
                            setDeleting(null);
                        }
                    }
                }
            ]
        );
    };

    const copyInviteCode = async () => {
        if (home?.inviteCode) {
            await Clipboard.setStringAsync(home.inviteCode);
            Alert.alert("Copied!", "Invite code copied to clipboard.");
        }
    };

    const isCurrentUser = (memberId) => {
        return String(memberId) === String(userInfo?.id);
    };

    const isAdmin = home && home.creatorId === userInfo?.id;

    const getMemberBalance = (memberId) => {
        const val = balances[memberId] || balances[String(memberId)] || 0;
        return parseFloat(val);
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-100 dark:bg-slate-900">
                <ActivityIndicator size="large" color="#E98074" />
            </View>
        );
    }

    if (isGuest) {
        return (
            <View className="flex-1 bg-slate-100 dark:bg-slate-900">
                <View className="bg-primary p-8 pt-16 rounded-b-[40px] shadow-lg">
                    <Text className="text-white/70 font-medium tracking-tight">Roommates</Text>
                    <Text className="text-white text-3xl font-black">People</Text>
                </View>
                <View className="flex-1 justify-center items-center p-6">
                    <Ionicons name="people-outline" size={64} color="#cbd5e1" />
                    <Text className="text-slate-600 dark:text-slate-300 text-center mt-4 font-bold text-lg">
                        Sign in to see your roommates
                    </Text>
                    <Text className="text-slate-400 dark:text-slate-500 text-center text-sm mt-2 mb-6">
                        Connect with your household members and track balances together.
                    </Text>
                    <TouchableOpacity
                        onPress={exitGuestMode}
                        className="bg-primary px-8 py-4 rounded-2xl shadow-lg shadow-primary/30"
                    >
                        <Text className="text-white font-bold text-base">Sign In or Create Account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!home) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-100 dark:bg-slate-900 p-6">
                <Ionicons name="home-outline" size={64} color="#cbd5e1" />
                <Text className="text-slate-400 dark:text-slate-500 text-center mt-4">
                    You're not part of any home yet.
                </Text>
            </View>
        );
    }

    // Sort: current user first, then alphabetical
    const sortedMembers = [...members].sort((a, b) => {
        if (isCurrentUser(a.id)) return -1;
        if (isCurrentUser(b.id)) return 1;
        return (a.name || '').localeCompare(b.name || '');
    });

    return (
        <View className="flex-1 bg-slate-100 dark:bg-slate-900">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View className="bg-primary p-8 pt-16 rounded-b-[40px] shadow-lg">
                    <Text className="text-white/70 font-medium tracking-tight">
                        {home.name}
                    </Text>
                    <Text className="text-white text-3xl font-black">Roommates</Text>
                    <View className="flex-row items-center mt-3">
                        <View className="bg-white/20 px-3 py-1.5 rounded-xl border border-white/30 flex-row items-center">
                            <Ionicons name="people" size={14} color="white" />
                            <Text className="text-white text-xs font-bold ml-1.5">
                                {members.length} {members.length === 1 ? 'member' : 'members'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="p-6 pt-5">
                    {/* Invite Code Card */}
                    <TouchableOpacity
                        onPress={copyInviteCode}
                        className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6 flex-row items-center"
                        activeOpacity={0.7}
                    >
                        <View className="bg-primary/10 dark:bg-primary/20 p-3 rounded-2xl mr-4">
                            <Ionicons name="link" size={20} color="#E98074" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                Invite Code
                            </Text>
                            <Text className="text-slate-800 dark:text-slate-100 text-base font-mono font-bold mt-0.5">
                                {home.inviteCode}
                            </Text>
                        </View>
                        <Ionicons name="copy-outline" size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    {/* Members List */}
                    {sortedMembers.length === 0 ? (
                        <View className="bg-white dark:bg-slate-800 p-12 rounded-[30px] items-center border border-dashed border-slate-200 dark:border-slate-700">
                            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                            <Text className="text-slate-400 dark:text-slate-500 text-center mt-4">
                                No roommates found.
                            </Text>
                        </View>
                    ) : (
                        sortedMembers.map((member) => {
                            const isSelf = isCurrentUser(member.id);
                            const isBeingDeleted = deleting === member.id;
                            const isMemberAdmin = home.creatorId === member.id;
                            const balance = getMemberBalance(member.id);

                            return (
                                <View
                                    key={member.id}
                                    className={`flex-row items-center bg-white dark:bg-slate-800 p-4 rounded-3xl mb-3 shadow-sm border ${isSelf ? 'border-primary/20' : 'border-slate-100 dark:border-slate-700'}`}
                                >
                                    {/* Avatar */}
                                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isSelf ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                        <Text className={`font-bold text-lg ${isSelf ? 'text-primary' : 'text-slate-500 dark:text-slate-300'}`}>
                                            {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                        </Text>
                                    </View>

                                    {/* Info */}
                                    <View className="flex-1">
                                        <View className="flex-row items-center">
                                            <Text className="font-bold text-slate-800 dark:text-slate-100 text-base">
                                                {member.name}
                                            </Text>
                                            {isSelf && (
                                                <View className="ml-2 bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-full">
                                                    <Text className="text-primary text-[10px] font-bold">You</Text>
                                                </View>
                                            )}
                                            {isMemberAdmin && (
                                                <View className="ml-2 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                                    <Text className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">Admin</Text>
                                                </View>
                                            )}
                                        </View>
                                        {/* Balance */}
                                        <Text className={`text-xs font-medium mt-1 ${
                                            balance > 0 ? 'text-emerald-500' :
                                            balance < 0 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
                                        }`}>
                                            {balance > 0
                                                ? `Owed +$${balance.toFixed(2)}`
                                                : balance < 0
                                                    ? `Owes $${Math.abs(balance).toFixed(2)}`
                                                    : 'Settled up'}
                                        </Text>
                                    </View>

                                    {/* Remove Button - admin only, not for self */}
                                    {isAdmin && !isSelf && (
                                        <TouchableOpacity
                                            onPress={() => handleRemoveMember(member)}
                                            disabled={isBeingDeleted}
                                            className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl"
                                        >
                                            {isBeingDeleted ? (
                                                <ActivityIndicator size="small" color="#f43f5e" />
                                            ) : (
                                                <Ionicons name="person-remove" size={18} color="#f43f5e" />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>

                <View className="h-24" />
            </ScrollView>
        </View>
    );
}
