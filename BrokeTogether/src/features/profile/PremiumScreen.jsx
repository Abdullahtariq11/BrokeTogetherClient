import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import billingService from '../../api/billingService';
import { AuthContext } from '../../context/AuthContext';
import { PREMIUM_ENTITLEMENT_ID } from '../../config/revenuecat';

const FEATURES = [
  { icon: 'cart-outline', text: 'Shared shopping list with price tracking' },
  { icon: 'swap-horizontal-outline', text: 'Convert shopping items to expenses instantly' },
  { icon: 'stats-chart-outline', text: 'Advanced expense analytics & insights' },
  { icon: 'people-outline', text: 'Unlimited household members' },
  { icon: 'notifications-outline', text: 'Smart payment reminders' },
];

export default function PremiumScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);
  const [status, setStatus] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // RevenueCat's on-device entitlement check wins when present — it's
  // updated the instant a purchase/restore completes, without waiting on
  // the backend's webhook-driven status.
  const isPremium = customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID]
    ? true
    : status?.isPremium ?? userInfo?.isPremium ?? false;
  const subscriptionStatus = status?.subscriptionStatus ?? userInfo?.subscriptionStatus ?? 'NONE';

  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch {
      // RevenueCat unreachable — fall back to backend-reported status
    }
  }, []);

  useEffect(() => {
    Promise.all([
      billingService.getStatus().then(setStatus).catch(() => {}),
      refreshCustomerInfo(),
    ]).finally(() => setLoading(false));
  }, [refreshCustomerInfo]);

  const handleUpgrade = async () => {
    setActionLoading(true);
    try {
      const result = await RevenueCatUI.presentPaywall();
      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        await refreshCustomerInfo();
      } else if (result === PAYWALL_RESULT.ERROR) {
        Alert.alert('Error', 'Something went wrong during purchase. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Could not open the upgrade screen. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    setActionLoading(true);
    try {
      await RevenueCatUI.presentCustomerCenter();
      await refreshCustomerInfo();
    } catch {
      Alert.alert('Error', 'Could not open subscription management. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      if (!info.entitlements.active[PREMIUM_ENTITLEMENT_ID]) {
        Alert.alert('No purchases found', "We couldn't find an active subscription for this account.");
      }
    } catch {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const statusLabel = {
    NONE: null,
    ACTIVE: 'Active',
    CANCELLED: 'Cancelled',
    PAST_DUE: 'Past Due',
  }[subscriptionStatus];

  const statusColor = {
    ACTIVE: 'text-green-600',
    CANCELLED: 'text-slate-400',
    PAST_DUE: 'text-red-500',
  }[subscriptionStatus] ?? 'text-slate-400';

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary px-6 pt-16 pb-10 items-center rounded-b-[50px]">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute top-14 left-5 p-2"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4 border-4 border-white/30">
          <Ionicons name="star" size={36} color="white" />
        </View>
        <Text className="text-white text-2xl font-black">BrokeTogether Premium</Text>
        <Text className="text-white/80 text-sm mt-1 text-center">
          {isPremium ? 'You\'re a premium member!' : 'Unlock all features for your household'}
        </Text>

        {isPremium && statusLabel && (
          <View className="mt-3 bg-white/20 px-4 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">
              Subscription: {statusLabel}
            </Text>
          </View>
        )}
      </View>

      <View className="p-6">
        {loading ? (
          <ActivityIndicator color="#E98074" size="large" className="mt-10" />
        ) : (
          <>
            {/* Features list */}
            <Text className="text-slate-400 font-bold uppercase text-xs mb-4 ml-1">
              What's included
            </Text>
            <View className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
              {FEATURES.map((f, i) => (
                <View
                  key={i}
                  className={`flex-row items-center p-5 ${i < FEATURES.length - 1 ? 'border-b border-slate-50' : ''}`}
                >
                  <View className="w-9 h-9 bg-primary/10 rounded-full items-center justify-center mr-4">
                    <Ionicons name={f.icon} size={18} color="#E98074" />
                  </View>
                  <Text className="text-slate-700 font-medium flex-1">{f.text}</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                </View>
              ))}
            </View>

            {/* CTA */}
            {!isPremium ? (
              <TouchableOpacity
                onPress={handleUpgrade}
                disabled={actionLoading}
                className="bg-primary p-5 rounded-3xl items-center shadow-lg shadow-primary/30"
              >
                {actionLoading
                  ? <ActivityIndicator color="white" />
                  : (
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="star" size={20} color="white" />
                      <Text className="text-white font-black text-base">Upgrade to Premium</Text>
                    </View>
                  )
                }
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleManage}
                disabled={actionLoading}
                className="bg-white p-5 rounded-3xl items-center border border-slate-200 shadow-sm"
              >
                {actionLoading
                  ? <ActivityIndicator color="#E98074" />
                  : (
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="card-outline" size={20} color="#E98074" />
                      <Text className="text-primary font-black text-base">Manage Subscription</Text>
                    </View>
                  )
                }
              </TouchableOpacity>
            )}

            {subscriptionStatus === 'PAST_DUE' && (
              <View className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex-row items-start">
                <Ionicons name="warning-outline" size={18} color="#ef4444" style={{ marginTop: 1 }} />
                <Text className="ml-2 text-red-600 text-sm flex-1">
                  Your payment is past due. Please update your payment method to keep premium access.
                </Text>
              </View>
            )}

            {subscriptionStatus === 'CANCELLED' && (
              <View className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex-row items-start">
                <Ionicons name="information-circle-outline" size={18} color="#d97706" style={{ marginTop: 1 }} />
                <Text className="ml-2 text-amber-700 text-sm flex-1">
                  Your subscription has been cancelled. You can resubscribe at any time.
                </Text>
              </View>
            )}

            {!isPremium && (
              <TouchableOpacity onPress={handleRestore} disabled={actionLoading} className="mt-4 items-center">
                <Text className="text-primary text-sm font-semibold">Restore Purchases</Text>
              </TouchableOpacity>
            )}

            <Text className="text-center text-slate-300 text-xs mt-8 mb-4">
              Subscriptions are billed through the App Store or Google Play. Cancel anytime.
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}
