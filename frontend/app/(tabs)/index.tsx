import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image,
  RefreshControl, ActivityIndicator, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const FILTERS = ['All', 'Veg', 'Non-Veg', 'Top Rated', 'Nearby'];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchRestaurants = useCallback(async () => {
    try {
      let params = '';
      if (search) params += `?search=${encodeURIComponent(search)}`;
      if (activeFilter === 'Veg') params += `${params ? '&' : '?'}is_veg=true`;
      if (activeFilter === 'Top Rated') params += `${params ? '&' : '?'}min_rating=4.5&sort_by=rating`;
      if (activeFilter === 'Nearby') params += `${params ? '&' : '?'}sort_by=distance`;
      const data = await api.get(`/api/restaurants${params}`);
      setRestaurants(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, activeFilter]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  const onRefresh = () => { setRefreshing(true); fetchRestaurants(); };

  const renderRestaurant = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      testID={`restaurant-card-${item.id}`}
      style={[styles.card, index === 0 && styles.heroCard]}
      onPress={() => router.push(`/restaurant/${item.id}`)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image_url }} style={index === 0 ? styles.heroImage : styles.cardImage} />
      <View style={styles.cardOverlay} />
      <View style={styles.cardContent}>
        {item.is_veg && (
          <View style={styles.vegBadge}>
            <View style={styles.vegDot} />
            <Text style={styles.vegText}>Pure Veg</Text>
          </View>
        )}
        <Text style={index === 0 ? styles.heroName : styles.cardName}>{item.name}</Text>
        <Text style={styles.cardCuisine}>{item.cuisine}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#E8B365" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{item.distance_km} km</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{item.prep_time_mins} min</Text>
        </View>
      </View>
      {index === 0 && (
        <View style={styles.heroTag}>
          <Ionicons name="flame" size={12} color="#C65D47" />
          <Text style={styles.heroTagText}>Featured</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</Text>
          <Text style={styles.userName}>{user?.name || 'Food lover'}</Text>
        </View>
        <TouchableOpacity testID="cart-btn" style={styles.cartBtn} onPress={() => router.push('/cart')}>
          <Ionicons name="bag-outline" size={22} color="#2C2A28" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color="#A09A90" />
        <TextInput
          testID="search-input"
          style={styles.searchInput}
          placeholder="Search kitchens or cuisines..."
          placeholderTextColor="#A09A90"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchRestaurants}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity onPress={() => { setSearch(''); }}>
            <Ionicons name="close-circle" size={18} color="#A09A90" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            testID={`filter-${f.toLowerCase().replace(' ', '-')}`}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Restaurant List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#C65D47" />
        </View>
      ) : (
        <FlatList
          testID="restaurant-list"
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={renderRestaurant}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C65D47" />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="restaurant-outline" size={48} color="#EFEBE4" />
              <Text style={styles.emptyText}>No kitchens found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  greeting: { fontSize: 14, color: '#A09A90', fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '700', color: '#2C2A28', marginTop: 2 },
  cartBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFEBE4', alignItems: 'center', justifyContent: 'center' },

  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 100, marginHorizontal: 24, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#2C2A28' },

  filterScroll: { maxHeight: 52, marginTop: 16 },
  filterContent: { paddingHorizontal: 24, gap: 8, alignItems: 'center' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, backgroundColor: '#EFEBE4' },
  filterPillActive: { backgroundColor: '#2C2A28' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6B655D' },
  filterTextActive: { color: '#FFFFFF' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 24, gap: 16 },

  card: { borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFFFFF', height: 180 },
  heroCard: { height: 240 },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  cardContent: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  vegBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(39,174,96,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, alignSelf: 'flex-start', marginBottom: 6 },
  vegDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#27AE60' },
  vegText: { fontSize: 10, fontWeight: '700', color: '#27AE60' },
  heroName: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  cardName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  cardCuisine: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  metaDot: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  heroTag: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  heroTagText: { fontSize: 11, fontWeight: '700', color: '#C65D47' },

  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#A09A90' },
});
