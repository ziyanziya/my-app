import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

const activityLog = [
  { title: 'إكمال أذكار الصباح', points: '+120', time: 'منذ 2 ساعة' },
  { title: 'مراجعة القرآن', points: '+80', time: 'منذ 5 ساعات' },
  { title: 'التزام أسبوعي', points: '+200', time: 'أمس' },
];

export default function PointsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Text style={styles.iconText}>←</Text>
          </Pressable>
          <Text style={styles.topTitle}>النقاط</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>رصيدك الحالي</Text>
          <Text style={styles.heroValue}>1,240</Text>
          <Text style={styles.heroSubtext}>استمر في التقدم لتحصل على مزايا إضافية</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>سجل النقاط</Text>
          {activityLog.map((item) => (
            <View key={item.title} style={styles.row}>
              <Text style={styles.pointsValue}>{item.points}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowHint}>{item.time}</Text>
              </View>
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
  sectionCard: { backgroundColor: '#24161f', borderRadius: 24, padding: 18 },
  sectionTitle: { color: '#f7e7d0', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2f1c27' },
  rowBody: { flex: 1, marginRight: 12 },
  rowTitle: { color: '#f7e7d0', fontSize: 15, fontWeight: '700' },
  rowHint: { color: '#a99284', fontSize: 12, marginTop: 2 },
  pointsValue: { color: '#c67849', fontSize: 16, fontWeight: '900' },
});
