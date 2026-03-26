import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function GroupOrderScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [selectedRest, setSelectedRest] = useState('');

  const fetchData = async () => {
    try {
      const [g, r] = await Promise.all([api.get('/api/group-orders'), api.get('/api/restaurants')]);
      setGroups(g); setRestaurants(r);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const createGroup = async () => {
    if (!name.trim() || !selectedRest) { alert('Please fill in all fields'); return; }
    try {
      await api.post('/api/group-orders', { name: name.trim(), restaurant_id: selectedRest });
      setName(''); setSelectedRest(''); setCreating(false); fetchData();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#C65D47" style={{ marginTop: 40 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity testID="group-back-btn" style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#2C2A28" />
        </TouchableOpacity>
        <Text style={s.title}>Group Orders</Text>
        <TouchableOpacity testID="create-group-btn" onPress={() => setCreating(!creating)}>
          <Ionicons name={creating ? 'close' : 'add-circle'} size={28} color="#C65D47" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {creating && (
          <View style={s.createCard}>
            <Text style={s.createTitle}>Create Group Order</Text>
            <TextInput testID="group-name-input" style={s.input} placeholder="Group name (e.g., Office Lunch)" placeholderTextColor="#A09A90" value={name} onChangeText={setName} />
            <Text style={s.selectLabel}>Select Restaurant</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.restScroll}>
              {restaurants.map((r) => (
                <TouchableOpacity key={r.id} testID={`select-rest-${r.id}`} style={[s.restChip, selectedRest === r.id && s.restChipActive]} onPress={() => setSelectedRest(r.id)}>
                  <Text style={[s.restChipText, selectedRest === r.id && s.restChipTextActive]}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity testID="submit-group-btn" style={s.submitBtn} onPress={createGroup}>
              <Text style={s.submitBtnText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={s.sectionTitle}>Your Groups</Text>
        {groups.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color="#EFEBE4" />
            <Text style={s.emptyText}>No group orders yet</Text>
          </View>
        ) : groups.map((g) => (
          <View key={g.id} style={s.groupCard}>
            <View style={s.groupHeader}>
              <Text style={s.groupName}>{g.name}</Text>
              <View style={[s.statusBadge, { backgroundColor: g.status === 'open' ? '#4A6B5320' : '#E8B36520' }]}>
                <Text style={[s.statusText, { color: g.status === 'open' ? '#4A6B53' : '#E8B365' }]}>{g.status}</Text>
              </View>
            </View>
            <Text style={s.groupRest}>{g.restaurant_name}</Text>
            <View style={s.membersRow}>
              {g.members?.slice(0, 5).map((m: any, i: number) => (
                <View key={i} style={[s.memberAvatar, { marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i }]}>
                  <Text style={s.memberInitial}>{m.user_name?.charAt(0)}</Text>
                </View>
              ))}
              <Text style={s.memberCount}>{g.members?.length} member{g.members?.length !== 1 ? 's' : ''}</Text>
            </View>
            {g.total > 0 && <Text style={s.groupTotal}>Total: ${g.total?.toFixed(2)}</Text>}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFEBE4', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#2C2A28' },
  scroll: { padding: 20, paddingBottom: 40 },
  createCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  createTitle: { fontSize: 16, fontWeight: '700', color: '#2C2A28', marginBottom: 14 },
  input: { backgroundColor: '#F3EFEA', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#2C2A28', marginBottom: 14 },
  selectLabel: { fontSize: 12, fontWeight: '600', color: '#6B655D', marginBottom: 8 },
  restScroll: { marginBottom: 16 },
  restChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, backgroundColor: '#EFEBE4', marginRight: 8 },
  restChipActive: { backgroundColor: '#C65D47' },
  restChipText: { fontSize: 13, fontWeight: '600', color: '#6B655D' },
  restChipTextActive: { color: '#FFF' },
  submitBtn: { backgroundColor: '#C65D47', borderRadius: 100, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2C2A28', marginBottom: 12 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 15, color: '#A09A90' },
  groupCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupName: { fontSize: 16, fontWeight: '600', color: '#2C2A28' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  groupRest: { fontSize: 13, color: '#6B655D', marginTop: 4 },
  membersRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  memberAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFEBE4', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  memberInitial: { fontSize: 11, fontWeight: '700', color: '#6B655D' },
  memberCount: { fontSize: 12, color: '#A09A90', marginLeft: 4 },
  groupTotal: { fontSize: 15, fontWeight: '700', color: '#C65D47', marginTop: 10 },
});
