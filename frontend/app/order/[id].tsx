import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

const STEPS = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'];

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = () => api.get(`/api/orders/${id}`).then(setOrder).catch(console.error).finally(() => setLoading(false));
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#C65D47" style={{ marginTop: 40 }} /></SafeAreaView>;
  if (!order) return <SafeAreaView style={s.container}><Text style={{ textAlign: 'center', marginTop: 40 }}>Order not found</Text></SafeAreaView>;

  const currentStep = STEPS.indexOf(order.status);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity testID="order-back-btn" style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#2C2A28" />
        </TouchableOpacity>
        <Text style={s.title}>Order Tracking</Text>
        <TouchableOpacity testID="order-chat-btn" onPress={() => router.push(`/chat/${order.id}`)}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#C65D47" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.statusCard}>
          <Text style={s.statusLabel}>ORDER STATUS</Text>
          <Text style={s.statusValue}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
          {order.estimated_prep_time && <Text style={s.prepTime}>Est. {order.estimated_prep_time} min prep time</Text>}
        </View>

        {/* Progress Steps */}
        <View style={s.stepsCard}>
          {STEPS.map((step, i) => (
            <View key={step} style={s.stepRow}>
              <View style={s.stepIndicator}>
                <View style={[s.stepDot, i <= currentStep ? s.stepDotActive : {}, order.status === 'rejected' && i === 0 ? s.stepDotRejected : {}]}>
                  {i <= currentStep && order.status !== 'rejected' && <Ionicons name="checkmark" size={12} color="#FFF" />}
                  {order.status === 'rejected' && i === 0 && <Ionicons name="close" size={12} color="#FFF" />}
                </View>
                {i < STEPS.length - 1 && <View style={[s.stepLine, i < currentStep ? s.stepLineActive : {}]} />}
              </View>
              <Text style={[s.stepText, i <= currentStep ? s.stepTextActive : {}]}>{step.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>

        {/* Order Details */}
        <View style={s.detailCard}>
          <Text style={s.detailTitle}>{order.restaurant_name}</Text>
          {order.items?.map((item: any, i: number) => (
            <View key={i} style={s.itemRow}>
              <Text style={s.itemQty}>{item.quantity}x</Text>
              <Text style={s.itemName}>{item.name}</Text>
              <Text style={s.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={s.divider} />
          <View style={s.totalRow}><Text style={s.totalLabel}>Total</Text><Text style={s.totalVal}>${order.total?.toFixed(2)}</Text></View>
          {order.zero_waste && (
            <View style={s.zwBadge}><Ionicons name="leaf" size={14} color="#4A6B53" /><Text style={s.zwText}>Zero-Waste Packaging</Text></View>
          )}
        </View>

        <Text style={s.orderId}>Order #{order.id?.slice(0, 8)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFEBE4', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#2C2A28' },
  scroll: { padding: 20, gap: 16 },
  statusCard: { backgroundColor: '#C65D47', borderRadius: 24, padding: 24, alignItems: 'center' },
  statusLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  statusValue: { fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: 4, textTransform: 'capitalize' },
  prepTime: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  stepsCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, minHeight: 40 },
  stepIndicator: { alignItems: 'center', width: 24 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EFEBE4', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#4A6B53' },
  stepDotRejected: { backgroundColor: '#B74134' },
  stepLine: { width: 2, height: 16, backgroundColor: '#EFEBE4', marginVertical: 2 },
  stepLineActive: { backgroundColor: '#4A6B53' },
  stepText: { fontSize: 14, color: '#A09A90', textTransform: 'capitalize', paddingTop: 2 },
  stepTextActive: { color: '#2C2A28', fontWeight: '600' },
  detailCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  detailTitle: { fontSize: 16, fontWeight: '600', color: '#2C2A28', marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  itemQty: { fontSize: 13, fontWeight: '700', color: '#C65D47', width: 28 },
  itemName: { flex: 1, fontSize: 14, color: '#2C2A28' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#2C2A28' },
  divider: { height: 1, backgroundColor: '#F5F3F0', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#2C2A28' },
  totalVal: { fontSize: 18, fontWeight: '700', color: '#C65D47' },
  zwBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F7F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, marginTop: 12, alignSelf: 'flex-start' },
  zwText: { fontSize: 12, fontWeight: '600', color: '#4A6B53' },
  orderId: { fontSize: 12, color: '#A09A90', textAlign: 'center', marginTop: 8 },
});
