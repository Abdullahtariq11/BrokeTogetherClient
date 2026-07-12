import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import expenseService from '../../api/expenseService';

const CHART_PALETTE = ['#E98074', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function StatCard({ label, value, color = 'text-primary' }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 items-center border border-slate-100 shadow-sm">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</Text>
      <Text className={`text-lg font-black ${color}`} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function BarRow({ label, value, maxValue, color, pct }) {
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm font-medium text-slate-700" numberOfLines={1}>{label}</Text>
        <Text className="text-sm font-black text-slate-800">${parseFloat(value).toFixed(2)}</Text>
      </View>
      <View className="w-full bg-slate-100 rounded-full h-2">
        <View
          className="h-2 rounded-full"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color || '#E98074' }}
        />
      </View>
    </View>
  );
}

export default function AnalyticsTab({ homeId, navigation }) {
  const { userInfo } = useContext(AuthContext);
  const isPremium = userInfo?.isPremium ?? false;

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isPremium) { setLoading(false); return; }
    try {
      const data = await expenseService.getAnalytics(homeId);
      setAnalytics(data);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  }, [homeId, isPremium]);

  useEffect(() => { load(); }, [load]);

  // Premium gate
  if (!isPremium) {
    return (
      <View className="px-6 pt-4 pb-24 items-center">
        <View className="bg-white rounded-3xl p-8 items-center border border-dashed border-slate-200 w-full">
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Ionicons name="bar-chart-outline" size={30} color="#E98074" />
          </View>
          <Text className="text-slate-800 font-black text-lg text-center">Analytics</Text>
          <Text className="text-slate-400 text-sm text-center mt-2 mb-5">
            See spending by category, monthly trends, and member breakdowns. Premium feature.
          </Text>
          <TouchableOpacity
            onPress={() => navigation?.navigate('Settings', { screen: 'Premium' })}
            className="bg-primary px-6 py-4 rounded-2xl flex-row items-center gap-2"
          >
            <Ionicons name="star" size={16} color="white" />
            <Text className="text-white font-black">Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator color="#E98074" />
      </View>
    );
  }

  if (!analytics) {
    return (
      <View className="px-6 pt-4 pb-24 items-center">
        <Ionicons name="bar-chart-outline" size={48} color="#cbd5e1" />
        <Text className="text-slate-400 text-center mt-4">No analytics data yet.</Text>
        <TouchableOpacity onPress={load} className="mt-3">
          <Text className="text-primary font-bold text-sm">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryEntries = Object.entries(analytics.spendingByCategory || {});
  const memberEntries = Object.entries(analytics.spendingByMember || {}).sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
  const monthEntries = Object.entries(analytics.monthlyTotals || {}).sort();
  const totalSpend = categoryEntries.reduce((s, [, v]) => s + parseFloat(v), 0);
  const totalSettlements = parseFloat(analytics.totalSettlements || 0);
  const avgMonthly = monthEntries.length > 0
    ? monthEntries.reduce((s, [, v]) => s + parseFloat(v), 0) / monthEntries.length
    : 0;
  const topCategory = [...categoryEntries].sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]))[0];
  const maxMonthly = Math.max(...monthEntries.map(([, v]) => parseFloat(v)), 1);
  const memberTotal = memberEntries.reduce((s, [, v]) => s + parseFloat(v), 0);

  return (
    <View className="px-6 pt-2 pb-24">

      {/* Stat cards */}
      <View className="flex-row gap-3 mb-3">
        <StatCard label="You Paid" value={`$${totalSpend.toFixed(2)}`} />
        <StatCard label="Avg/Month" value={`$${avgMonthly.toFixed(2)}`} color="text-emerald-500" />
      </View>
      <View className="flex-row gap-3 mb-4">
        {totalSettlements > 0 && (
          <StatCard label="Settled Up" value={`-$${totalSettlements.toFixed(2)}`} color="text-rose-400" />
        )}
        <StatCard
          label={totalSettlements > 0 ? 'Net Spend' : 'Top Category'}
          value={totalSettlements > 0 ? `$${(totalSpend - totalSettlements).toFixed(2)}` : (topCategory?.[0] ?? '—')}
          color="text-slate-800"
        />
      </View>

      {/* Largest expense */}
      {analytics.largestExpenseAmount > 0 && (
        <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4 flex-row items-center gap-3">
          <View className="w-10 h-10 bg-primary/15 rounded-xl items-center justify-center">
            <Ionicons name="star" size={18} color="#E98074" />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-0.5">Largest Expense</Text>
            <Text className="text-xl font-black text-primary">${parseFloat(analytics.largestExpenseAmount).toFixed(2)}</Text>
            <Text className="text-sm text-slate-600" numberOfLines={1}>{analytics.largestExpenseDescription}</Text>
          </View>
        </View>
      )}

      {/* Spending by category */}
      {categoryEntries.length > 0 && (
        <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Your Spending by Category</Text>
          {categoryEntries
            .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]))
            .map(([cat, amt], i) => (
              <BarRow
                key={cat}
                label={cat}
                value={amt}
                pct={totalSpend > 0 ? (parseFloat(amt) / totalSpend) * 100 : 0}
                color={CHART_PALETTE[i % CHART_PALETTE.length]}
              />
            ))}
        </View>
      )}

      {/* Monthly totals */}
      {monthEntries.length > 0 && (
        <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Monthly Spend</Text>
          {monthEntries.map(([month, amt]) => (
            <BarRow
              key={month}
              label={month}
              value={amt}
              pct={maxMonthly > 0 ? (parseFloat(amt) / maxMonthly) * 100 : 0}
              color="#10b981"
            />
          ))}
        </View>
      )}

      {/* Spending by member */}
      {memberEntries.length > 0 && (
        <View className="bg-white rounded-2xl border border-slate-100 p-5 mb-4 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Household Contributions</Text>
          {memberEntries.map(([name, amt], i) => {
            const pct = memberTotal > 0 ? (parseFloat(amt) / memberTotal) * 100 : 0;
            return (
              <View key={name} className="mb-3">
                <View className="flex-row items-center gap-3 mb-1">
                  <View className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }}>
                    <Text className="text-white font-black text-xs">{name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text className="flex-1 text-sm font-medium text-slate-700">{name}</Text>
                  <Text className="text-xs text-slate-400">{pct.toFixed(0)}%</Text>
                  <Text className="text-sm font-black text-slate-800">${parseFloat(amt).toFixed(2)}</Text>
                </View>
                <View className="flex-row">
                  <View className="w-11" />
                  <View className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <View className="h-1.5 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

    </View>
  );
}
