import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

const STEPS = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'];

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [existingReview, setExistingReview] = useState<any>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchData = async () => {
    try {
      const [o, t] = await Promise.all([
        api.get(`/api/orders/${id}`),
        api.get(`/api/delivery/track/${id}`),
      ]);
      setOrder(o);
      setTracking(t);
      // Check if user already reviewed
      try {
        const rev = await api.get(`/api/reviews/order/${id}`);
        if (rev) setExistingReview(rev);
      } catch {}
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const submitReview = async () => {
    if (reviewRating === 0) { alert('Please select a rating'); return; }
    setSubmittingReview(true);
    try {
      const review = await api.post('/api/reviews', {
        restaurant_id: order.restaurant_id,
        order_id: order.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setExistingReview(review);
    } catch (e: any) { alert(e.message); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#C65D47" style={{ marginTop: 40 }} /></SafeAreaView>;
  if (!order) return <SafeAreaView style={s.container}><Text style={{ textAlign: 'center', marginTop: 40 }}>Order not found</Text></SafeAreaView>;

  const currentStep = STEPS.indexOf(order.status);
  const isDelivered = order.status === 'delivered';
  const isOutForDelivery = order.status === 'out_for_delivery';

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
        {/* Status Card */}
        <View style={s.statusCard}>
          <Text style={s.statusLabel}>ORDER STATUS</Text>
          <Text style={s.statusValue}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
          {order.estimated_prep_time && <Text style={s.prepTime}>Est. {order.estimated_prep_time} min prep time</Text>}
        </View>

        {/* Delivery Map Simulation */}
        {tracking && (isOutForDelivery || isDelivered) && (
          <View style={s.mapCard}>
            <View style={s.mapHeader}>
              <Ionicons name="navigate" size={18} color="#C65D47" />
              <Text style={s.mapTitle}>Live Delivery Tracking</Text>
            </View>
            <View style={s.mapSimulation}>
              {/* Simulated Map View */}
              <View style={s.mapGrid}>
                {/* Restaurant marker */}
                <View style={[s.marker, s.markerRestaurant, { left: '10%', top: '60%' }]}>
                  <Ionicons name="restaurant" size={14} color="#FFF" />
                </View>
                {/* Delivery partner */}
                {isOutForDelivery && (
                  <View style={[s.marker, s.markerDelivery, { left: `${(tracking.delivery_partner?.progress || 0.5) * 80 + 10}%`, top: `${60 - (tracking.delivery_partner?.progress || 0.5) * 40}%` }]}>
                    <Ionicons name="bicycle" size={14} color="#FFF" />
                  </View>
                )}
                {/* Customer marker */}
                <View style={[s.marker, s.markerCustomer, { left: '85%', top: '20%' }]}>
                  <Ionicons name="home" size={14} color="#FFF" />
                </View>
                {/* Route line */}
                <View style={s.routeLine} />
                {/* Progress overlay */}
                {isOutForDelivery && tracking.delivery_partner?.progress && (
                  <View style={[s.routeProgress, { width: `${tracking.delivery_partner.progress * 75}%` }]} />
                )}
              </View>
            </View>
            <View style={s.mapInfo}>
              <View style={s.mapInfoItem}>
                <View style={[s.mapInfoDot, { backgroundColor: '#E8B365' }]} />
                <Text style={s.mapInfoText}>Restaurant</Text>
              </View>
              {isOutForDelivery && (
                <View style={s.mapInfoItem}>
                  <View style={[s.mapInfoDot, { backgroundColor: '#C65D47' }]} />
                  <Text style={s.mapInfoText}>Delivery Partner</Text>
                </View>
              )}
              <View style={s.mapInfoItem}>
                <View style={[s.mapInfoDot, { backgroundColor: '#4A6B53' }]} />
                <Text style={s.mapInfoText}>Your Location</Text>
              </View>
            </View>
            <Text style={s.trackingHeading}>{tracking.delivery_partner?.heading}</Text>
            {tracking.delivery_partner?.eta_minutes && (
              <View style={s.etaBadge}>
                <Ionicons name="time-outline" size={14} color="#C65D47" />
                <Text style={s.etaText}>ETA: {tracking.delivery_partner.eta_minutes} min</Text>
              </View>
            )}
          </View>
        )}

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

        {/* Review Section - show only for delivered orders */}
        {isDelivered && (
          <View style={s.reviewCard}>
            <Text style={s.reviewTitle}>Rate Your Experience</Text>
            {existingReview ? (
              <View>
                <View style={s.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name={star <= existingReview.rating ? 'star' : 'star-outline'} size={28} color="#E8B365" />
                  ))}
                </View>
                {existingReview.comment ? <Text style={s.reviewCommentText}>{existingReview.comment}</Text> : null}
                <Text style={s.reviewSaved}>Review saved!</Text>
              </View>
            ) : (
              <View>
                <View style={s.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} testID={`star-${star}`} onPress={() => setReviewRating(star)}>
                      <Ionicons name={star <= reviewRating ? 'star' : 'star-outline'} size={32} color="#E8B365" />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  testID="review-comment-input"
                  style={s.reviewInput}
                  placeholder="Share your experience (optional)..."
                  placeholderTextColor="#A09A90"
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  testID="submit-review-btn"
                  style={[s.reviewBtn, submittingReview && { opacity: 0.7 }]}
                  onPress={submitReview}
                  disabled={submittingReview}
                >
                  <Text style={s.reviewBtnText}>{submittingReview ? 'Submitting...' : 'Submit Review'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

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
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },

  statusCard: { backgroundColor: '#C65D47', borderRadius: 24, padding: 24, alignItems: 'center' },
  statusLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  statusValue: { fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: 4, textTransform: 'capitalize' },
  prepTime: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 },

  // Map Simulation
  mapCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  mapTitle: { fontSize: 15, fontWeight: '700', color: '#2C2A28' },
  mapSimulation: { height: 150, backgroundColor: '#F8F5F0', borderRadius: 16, overflow: 'hidden', position: 'relative' },
  mapGrid: { flex: 1, position: 'relative' },
  marker: { position: 'absolute', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', zIndex: 10, marginLeft: -14, marginTop: -14 },
  markerRestaurant: { backgroundColor: '#E8B365' },
  markerDelivery: { backgroundColor: '#C65D47', borderWidth: 3, borderColor: '#FFF', width: 32, height: 32, borderRadius: 16, marginLeft: -16, marginTop: -16 },
  markerCustomer: { backgroundColor: '#4A6B53' },
  routeLine: { position: 'absolute', top: '40%', left: '12%', right: '12%', height: 3, backgroundColor: '#EFEBE4', borderRadius: 2 },
  routeProgress: { position: 'absolute', top: '40%', left: '12%', height: 3, backgroundColor: '#C65D47', borderRadius: 2, minWidth: 10 },
  mapInfo: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },
  mapInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapInfoDot: { width: 8, height: 8, borderRadius: 4 },
  mapInfoText: { fontSize: 11, color: '#6B655D' },
  trackingHeading: { fontSize: 14, fontWeight: '600', color: '#2C2A28', textAlign: 'center', marginTop: 10 },
  etaBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, alignSelf: 'center' },
  etaText: { fontSize: 14, fontWeight: '700', color: '#C65D47' },

  // Steps
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

  // Detail
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

  // Review
  reviewCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: '#2C2A28', marginBottom: 14 },
  starsRow: { flexDirection: 'row', gap: 6, marginBottom: 14, justifyContent: 'center' },
  reviewInput: { backgroundColor: '#F3EFEA', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#2C2A28', minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  reviewBtn: { backgroundColor: '#C65D47', borderRadius: 100, paddingVertical: 14, alignItems: 'center' },
  reviewBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  reviewCommentText: { fontSize: 14, color: '#6B655D', textAlign: 'center', marginVertical: 8, fontStyle: 'italic' },
  reviewSaved: { fontSize: 12, color: '#4A6B53', fontWeight: '600', textAlign: 'center', marginTop: 4 },

  orderId: { fontSize: 12, color: '#A09A90', textAlign: 'center', marginTop: 8 },
});
