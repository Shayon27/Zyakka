import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      if (demoEmail.includes('kitchen')) router.replace('/kitchen');
      else if (demoEmail.includes('admin')) router.replace('/admin');
      else router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          testID="login-back-btn"
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2C2A28" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/images/zyakka-logo.jpg')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue ordering from your favorite kitchens</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#A09A90" style={styles.inputIcon} />
              <TextInput
                testID="login-email-input"
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#A09A90"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#A09A90" style={styles.inputIcon} />
              <TextInput
                testID="login-password-input"
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter password"
                placeholderTextColor="#A09A90"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                testID="toggle-password-btn"
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#A09A90" />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#B74134" />
              <Text testID="login-error-text" style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            testID="login-submit-btn"
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>QUICK ACCESS</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Demo Accounts */}
        <View style={styles.demoSection}>
          <TouchableOpacity
            testID="demo-kitchen-btn"
            style={styles.demoBtn}
            onPress={() => handleDemoLogin('kitchen1@zyakka.com', 'kitchen123')}
          >
            <View style={[styles.demoBtnIcon, { backgroundColor: '#E8B365' }]}>
              <Ionicons name="restaurant-outline" size={18} color="#FFF" />
            </View>
            <View style={styles.demoBtnTextWrap}>
              <Text style={styles.demoBtnTitle}>Kitchen Owner</Text>
              <Text style={styles.demoBtnSub}>Manage orders & menu</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A09A90" />
          </TouchableOpacity>

          <TouchableOpacity
            testID="demo-admin-btn"
            style={styles.demoBtn}
            onPress={() => handleDemoLogin('admin@zyakka.com', 'admin123')}
          >
            <View style={[styles.demoBtnIcon, { backgroundColor: '#4A6B53' }]}>
              <Ionicons name="shield-outline" size={18} color="#FFF" />
            </View>
            <View style={styles.demoBtnTextWrap}>
              <Text style={styles.demoBtnTitle}>Admin Dashboard</Text>
              <Text style={styles.demoBtnSub}>Monitor & analytics</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A09A90" />
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <TouchableOpacity
          testID="goto-signup-btn"
          style={styles.signupLink}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.signupLinkText}>
            Don't have an account? <Text style={styles.signupLinkBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },

  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFEBE4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },

  header: { marginBottom: 36 },
  logoImg: { width: 120, height: 120, alignSelf: 'flex-start', marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '600', color: '#2C2A28', letterSpacing: -1 },
  subtitle: { fontSize: 15, color: '#6B655D', marginTop: 8, lineHeight: 22 },

  form: { gap: 20 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#A09A90', letterSpacing: 1.5 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16, height: 56,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#2C2A28' },
  eyeBtn: { padding: 4 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
  },
  errorText: { fontSize: 13, color: '#B74134', flex: 1 },

  submitBtn: {
    backgroundColor: '#C65D47', borderRadius: 100, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 4,
    shadowColor: '#C65D47', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16,
    elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },

  divider: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 28, gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EFEBE4' },
  dividerText: { fontSize: 11, fontWeight: '700', color: '#A09A90', letterSpacing: 1.5 },

  demoSection: { gap: 12 },
  demoBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  demoBtnIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  demoBtnTextWrap: { flex: 1, marginLeft: 14 },
  demoBtnTitle: { fontSize: 15, fontWeight: '600', color: '#2C2A28' },
  demoBtnSub: { fontSize: 12, color: '#A09A90', marginTop: 2 },

  signupLink: { alignItems: 'center', marginTop: 28 },
  signupLinkText: { fontSize: 15, color: '#6B655D' },
  signupLinkBold: { fontWeight: '700', color: '#C65D47' },
});
