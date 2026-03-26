import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function SubscriptionsScreen() {
  const [plans, setPlans] = useState<any[]>([]);
  const [mySubs, setMySubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'plans' | 'my'>('plans');

  const fetchData = async () => {
    try {
      const [p, s] = await Promise.all([api.get('/api/subscriptions/plans'), api.get('/api/subscriptions/my')]);
      setPlans(p); setMySubs(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const subscribe = async (planId: string) => {
    try {
      await api.post('/api/subscriptions', { plan_id: planId });
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const cancel = async (subId: string) => {
    try {
      await api.put(`/api/subscriptions/${subId}/cancel`);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <SafeAreaView style={styles.container} edges={['top']}><ActivityIndicator size="large" color="#C65D47" style={{ marginTop: 40 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Tiffin Plans</Text>
      <Text style={styles.subtitle}>Subscribe to daily meals from local kitchens</Text>
      <View style={styles.tabRow}>
        <TouchableOpacity testID="tab-plans" style={[styles.tabBtn, tab === 'plans' && styles.tabActive]} onPress={() => setTab('plans')}>
          <Text style={[styles.tabText, tab === 'plans' && styles.tabTextActive]}>Browse Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="tab-my-subs" style={[styles.tabBtn, tab === 'my' && styles.tabActive]} onPress={() => setTab('my')}>
          <Text style={[styles.tabText, tab === 'my' && styles.tabTextActive]}>My Subscriptions</Text>
        </TouchableOpacity>
      </View>
      {tab === 'plans' ? (
        <FlatList
          testID="plans-list"
          data={plans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={[styles.planBadge, item.plan_type === '30day' ? styles.planBadge30 : {}]}>
                  <Text style={styles.planBadgeText}>{item.plan_type === '7day' ? '7 Days' : '30 Days'}</Text>
                </View>
                <Text style={styles.planPrice}>${item.price}</Text>
              </View>
              <Text style={styles.planRestaurant}>{item.restaurant_name}</Text>
              <Text style={styles.planDesc}>{item.description}</Text>
              <View style={styles.planFeatures}>
                <View style={styles.featureRow}>
                  <Ionicons name="restaurant-outline" size={14} color="#4A6B53" />
                  <Text style={styles.featureText}>{item.meals_per_day} meals/day</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="time-outline" size={14} color="#4A6B53" />
                  <Text style={styles.featureText}>Daily delivery</Text>
                </View>
              </View>
              <TouchableOpacity testID={`subscribe-btn-${item.id}`} style={styles.subscribeBtn} onPress={() => subscribe(item.id)}>
                <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <FlatList
          testID="my-subs-list"
          data={mySubs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#EFEBE4" />
              <Text style={styles.emptyText}>No active subscriptions</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.subCard}>
              <View style={styles.subTop}>
                <View>
                  <Text style={styles.subRestaurant}>{item.restaurant_name}</Text>
                  <Text style={styles.subPlan}>{item.plan_type === '7day' ? '7-Day' : '30-Day'} Plan</Text>
                </View>
                <View style={[styles.subStatus, item.status === 'active' ? styles.subStatusActive : styles.subStatusCancelled]}>
                  <Text style={[styles.subStatusText, { color: item.status === 'active' ? '#4A6B53' : '#B74134' }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.subDate}>
                {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
              </Text>
              {item.status === 'active' && (
                <TouchableOpacity testID={`cancel-sub-${item.id}`} style={styles.cancelBtn} onPress={() => cancel(item.id)}>
                  <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  title: { fontSize: 24, fontWeight: '700', color: '#2C2A28', paddingHorizontal: 24, paddingTop: 8 },
  subtitle: { fontSize: 14, color: '#6B655D', paddingHorizontal: 24, marginTop: 4 },
  tabRow: { flexDirection: 'row', marginHorizontal: 24, marginTop: 20, backgroundColor: '#EFEBE4', borderRadius: 14, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B655D' },
  tabTextActive: { color: '#2C2A28' },
  list: { padding: 24, gap: 16 },
  planCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planBadge: { backgroundColor: '#E8B36520', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },
  planBadge30: { backgroundColor: '#4A6B5320' },
  planBadgeText: { fontSize: 12, fontWeight: '700', color: '#E8B365' },
  planPrice: { fontSize: 24, fontWeight: '700', color: '#2C2A28' },
  planRestaurant: { fontSize: 18, fontWeight: '600', color: '#2C2A28', marginTop: 12 },
  planDesc: { fontSize: 13, color: '#6B655D', marginTop: 4 },
  planFeatures: { flexDirection: 'row', gap: 16, marginTop: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 12, color: '#4A6B53', fontWeight: '500' },
  subscribeBtn: { backgroundColor: '#C65D47', borderRadius: 100, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  subscribeBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  subCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  subTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  subRestaurant: { fontSize: 16, fontWeight: '600', color: '#2C2A28' },
  subPlan: { fontSize: 13, color: '#6B655D', marginTop: 2 },
  subStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  subStatusActive: { backgroundColor: '#4A6B5320' },
  subStatusCancelled: { backgroundColor: '#B7413420' },
  subStatusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  subDate: { fontSize: 12, color: '#A09A90', marginTop: 10 },
  cancelBtn: { borderWidth: 1, borderColor: '#B74134', borderRadius: 100, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#B74134' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#A09A90' },
});
