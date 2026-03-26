import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

const STATUS_COLORS: Record<string, string> = {
  placed: '#E8B365', accepted: '#4A6B53', preparing: '#C65D47',
  out_for_delivery: '#3498DB', delivered: '#27AE60', rejected: '#B74134',
};

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await api.get('/api/orders');
      setOrders(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>My Orders</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#C65D47" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          testID="orders-list"
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#C65D47" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color="#EFEBE4" />
              <Text style={styles.emptyText}>No orders yet</Text>
              <TouchableOpacity style={styles.orderBtn} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.orderBtnText}>Browse Kitchens</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity testID={`order-item-${item.id}`} style={styles.card} onPress={() => router.push(`/order/${item.id}`)}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.cardName}>{item.restaurant_name}</Text>
                  <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#999') + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]} />
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#999' }]}>{item.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.cardItems}>{item.items?.length || 0} items</Text>
                <Text style={styles.cardTotal}>${item.total?.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  title: { fontSize: 24, fontWeight: '700', color: '#2C2A28', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  list: { padding: 24, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { fontSize: 16, fontWeight: '600', color: '#2C2A28' },
  cardDate: { fontSize: 12, color: '#A09A90', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F5F3F0' },
  cardItems: { fontSize: 13, color: '#6B655D' },
  cardTotal: { fontSize: 17, fontWeight: '700', color: '#2C2A28' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#A09A90' },
  orderBtn: { backgroundColor: '#C65D47', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100, marginTop: 8 },
  orderBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
});
