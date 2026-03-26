import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function RestaurantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/api/restaurants/${id}`).then(setRestaurant),
      api.get(`/api/reviews/${id}`).then(setReviews).catch(() => setReviews([])),
    ]).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const addToCart = async (item: any) => {
    try {
      await api.post('/api/cart/add', { item_id: item.id, restaurant_id: id, quantity: 1 });
      alert(`${item.name} added to cart!`);
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color="#C65D47" style={{ marginTop: 40 }} /></SafeAreaView>;
  if (!restaurant) return <SafeAreaView style={styles.container}><Text style={styles.errorText}>Restaurant not found</Text></SafeAreaView>;

  const categories = [...new Set(restaurant.menu?.map((i: any) => i.category) || [])];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: restaurant.image_url }} style={styles.heroImg} />
          <View style={styles.heroOverlay} />
          <TouchableOpacity testID="restaurant-back-btn" style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={styles.heroName}>{restaurant.name}</Text>
            <Text style={styles.heroCuisine}>{restaurant.cuisine}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.metaChip}><Ionicons name="star" size={14} color="#E8B365" /><Text style={styles.metaChipText}>{restaurant.rating}</Text></View>
              <View style={styles.metaChip}><Ionicons name="location" size={14} color="#FFF" /><Text style={styles.metaChipText}>{restaurant.distance_km} km</Text></View>
              <View style={styles.metaChip}><Ionicons name="time" size={14} color="#FFF" /><Text style={styles.metaChipText}>{restaurant.prep_time_mins} min</Text></View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.desc}>{restaurant.description}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Fee</Text>
            <Text style={styles.infoValue}>${restaurant.delivery_fee?.toFixed(2)}</Text>
          </View>

          {categories.map((cat) => (
            <View key={cat as string} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{cat as string}</Text>
              {restaurant.menu?.filter((i: any) => i.category === cat).map((item: any) => (
                <View key={item.id} style={[styles.menuItem, !item.is_available && styles.menuItemDisabled]}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.vegIndicator}>
                      <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#27AE60' : '#C0392B' }]} />
                    </View>
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                      <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                    </View>
                  </View>
                  {item.is_available ? (
                    <TouchableOpacity testID={`add-to-cart-${item.id}`} style={styles.addBtn} onPress={() => addToCart(item)}>
                      <Ionicons name="add" size={20} color="#C65D47" />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.outOfStock}>Out of stock</Text>
                  )}
                </View>
              ))}
            </View>
          ))}

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.categoryTitle}>CUSTOMER REVIEWS ({reviews.length})</Text>
              {reviews.slice(0, 5).map((review: any) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewInitial}>{review.user_name?.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewerName}>{review.user_name}</Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={12} color="#E8B365" />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                  </View>
                  {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity testID="view-cart-btn" style={styles.viewCartBtn} onPress={() => router.push('/cart')}>
          <Ionicons name="bag" size={20} color="#FFF" />
          <Text style={styles.viewCartText}>View Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  errorText: { textAlign: 'center', marginTop: 40, color: '#B74134' },
  heroWrap: { height: 260, position: 'relative' },
  heroImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  backBtn: { position: 'absolute', top: 12, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  heroContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  heroName: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  heroCuisine: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  heroMeta: { flexDirection: 'row', gap: 8, marginTop: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  metaChipText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  body: { padding: 24 },
  desc: { fontSize: 14, color: '#6B655D', lineHeight: 20, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EFEBE4', marginBottom: 8 },
  infoLabel: { fontSize: 13, color: '#A09A90' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#2C2A28' },
  categorySection: { marginTop: 20 },
  categoryTitle: { fontSize: 11, fontWeight: '700', color: '#A09A90', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  menuItemDisabled: { opacity: 0.5 },
  menuItemLeft: { flexDirection: 'row', flex: 1, gap: 12 },
  vegIndicator: { width: 16, height: 16, borderWidth: 1.5, borderColor: '#27AE60', borderRadius: 3, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  menuItemInfo: { flex: 1 },
  menuItemName: { fontSize: 15, fontWeight: '600', color: '#2C2A28' },
  menuItemDesc: { fontSize: 12, color: '#A09A90', marginTop: 2 },
  menuItemPrice: { fontSize: 15, fontWeight: '700', color: '#C65D47', marginTop: 6 },
  addBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1.5, borderColor: '#C65D47', alignItems: 'center', justifyContent: 'center' },
  outOfStock: { fontSize: 11, color: '#B74134', fontWeight: '600' },
  bottomBar: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#FAF7F2', borderTopWidth: 1, borderTopColor: '#EFEBE4' },
  viewCartBtn: { backgroundColor: '#C65D47', borderRadius: 100, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  viewCartText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  // Reviews
  reviewsSection: { marginTop: 24 },
  reviewItem: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFEBE4', alignItems: 'center', justifyContent: 'center' },
  reviewInitial: { fontSize: 14, fontWeight: '700', color: '#6B655D' },
  reviewerName: { fontSize: 13, fontWeight: '600', color: '#2C2A28' },
  reviewStars: { flexDirection: 'row', gap: 1, marginTop: 2 },
  reviewDate: { fontSize: 11, color: '#A09A90' },
  reviewComment: { fontSize: 13, color: '#6B655D', lineHeight: 18, marginTop: 2 },
});
