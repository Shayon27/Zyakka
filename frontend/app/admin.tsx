import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [s, p] = await Promise.all([api.get('/api/admin/stats'), api.get('/api/admin/payouts')]);
      setStats(s); setPayouts(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#C65D47" style={{ marginTop: 40 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#C65D47" />}>
        <View style={s.header}>
          <TouchableOpacity testID="admin-back-btn" style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#2C2A28" />
          </TouchableOpacity>
          <Text style={s.title}>Admin Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats Grid */}
        <View style={s.statsGrid}>
          <View style={[s.statCard, { backgroundColor: '#C65D47' }]}>
            <Ionicons name="receipt" size={24} color="#FFF" />
            <Text style={s.statNum}>{stats?.total_orders || 0}</Text>
            <Text style={s.statLabel}>Total Orders</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: '#4A6B53' }]}>
            <Ionicons name="pulse" size={24} color="#FFF" />
            <Text style={s.statNum}>{stats?.active_orders || 0}</Text>
            <Text style={s.statLabel}>Active Orders</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: '#E8B365' }]}>
            <Ionicons name="cash" size={24} color="#FFF" />
            <Text style={s.statNum}>${stats?.total_revenue?.toFixed(0) || 0}</Text>
            <Text style={s.statLabel}>Revenue</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: '#2C2A28' }]}>
            <Ionicons name="people" size={24} color="#FFF" />
            <Text style={s.statNum}>{stats?.total_users || 0}</Text>
            <Text style={s.statLabel}>Customers</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Total Kitchens</Text>
            <Text style={s.infoVal}>{stats?.total_kitchens || 0}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Active Subscriptions</Text>
            <Text style={s.infoVal}>{stats?.total_subscriptions || 0}</Text>
          </View>
        </View>

        {/* Payouts (85/15 Split) */}
        <Text style={s.sectionTitle}>Kitchen Payouts (85/15 Split)</Text>
        {payouts.length === 0 ? (
          <Text style={s.noData}>No payout data yet</Text>
        ) : payouts.map((p, i) => (
          <View key={i} style={s.payoutCard}>
            <Text style={s.payoutName}>{p.restaurant_name}</Text>
            <View style={s.payoutRow}>
              <View style={s.payoutItem}>
                <Text style={s.payoutLabel}>Orders</Text>
                <Text style={s.payoutVal}>{p.order_count}</Text>
              </View>
              <View style={s.payoutItem}>
                <Text style={s.payoutLabel}>Revenue</Text>
                <Text style={s.payoutVal}>${p.total_revenue?.toFixed(2)}</Text>
              </View>
              <View style={s.payoutItem}>
                <Text style={[s.payoutLabel, { color: '#4A6B53' }]}>Kitchen (85%)</Text>
                <Text style={[s.payoutVal, { color: '#4A6B53' }]}>${p.kitchen_share?.toFixed(2)}</Text>
              </View>
              <View style={s.payoutItem}>
                <Text style={[s.payoutLabel, { color: '#C65D47' }]}>Platform (15%)</Text>
                <Text style={[s.payoutVal, { color: '#C65D47' }]}>${p.platform_share?.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Demand Data */}
        {stats?.demand_data?.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Demand Heatmap</Text>
            {stats.demand_data.map((d: any, i: number) => (
              <View key={i} style={s.demandRow}>
                <Text style={s.demandName}>{d._id || 'Unknown'}</Text>
                <View style={s.demandBar}>
                  <View style={[s.demandFill, { width: `${Math.min((d.order_count / (stats.demand_data[0]?.order_count || 1)) * 100, 100)}%` }]} />
                </View>
                <Text style={s.demandCount}>{d.order_count}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFEBE4', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#2C2A28' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', borderRadius: 20, padding: 18 },
  statNum: { fontSize: 28, fontWeight: '700', color: '#FFF', marginTop: 10 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginTop: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 14, color: '#6B655D' },
  infoVal: { fontSize: 16, fontWeight: '700', color: '#2C2A28' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2C2A28', marginTop: 24, marginBottom: 12 },
  noData: { fontSize: 14, color: '#A09A90', textAlign: 'center' },
  payoutCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  payoutName: { fontSize: 15, fontWeight: '600', color: '#2C2A28', marginBottom: 10 },
  payoutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  payoutItem: { width: '46%' },
  payoutLabel: { fontSize: 11, color: '#A09A90', fontWeight: '600' },
  payoutVal: { fontSize: 15, fontWeight: '700', color: '#2C2A28', marginTop: 2 },
  demandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  demandName: { fontSize: 12, color: '#6B655D', width: 100 },
  demandBar: { flex: 1, height: 8, backgroundColor: '#EFEBE4', borderRadius: 4, overflow: 'hidden' },
  demandFill: { height: '100%', backgroundColor: '#C65D47', borderRadius: 4 },
  demandCount: { fontSize: 12, fontWeight: '700', color: '#2C2A28', width: 30, textAlign: 'right' },
});
