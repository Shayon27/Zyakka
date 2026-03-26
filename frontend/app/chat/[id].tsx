import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = async () => {
    try { const d = await api.get(`/api/chat/${id}`); setMessages(d); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    try {
      await api.post(`/api/chat/${id}`, { message: input.trim() });
      setInput('');
      fetchMessages();
    } catch (e: any) { alert(e.message); }
  };

  const isMe = (msg: any) => msg.sender_id === user?.id;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity testID="chat-back-btn" style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#2C2A28" />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle}>Kitchen Chat</Text>
          <Text style={s.headerSub}>Order #{id?.toString().slice(0, 8)}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        testID="chat-messages"
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[s.bubble, isMe(item) ? s.bubbleMe : s.bubbleThem]}>
            {!isMe(item) && <Text style={s.senderName}>{item.sender_name}</Text>}
            <Text style={[s.msgText, isMe(item) ? s.msgTextMe : s.msgTextThem]}>{item.message}</Text>
            <Text style={[s.msgTime, isMe(item) ? s.msgTimeMe : {}]}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="chatbubble-outline" size={40} color="#EFEBE4" />
            <Text style={s.emptyText}>No messages yet. Say hi to the kitchen!</Text>
          </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.inputBar}>
          <TextInput
            testID="chat-input"
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#A09A90"
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity testID="chat-send-btn" style={s.sendBtn} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3EFEA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFEBE4', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { marginLeft: 14 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#2C2A28' },
  headerSub: { fontSize: 12, color: '#A09A90' },
  msgList: { padding: 16, gap: 8, flexGrow: 1 },
  bubble: { maxWidth: '80%', borderRadius: 20, padding: 12, paddingBottom: 6 },
  bubbleMe: { backgroundColor: '#C65D47', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: '700', color: '#C65D47', marginBottom: 2 },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTextMe: { color: '#FFFFFF' },
  msgTextThem: { color: '#2C2A28' },
  msgTime: { fontSize: 10, color: '#A09A90', marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMe: { color: 'rgba(255,255,255,0.6)' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 14, color: '#A09A90', textAlign: 'center' },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', gap: 10 },
  input: { flex: 1, backgroundColor: '#F3EFEA', borderRadius: 100, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, color: '#2C2A28' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#C65D47', alignItems: 'center', justifyContent: 'center' },
});
