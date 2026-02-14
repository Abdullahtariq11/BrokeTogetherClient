import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../features/Dashboard';
import MembersScreen from '../features/home/MemberScreen';
import ProfileScreen from '../features/profile/ProfileScreen';


const Tab = createBottomTabNavigator();

export default function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = 'wallet';
                    else if (route.name === 'People') iconName = 'people';
                    else if (route.name === 'Settings') iconName = 'settings';
                    
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#E98074',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
                tabBarStyle: { height: 60, paddingBottom: 10 }
            })}
        >
            <Tab.Screen name="Home" component={DashboardScreen} />
            <Tab.Screen name="People" component={MembersScreen} />
            <Tab.Screen name="Settings" component={ProfileScreen} />
        </Tab.Navigator>
    );
}