import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

const stats = [
  { label: 'الأنشطة المكتملة', value: '24' },
  { label: 'الأيام المتتالية', value: '7' },
  { label: 'متوسط الوقت اليومي', value: '18 دقيقة' },
];

export default function StatisticsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Text style={styles.iconText}>←</Text>
          </Pressable>
          <Text style={styles.topTitle}>الإحصائيات</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>التقدم الأسبوعي</Text>
          <Text style={styles.heroValue}>+32%</Text>
          <Text style={styles.heroSubtext}>تحسنت أدائك مقارنة بالأسبوع الماضي</Text>
        </View>

        <View style={styles.grid}>
          {stats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
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
  heroCard: { backgroundColor: '#24161f', borderRadius: 24, padding: 20, alignItems: 'flex-start' },
  heroLabel: { color: '#d7b89c', fontSize: 13, marginBottom: 6 },
  heroValue: { color: '#f7e7d0', fontSize: 34, fontWeight: '900' },
  heroSubtext: { color: '#a99284', fontSize: 14, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  statCard: { width: '31%', minWidth: 100, backgroundColor: '#24161f', borderRadius: 20, padding: 16, alignItems: 'center' },
  statValue: { color: '#f7e7d0', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#a99284', fontSize: 12, textAlign: 'center', marginTop: 6 },
});
