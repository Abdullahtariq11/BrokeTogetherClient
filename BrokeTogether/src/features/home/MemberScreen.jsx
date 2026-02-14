import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
    View, Text, TouchableOpacity, ScrollView, 
    Alert, ActivityIndicator, RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import homeService from '../../api/homeService';

export default function MembersScreen() {
    const { userInfo } = useContext(AuthContext);

    const [home, setHome] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const homes = await homeService.getMyHomes();
            
            if (homes && homes.length > 0) {
                const activeHome = homes[0];
                setHome(activeHome);
                
                const membersData = await homeService.getMembers(activeHome.id);
                setMembers(membersData || []);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

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

    const isCurrentUser = (memberId) => {
        return String(memberId) === String(userInfo?.id);
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50">
                <ActivityIndicator size="large" color="#E98074" />
            </View>
        );
    }

    if (!home) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50 p-6">
                <Ionicons name="home-outline" size={64} color="#cbd5e1" />
                <Text className="text-slate-400 text-center mt-4">
                    You're not part of any home yet.
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <ScrollView 
                className="flex-1"
                contentContainerStyle={{ padding: 24, paddingTop: 60 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View className="flex-row items-center mb-2">
                    <Text className="text-2xl font-black text-slate-800">Roommates</Text>
                    <View className="ml-2 bg-primary/10 px-2 py-1 rounded-full">
                        <Text className="text-primary text-xs font-bold">{members.length}</Text>
                    </View>
                </View>
                
                <Text className="text-slate-400 text-sm mb-6">{home.name}</Text>

                {members.length === 0 ? (
                    <View className="bg-white p-12 rounded-[30px] items-center border border-dashed border-slate-200">
                        <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                        <Text className="text-slate-400 text-center mt-4">
                            No roommates found.
                        </Text>
                    </View>
                ) : (
                    members.map((member) => {
                        const isSelf = isCurrentUser(member.id);
                        const isBeingDeleted = deleting === member.id;

                        return (
                            <View 
                                key={member.id} 
                                className="flex-row items-center justify-between bg-white p-4 rounded-2xl mb-3 shadow-sm border border-slate-100"
                            >
                                <View className="flex-row items-center flex-1">
                                    {/* Avatar */}
                                    <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-primary/10">
                                        <Text className="text-primary font-bold text-lg">
                                            {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                        </Text>
                                    </View>

                                    {/* Name */}
                                    <View className="flex-1">
                                        <Text className="font-semibold text-slate-700 text-base">
                                            {member.name}
                                            {isSelf && (
                                                <Text className="text-slate-400 text-xs"> (You)</Text>
                                            )}
                                        </Text>
                                    </View>
                                </View>

                                {/* Delete Button - Show for everyone except yourself */}
                                {!isSelf && (
                                    <TouchableOpacity 
                                        onPress={() => handleRemoveMember(member)}
                                        disabled={isBeingDeleted}
                                        className="bg-rose-50 p-3 rounded-xl"
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

                <View className="h-10" />
            </ScrollView>
        </View>
    );
}