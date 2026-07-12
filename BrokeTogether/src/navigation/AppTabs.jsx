import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from '../features/Dashboard';
import MembersScreen from '../features/home/MemberScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import HouseholdSettingsScreen from '../features/home/HouseholdSettingsScreen';
import HelpSupportScreen from '../features/profile/HelpSupportScreen';
import PrivacyPolicyScreen from '../features/profile/PrivacyPolicyScreen';
import TermsConditionsScreen from '../features/profile/TermsConditionsScreen';
import PremiumScreen from '../features/profile/PremiumScreen';

const Tab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator();

function SettingsStackScreen() {
    return (
        <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
            <SettingsStack.Screen name="ProfileMain" component={ProfileScreen} />
            <SettingsStack.Screen name="HouseholdSettings" component={HouseholdSettingsScreen} />
            <SettingsStack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <SettingsStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <SettingsStack.Screen name="TermsConditions" component={TermsConditionsScreen} />
            <SettingsStack.Screen name="Premium" component={PremiumScreen} />
        </SettingsStack.Navigator>
    );
}

export default function AppTabs() {
    const insets = useSafeAreaInsets();

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
                tabBarStyle: {
                    height: 60 + insets.bottom,
                    paddingBottom: Math.max(insets.bottom, 10),
                    paddingTop: 8
                }
            })}
        >
            <Tab.Screen name="Home" component={DashboardScreen} />
            <Tab.Screen name="People" component={MembersScreen} />
            <Tab.Screen name="Settings" component={SettingsStackScreen} />
        </Tab.Navigator>
    );
}
