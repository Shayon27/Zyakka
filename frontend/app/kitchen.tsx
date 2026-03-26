import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const STATUS_COLORS: Record<string, string> = { placed: '#E8B365', accepted: '#4A6B53', preparing: '#C65D47', out_for_delivery: '#3498DB', delivered: '#27AE60', rejected: '#B74134' };

export default function KitchenDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try { const d = await api.get('/api/kitchen/orders'); setOrders(d); } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); const i = setInterval(fetchOrders, 10000); return () => clearInterval(i); }, []);

  const updateStatus = async (orderId: string, action: string) => {
    try {
      if (action === 'accept') await api.put(`/api/kitchen/orders/${orderId}/accept`);
      else if (action === 'reject') await api.put(`/api/kitchen/orders/${orderId}/reject`);
      else await api.put(`/api/kitchen/orders/${orderId}/status`, { status: action });
      fetchOrders();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity testID="kitchen-back-btn" style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#2C2A28" />
        </TouchableOpacity>
        <Text style={s.title}>Kitchen Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? <ActivityIndicator size="large" color="#C65D47" style={{ marginTop: 40 }} /> : (
        <FlatList
          testID="kitchen-orders-list"
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#C65D47" />}
          ListEmptyComponent={<View style={s.empty}><Ionicons name="restaurant-outline" size={48} color="#EFEBE4" /><Text style={s.emptyText}>No orders yet</Text></View>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <View>
                  <Text style={s.orderNum}>#{item.id?.slice(0, 8)}</Text>
                  <Text style={s.customerName}>{item.user_name || 'Customer'}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#999') + '20' }]}>
                  <Text style={[s.statusText, { color: STATUS_COLORS[item.status] || '#999' }]}>{item.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>

              {item.items?.map((i: any, idx: number) => (
                <Text key={idx} style={s.itemText}>{i.quantity}x {i.name}</Text>
              ))}

              <View style={s.cardFooter}>
                <Text style={s.totalText}>${item.total?.toFixed(2)}</Text>
                <Text style={s.timeText}>{new Date(item.created_at).toLocaleTimeString()}</Text>
              </View>

              {item.status === 'placed' && (
                <View style={s.actionRow}>
                  <TouchableOpacity testID={`accept-order-${item.id}`} style={s.acceptBtn} onPress={() => updateStatus(item.id, 'accept')}>
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                    <Text style={s.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity testID={`reject-order-${item.id}`} style={s.rejectBtn} onPress={() => updateStatus(item.id, 'reject')}>
                    <Ionicons name="close" size={18} color="#B74134" />
                    <Text style={s.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === 'accepted' && (
                <TouchableOpacity testID={`start-prep-${item.id}`} style={s.nextBtn} onPress={() => updateStatus(item.id, 'preparing')}>
                  <Text style={s.nextBtnText}>Start Preparing</Text>
                </TouchableOpacity>
              )}
              {item.status === 'preparing' && (
                <TouchableOpacity testID={`out-delivery-${item.id}`} style={s.nextBtn} onPress={() => updateStatus(item.id, 'out_for_delivery')}>
                  <Text style={s.nextBtnText}>Out for Delivery</Text>
                </TouchableOpacity>
              )}
              {item.status === 'out_for_delivery' && (
                <TouchableOpacity testID={`mark-delivered-${item.id}`} style={[s.nextBtn, { backgroundColor: '#4A6B53' }]} onPress={() => updateStatus(item.id, 'delivered')}>
                  <Text style={s.nextBtnText}>Mark Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFEBE4', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#2C2A28' },
  list: { padding: 20, gap: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#A09A90' },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderNum: { fontSize: 14, fontWeight: '700', color: '#2C2A28' },
  customerName: { fontSize: 12, color: '#6B655D', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  itemText: { fontSize: 13, color: '#6B655D', paddingVertical: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5F3F0' },
  totalText: { fontSize: 16, fontWeight: '700', color: '#2C2A28' },
  timeText: { fontSize: 12, color: '#A09A90' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#4A6B53', borderRadius: 12, paddingVertical: 12 },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: '#B74134', borderRadius: 12, paddingVertical: 12 },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: '#B74134' },
  nextBtn: { backgroundColor: '#C65D47', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
