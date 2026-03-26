import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'kitchen') router.replace('/kitchen');
        else if (user.role === 'admin') router.replace('/admin');
        else router.replace('/(tabs)');
      } else {
        setReady(true);
      }
    }
  }, [user, loading]);

  if (loading || !ready) {
    return (
      <View style={styles.splashContainer} testID="splash-screen">
        <Text style={styles.splashLogo}>Zyakka</Text>
        <Text style={styles.splashTagline}>Fresh meals, delivered with care</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} bounces={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/5865234/pexels-photo-5865234.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.logoBadge}>
            <Ionicons name="leaf" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.heroLogo}>Zyakka</Text>
          <Text style={styles.heroSubtitle}>The mindful way to eat</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <Text style={styles.headline}>Home-cooked meals{'\n'}delivered to your{'\n'}doorstep</Text>
        <Text style={styles.description}>
          Subscribe to local kitchens, order with friends, and choose sustainable packaging — all in one app.
        </Text>

        {/* Feature Pills */}
        <View style={styles.featurePills}>
          <View style={styles.pill}>
            <Ionicons name="calendar-outline" size={16} color="#4A6B53" />
            <Text style={styles.pillText}>Tiffin Plans</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="people-outline" size={16} color="#C65D47" />
            <Text style={styles.pillText}>Group Orders</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="leaf-outline" size={16} color="#4A6B53" />
            <Text style={styles.pillText}>Zero Waste</Text>
          </View>
        </View>

        {/* Bento Grid - Visual Feature Cards */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoRow}>
            <View style={[styles.bentoCard, styles.bentoLarge]}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400' }}
                style={styles.bentoImage}
              />
              <View style={styles.bentoCardOverlay} />
              <View style={styles.bentoCardContent}>
                <Text style={styles.bentoLabel}>SUBSCRIBE</Text>
                <Text style={styles.bentoTitle}>7 & 30 Day{'\n'}Meal Plans</Text>
              </View>
            </View>
            <View style={styles.bentoSmallCol}>
              <View style={[styles.bentoCard, styles.bentoSmall, { backgroundColor: '#C65D47' }]}>
                <Ionicons name="chatbubble-ellipses" size={28} color="#FFF" />
                <Text style={styles.bentoSmallText}>Direct{'\n'}Kitchen Chat</Text>
              </View>
              <View style={[styles.bentoCard, styles.bentoSmall, { backgroundColor: '#4A6B53' }]}>
                <Ionicons name="bicycle" size={28} color="#FFF" />
                <Text style={styles.bentoSmallText}>Real-time{'\n'}Tracking</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <TouchableOpacity
          testID="get-started-btn"
          style={styles.primaryBtn}
          onPress={() => router.push('/signup')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          testID="login-btn"
          style={styles.secondaryBtn}
          onPress={() => router.push('/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Already have an account? Log in</Text>
        </TouchableOpacity>

        {/* Trust Indicators */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>50+</Text>
            <Text style={styles.trustLabel}>Local Kitchens</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>4.8</Text>
            <Text style={styles.trustLabel}>Avg Rating</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>15 min</Text>
            <Text style={styles.trustLabel}>Avg Delivery</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scrollContent: { flexGrow: 1 },
  splashContainer: { flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  splashLogo: { fontSize: 52, fontWeight: '600', color: '#C65D47', letterSpacing: -2 },
  splashTagline: { fontSize: 16, color: '#6B655D', marginTop: 8 },

  // Hero
  heroSection: { height: height * 0.38, position: 'relative', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroContent: {
    position: 'absolute', bottom: 32, left: 24, right: 24,
  },
  logoBadge: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#4A6B53',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroLogo: { fontSize: 42, fontWeight: '600', color: '#FFFFFF', letterSpacing: -2 },
  heroSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  // Main
  mainContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },
  headline: {
    fontSize: 32, fontWeight: '600', color: '#2C2A28', lineHeight: 38, letterSpacing: -1,
  },
  description: {
    fontSize: 15, color: '#6B655D', lineHeight: 22, marginTop: 16, maxWidth: 320,
  },

  // Feature Pills
  featurePills: { flexDirection: 'row', marginTop: 24, gap: 8, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFEBE4', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 100,
  },
  pillText: { fontSize: 13, fontWeight: '600', color: '#2C2A28' },

  // Bento Grid
  bentoGrid: { marginTop: 28 },
  bentoRow: { flexDirection: 'row', gap: 12, height: 220 },
  bentoCard: { borderRadius: 24, overflow: 'hidden', position: 'relative' },
  bentoLarge: { flex: 1.2, height: '100%' },
  bentoSmallCol: { flex: 0.8, gap: 12 },
  bentoSmall: {
    flex: 1, borderRadius: 24, padding: 16, justifyContent: 'flex-end',
  },
  bentoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bentoCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bentoCardContent: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  bentoLabel: {
    fontSize: 10, fontWeight: '700', color: '#E8B365', letterSpacing: 2, marginBottom: 4,
  },
  bentoTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', lineHeight: 22 },
  bentoSmallText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', lineHeight: 17, marginTop: 8 },

  // Buttons
  primaryBtn: {
    backgroundColor: '#C65D47', borderRadius: 100, paddingVertical: 18, paddingHorizontal: 32,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32,
    shadowColor: '#C65D47', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtn: {
    paddingVertical: 16, alignItems: 'center', marginTop: 12,
  },
  secondaryBtnText: { fontSize: 15, color: '#6B655D', fontWeight: '500' },

  // Trust
  trustRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#EFEBE4',
  },
  trustItem: { alignItems: 'center', flex: 1 },
  trustNumber: { fontSize: 20, fontWeight: '700', color: '#2C2A28' },
  trustLabel: { fontSize: 11, color: '#A09A90', fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  trustDivider: { width: 1, height: 32, backgroundColor: '#EFEBE4' },
});
