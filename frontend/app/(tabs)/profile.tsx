import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
          <View style={styles.roleBadge}><Text style={styles.roleText}>{user?.role}</Text></View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity testID="nav-kitchen" style={styles.menuItem} onPress={() => router.push('/kitchen')}>
            <Ionicons name="restaurant-outline" size={20} color="#C65D47" />
            <Text style={styles.menuText}>Kitchen Dashboard</Text>
            <Ionicons name="chevron-forward" size={18} color="#A09A90" />
          </TouchableOpacity>
          <TouchableOpacity testID="nav-admin" style={styles.menuItem} onPress={() => router.push('/admin')}>
            <Ionicons name="shield-outline" size={20} color="#4A6B53" />
            <Text style={styles.menuText}>Admin Dashboard</Text>
            <Ionicons name="chevron-forward" size={18} color="#A09A90" />
          </TouchableOpacity>
          <TouchableOpacity testID="nav-group-order" style={styles.menuItem} onPress={() => router.push('/group-order')}>
            <Ionicons name="people-outline" size={20} color="#E8B365" />
            <Text style={styles.menuText}>Group Orders</Text>
            <Ionicons name="chevron-forward" size={18} color="#A09A90" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#B74134" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { padding: 24, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#2C2A28', marginBottom: 24 },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#C65D47', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  name: { fontSize: 20, fontWeight: '700', color: '#2C2A28' },
  email: { fontSize: 14, color: '#6B655D', marginTop: 4 },
  phone: { fontSize: 14, color: '#6B655D', marginTop: 2 },
  roleBadge: { backgroundColor: '#EFEBE4', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, marginTop: 12 },
  roleText: { fontSize: 12, fontWeight: '700', color: '#6B655D', textTransform: 'capitalize' },
  menuSection: { marginTop: 24, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14, borderBottomWidth: 1, borderBottomColor: '#F5F3F0' },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#2C2A28' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, padding: 16, backgroundColor: '#FEF2F2', borderRadius: 16 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#B74134' },
});
