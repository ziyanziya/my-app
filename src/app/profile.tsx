import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthApiBaseUrl } from '@/services/auth-api';

const AUTH_TOKEN_KEY = 'authToken';

type Profile = { name: string; email: string; phone?: string; role?: string };

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
          router.replace('/login');
          return;
        }

        const response = await fetch(`${getAuthApiBaseUrl()}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, 'authUserName']);
          router.replace('/login');
          return;
        }

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          setError(body?.message || body?.error || 'تعذر تحميل الملف الشخصي. حاول مرة أخرى.');
          return;
        }

        const result = await response.json();
        setUser(result?.data || null);
      } catch {
        setError('تعذر الاتصال بالخادم. تحقق من تشغيله ثم حاول مجددًا.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ملف المستخدم</Text>
      </View>

      {loading ? <Text style={styles.message}>جارٍ تحميل البيانات...</Text> : null}
      {!loading && error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && user ? (
        <View style={styles.card}>
          <Text style={styles.label}>الاسم</Text>
          <Text style={styles.value}>{user.name}</Text>
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <Text style={styles.value}>{user.email}</Text>
          {user.phone ? <><Text style={styles.label}>الهاتف</Text><Text style={styles.value}>{user.phone}</Text></> : null}
          {user.role ? <><Text style={styles.label}>الدور</Text><Text style={styles.value}>{user.role}</Text></> : null}
          
          <TouchableOpacity 
            style={{ marginTop: 24, backgroundColor: '#d9a46b', padding: 12, borderRadius: 12, alignItems: 'center' }} 
            onPress={() => router.push('/notification-settings')}
          >
            <Text style={{ color: '#150b14', fontWeight: 'bold' }}>إعدادات الإشعارات</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {!loading && !error && !user ? <Text style={styles.message}>لا توجد معلومات مستخدم.</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { marginRight: 16, backgroundColor: '#d9a46b', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  backText: { color: '#150b14', fontWeight: '700' },
  title: { color: '#f3e5d8', fontSize: 20, fontWeight: '700' },
  card: { backgroundColor: 'rgba(60,30,40,0.7)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(201,169,110,0.12)' },
  label: { color: '#cbb9a0', fontSize: 12, marginTop: 14 },
  value: { color: '#f5e6d3', fontSize: 16, fontWeight: '600', marginTop: 4 },
  message: { color: '#f5e6d3', fontSize: 14, textAlign: 'center', marginTop: 32 },
  error: { color: '#f55a5a', fontSize: 14, textAlign: 'center', marginTop: 32 },
});
