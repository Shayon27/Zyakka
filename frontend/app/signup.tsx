import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), phone.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity testID="signup-back-btn" style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2C2A28" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image
            source={require('../assets/images/zyakka-logo.jpg')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join thousands enjoying fresh, local meals daily</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#A09A90" style={styles.inputIcon} />
              <TextInput testID="signup-name-input" style={styles.input} placeholder="John Doe" placeholderTextColor="#A09A90" value={name} onChangeText={setName} autoCapitalize="words" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#A09A90" style={styles.inputIcon} />
              <TextInput testID="signup-email-input" style={styles.input} placeholder="your@email.com" placeholderTextColor="#A09A90" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PHONE (OPTIONAL)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#A09A90" style={styles.inputIcon} />
              <TextInput testID="signup-phone-input" style={styles.input} placeholder="+91 9876543210" placeholderTextColor="#A09A90" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#A09A90" style={styles.inputIcon} />
              <TextInput testID="signup-password-input" style={[styles.input, { flex: 1 }]} placeholder="Min 6 characters" placeholderTextColor="#A09A90" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#A09A90" />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#B74134" />
              <Text testID="signup-error-text" style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            testID="signup-submit-btn"
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity testID="goto-login-btn" style={styles.loginLink} onPress={() => router.push('/login')}>
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFEBE4', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  header: { marginBottom: 32 },
  logoImg: { width: 100, height: 100, alignSelf: 'flex-start', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '600', color: '#2C2A28', letterSpacing: -1 },
  subtitle: { fontSize: 15, color: '#6B655D', marginTop: 8, lineHeight: 22 },
  form: { gap: 18 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#A09A90', letterSpacing: 1.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#2C2A28' },
  eyeBtn: { padding: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  errorText: { fontSize: 13, color: '#B74134', flex: 1 },
  submitBtn: { backgroundColor: '#C65D47', borderRadius: 100, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, shadowColor: '#C65D47', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  loginLink: { alignItems: 'center', marginTop: 28 },
  loginLinkText: { fontSize: 15, color: '#6B655D' },
  loginLinkBold: { fontWeight: '700', color: '#C65D47' },
});
