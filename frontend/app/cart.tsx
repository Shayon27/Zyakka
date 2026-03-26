import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zeroWaste, setZeroWaste] = useState(false);

  const fetchCart = async () => {
    try { const d = await api.get('/api/cart'); setCart(d); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (itemId: string, qty: number) => {
    try { await api.put('/api/cart/update', { item_id: itemId, quantity: qty }); fetchCart(); } catch (e: any) { alert(e.message); }
  };

  const placeOrder = async () => {
    try {
      const order = await api.post('/api/orders', { zero_waste: zeroWaste, delivery_address: '123 Main St', special_instructions: '' });
      router.push(`/order/${order.id}`);
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#C65D47" style={{ marginTop: 40 }} /></SafeAreaView>;

  const items = cart?.items || [];
  const zwDeposit = zeroWaste ? 1.0 : 0;
  const total = (cart?.total || 0) + zwDeposit;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity testID="cart-back-btn" style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#2C2A28" />
        </TouchableOpacity>
        <Text style={s.title}>Your Cart</Text>
        <View style={{ width: 40 }} />
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="bag-outline" size={56} color="#EFEBE4" />
          <Text style={s.emptyText}>Your cart is empty</Text>
          <TouchableOpacity style={s.shopBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={s.shopBtnText}>Browse Kitchens</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            <Text style={s.restName}>{cart?.restaurant_name}</Text>
            {items.map((item: any) => (
              <View key={item.item_id} style={s.itemCard}>
                <View style={s.itemInfo}>
                  <View style={s.vegInd}><View style={[s.vegDot, { backgroundColor: item.is_veg ? '#27AE60' : '#C0392B' }]} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{item.name}</Text>
                    <Text style={s.itemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={s.qtyRow}>
                  <TouchableOpacity testID={`qty-minus-${item.item_id}`} style={s.qtyBtn} onPress={() => updateQty(item.item_id, item.quantity - 1)}>
                    <Ionicons name="remove" size={18} color="#C65D47" />
                  </TouchableOpacity>
                  <Text style={s.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity testID={`qty-plus-${item.item_id}`} style={s.qtyBtn} onPress={() => updateQty(item.item_id, item.quantity + 1)}>
                    <Ionicons name="add" size={18} color="#C65D47" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Zero Waste Toggle */}
            <View style={s.zwCard}>
              <View style={s.zwInfo}>
                <Ionicons name="leaf" size={22} color="#4A6B53" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.zwTitle}>Zero-Waste Packaging</Text>
                  <Text style={s.zwDesc}>Reusable containers (+$1.00 refundable deposit)</Text>
                </View>
              </View>
              <Switch
                testID="zero-waste-toggle"
                value={zeroWaste}
                onValueChange={setZeroWaste}
                trackColor={{ false: '#EFEBE4', true: '#4A6B53' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Price Summary */}
            <View style={s.priceCard}>
              <View style={s.priceRow}><Text style={s.priceLabel}>Subtotal</Text><Text style={s.priceVal}>${cart?.subtotal?.toFixed(2)}</Text></View>
              <View style={s.priceRow}><Text style={s.priceLabel}>Tax (8%)</Text><Text style={s.priceVal}>${cart?.tax?.toFixed(2)}</Text></View>
              <View style={s.priceRow}><Text style={s.priceLabel}>Delivery Fee</Text><Text style={s.priceVal}>${cart?.delivery_fee?.toFixed(2)}</Text></View>
              {zeroWaste && <View style={s.priceRow}><Text style={[s.priceLabel, { color: '#4A6B53' }]}>Zero-Waste Deposit</Text><Text style={[s.priceVal, { color: '#4A6B53' }]}>$1.00</Text></View>}
              <View style={[s.priceRow, s.totalRow]}>
                <Text style={s.totalLabel}>Total</Text>
                <Text style={s.totalVal}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={s.bottomBar}>
            <TouchableOpacity testID="place-order-btn" style={s.orderBtn} onPress={placeOrder} activeOpacity={0.85}>
              <Text style={s.orderBtnText}>Place Order • ${total.toFixed(2)}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFEBE4', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#2C2A28' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#A09A90' },
  shopBtn: { backgroundColor: '#C65D47', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100, marginTop: 8 },
  shopBtnText: { color: '#FFF', fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 100 },
  restName: { fontSize: 14, fontWeight: '600', color: '#6B655D', marginBottom: 16 },
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  itemInfo: { flexDirection: 'row', flex: 1, gap: 10 },
  vegInd: { width: 16, height: 16, borderWidth: 1.5, borderRadius: 3, borderColor: '#27AE60', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#2C2A28' },
  itemPrice: { fontSize: 13, color: '#C65D47', fontWeight: '600', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1.5, borderColor: '#C65D47', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 16, fontWeight: '700', color: '#2C2A28', minWidth: 20, textAlign: 'center' },
  zwCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0F7F2', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#4A6B5320' },
  zwInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  zwTitle: { fontSize: 14, fontWeight: '600', color: '#2C2A28' },
  zwDesc: { fontSize: 11, color: '#4A6B53', marginTop: 2 },
  priceCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginTop: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  priceLabel: { fontSize: 14, color: '#6B655D' },
  priceVal: { fontSize: 14, color: '#2C2A28', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#F5F3F0', marginTop: 8, paddingTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#2C2A28' },
  totalVal: { fontSize: 20, fontWeight: '700', color: '#C65D47' },
  bottomBar: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FAF7F2', borderTopWidth: 1, borderTopColor: '#EFEBE4' },
  orderBtn: { backgroundColor: '#C65D47', borderRadius: 100, paddingVertical: 18, alignItems: 'center', shadowColor: '#C65D47', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  orderBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
});
