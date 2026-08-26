import React, { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthApiBaseUrl, fetchWithTimeout } from '../services/auth-api';

export default function AchievementsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          router.replace('/login');
          return;
        }

        const [statsRes, transRes] = await Promise.all([
          fetchWithTimeout(`${getAuthApiBaseUrl()}/light/user/me/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetchWithTimeout(`${getAuthApiBaseUrl()}/light/user/me/transactions`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          if (active && statsJson.success) setStats(statsJson.data);
        }

        if (transRes.ok) {
          const transJson = await transRes.json();
          if (active && transJson.success) setTransactions(transJson.data);
        }
      } catch (e) {
        console.error("Error fetching achievements data:", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, []));

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Text style={styles.iconText}>←</Text>
          </Pressable>
          <Text style={styles.topTitle}>سجل النور والإنجازات</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#c9a96e" style={{ marginTop: 50 }} />
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>إجمالي النور المكتسب</Text>
              <Text style={styles.heroValue}>{stats ? Math.floor(stats.total_awarded || 0) : 0}</Text>
              <Text style={styles.heroSubtext}>أنت على الطريق الصحيح!</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>نور اليوم</Text>
                  <Text style={styles.statBoxValue}>{stats?.daily_awarded || 0}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>أيام التزام</Text>
                  <Text style={styles.statBoxValue}>{stats?.current_streak_days || 0}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>سجل العمليات</Text>

            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>لا يوجد أي عمليات بعد.</Text>
            ) : (
              transactions.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={[styles.iconBadge, item.transaction_type === 'spend' && { backgroundColor: '#4a2b30' }]}>
                    <Text style={styles.iconTextLarge}>
                      {item.transaction_type === 'award' ? '🌟' : '🛍️'}
                    </Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>
                      {item.metadata ? JSON.parse(item.metadata).title || item.source_scope : item.source_scope}
                    </Text>
                    <Text style={styles.cardText}>{formatDate(item.created_at)}</Text>
                  </View>
                  <View style={styles.amountBadge}>
                    <Text style={[styles.amountText, item.transaction_type === 'spend' && { color: '#ff6b6b' }]}>
                      {item.transaction_type === 'award' ? '+' : '-'}{item.amount}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#24161f', justifyContent: 'center', alignItems: 'center' },
  iconText: { color: '#f7e7d0', fontSize: 22, fontWeight: '900' },
  topTitle: { color: '#f7e7d0', fontSize: 18, fontWeight: '800' },
  placeholder: { width: 42 },
  heroCard: { backgroundColor: '#24161f', borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 10 },
  heroLabel: { color: '#d7b89c', fontSize: 14, marginBottom: 6 },
  heroValue: { color: '#f7e7d0', fontSize: 42, fontWeight: '900' },
  heroSubtext: { color: '#a99284', fontSize: 14, marginTop: 6, marginBottom: 20 },
  statsRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 20, width: '100%' },
  statBox: { backgroundColor: 'rgba(201,169,110,0.1)', padding: 12, borderRadius: 16, alignItems: 'center', flex: 1 },
  statBoxLabel: { color: '#d7b89c', fontSize: 12, marginBottom: 4 },
  statBoxValue: { color: '#f7e7d0', fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { color: '#f7e7d0', fontSize: 18, fontWeight: '800', marginTop: 10, marginBottom: 5, textAlign: 'right' },
  card: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#24161f', borderRadius: 20, padding: 16 },
  iconBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3c2432', alignItems: 'center', justifyContent: 'center' },
  iconTextLarge: { fontSize: 22 },
  cardBody: { flex: 1, marginRight: 12 },
  cardTitle: { color: '#f7e7d0', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  cardText: { color: '#a99284', fontSize: 13 },
  amountBadge: { backgroundColor: 'rgba(201,169,110,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  amountText: { color: '#c9a96e', fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#a99284', fontSize: 15, textAlign: 'center', marginTop: 30 }
});
