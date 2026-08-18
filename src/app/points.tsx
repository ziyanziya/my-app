import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthApiBaseUrl } from '../services/auth-api';

type LightStats = {
  current_balance: number;
  total_awarded: number;
  total_spent: number;
  current_streak_days: number;
  longest_streak_days: number;
};

type LightTransaction = {
  id: number;
  amount: number;
  transaction_type: string;
  source_scope: string;
  source_key: string | null;
  balance_after: number;
  created_at: string;
  metadata?: any;
};

const scopeTitle = (scope: string, key?: string | null) => {
  if (scope === 'prayer') return 'أداء عبادة وصلاة';
  if (scope === 'theory') return 'إتمام قراءة قسم نظري';
  if (scope === 'practical') return 'إنجاز خطوة تطبيقية';
  if (scope === 'daily_checkin') return 'تسجيل الحضور اليومي';
  if (scope === 'all_worships') return 'مكافأة إتمام كامل عبادات اليوم 🌟';
  if (scope === 'achievement') return 'فتح إنجاز جديد 🏅';
  return key || 'نشاط إيماني';
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
};

export default function PointsScreen() {
  const [stats, setStats] = useState<LightStats | null>(null);
  const [transactions, setTransactions] = useState<LightTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setStats({
          current_balance: 0,
          total_awarded: 0,
          total_spent: 0,
          current_streak_days: 0,
          longest_streak_days: 0,
        });
        setTransactions([]);
        return;
      }

      const baseUrl = getAuthApiBaseUrl();
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, txRes] = await Promise.all([
        fetch(`${baseUrl}/light/user/me/stats`, { headers }),
        fetch(`${baseUrl}/light/user/me/transactions?limit=30`, { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.data || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر تحميل بيانات النور');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const balance = stats ? Math.floor(Number(stats.current_balance || 0)) : 0;
  const streak = stats ? Number(stats.current_streak_days || 0) : 0;
  const totalAwarded = stats ? Math.floor(Number(stats.total_awarded || 0)) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Text style={styles.iconText}>←</Text>
          </Pressable>
          <Text style={styles.topTitle}>رصيد النور والبركة</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>رصيد النور الحالي</Text>
              <Text style={styles.heroValue}>{balance.toLocaleString('ar-EG')}</Text>
            </View>
            <View style={styles.glowIcon}>
              <Text style={styles.glowStar}>✨</Text>
            </View>
          </View>
          <Text style={styles.heroSubtext}>
            {streak > 0 ? `أنت على مسار الالتزام لـ ${streak} أيام متتالية!` : 'استمر في تأدية العبادات لتزيد نورانيتك'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>أيام التتابع</Text>
              <Text style={styles.statValue}>🔥 {streak} أيام</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>إجمالي النور المكتسب</Text>
              <Text style={styles.statValue}>🌟 {totalAwarded.toLocaleString('ar-EG')}</Text>
            </View>
          </View>
        </View>

        {/* Transaction History Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>سجل نور العبادات</Text>
            <Pressable onPress={loadData}>
              <Text style={styles.refreshText}>تحديث 🔄</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#c67849" />
              <Text style={styles.loadingText}>جارٍ تحديث السجل...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>لا توجد معاملات مسجلة بعد</Text>
              <Text style={styles.emptySubtext}>ابدأ بأداء أول عبادة أو قسم نظري لتبدأ رحلة النور</Text>
            </View>
          ) : (
            transactions.map((item) => {
              const isAward = item.transaction_type === 'award';
              return (
                <View key={item.id} style={styles.row}>
                  <Text style={[styles.pointsValue, !isAward && styles.pointsSpend]}>
                    {isAward ? `+${Math.floor(Number(item.amount))}` : `-${Math.floor(Number(item.amount))}`} نور
                  </Text>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{scopeTitle(item.source_scope, item.source_key)}</Text>
                    <Text style={styles.rowHint}>{formatTimeAgo(item.created_at)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#12080f' },
  container: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#24161f', justifyContent: 'center', alignItems: 'center' },
  iconText: { color: '#f7e7d0', fontSize: 22, fontWeight: '900' },
  topTitle: { color: '#f7e7d0', fontSize: 18, fontWeight: '800' },
  placeholder: { width: 42 },
  heroCard: { backgroundColor: '#24161f', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#422435' },
  heroTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  glowIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3d1c28', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#d4a574' },
  glowStar: { fontSize: 26 },
  heroLabel: { color: '#d7b89c', fontSize: 13, marginBottom: 4, writingDirection: 'rtl' },
  heroValue: { color: '#f7e7d0', fontSize: 36, fontWeight: '900', writingDirection: 'rtl' },
  heroSubtext: { color: '#a99284', fontSize: 14, marginTop: 8, writingDirection: 'rtl' },
  statsRow: { flexDirection: 'row', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#361e2b' },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#361e2b' },
  statLabel: { color: '#a99284', fontSize: 11, marginBottom: 4 },
  statValue: { color: '#f7e7d0', fontSize: 15, fontWeight: '800' },
  sectionCard: { backgroundColor: '#24161f', borderRadius: 24, padding: 18 },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#f7e7d0', fontSize: 16, fontWeight: '800' },
  refreshText: { color: '#d4a574', fontSize: 13, fontWeight: '700' },
  loadingContainer: { paddingVertical: 24, alignItems: 'center', gap: 8 },
  loadingText: { color: '#a99284', fontSize: 13 },
  errorText: { color: '#e74c3c', fontSize: 13, textAlign: 'center', marginVertical: 12 },
  emptyContainer: { paddingVertical: 28, alignItems: 'center', gap: 6 },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { color: '#f7e7d0', fontSize: 15, fontWeight: '700' },
  emptySubtext: { color: '#a99284', fontSize: 12, textAlign: 'center' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2f1c27' },
  rowBody: { flex: 1, marginRight: 12 },
  rowTitle: { color: '#f7e7d0', fontSize: 14, fontWeight: '700', writingDirection: 'rtl' },
  rowHint: { color: '#a99284', fontSize: 12, marginTop: 3, writingDirection: 'rtl' },
  pointsValue: { color: '#d4a574', fontSize: 15, fontWeight: '900' },
  pointsSpend: { color: '#e67e22' },
});
