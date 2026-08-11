import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function LevelsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Text style={styles.iconText}>←</Text>
          </Pressable>
          <Text style={styles.topTitle}>المستويات</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>المستوى الحالي</Text>
          <Text style={styles.heroValue}>المستوى 4</Text>
          <Text style={styles.heroSubtext}>أكملت 78% من متطلبات المستوى التالي</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>780 / 1000 XP</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ما الذي ينتظرك قريبًا؟</Text>
          <Text style={styles.infoText}>• فتح تحديات جديدة</Text>
          <Text style={styles.infoText}>• مكافآت خاصة للمستوى الخامس</Text>
          <Text style={styles.infoText}>• تقارير أسبوعية مفصلة</Text>
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
  progressCard: { backgroundColor: '#24161f', borderRadius: 24, padding: 18 },
  progressTrack: { height: 12, borderRadius: 999, backgroundColor: '#3c2432', overflow: 'hidden' },
  progressFill: { width: '78%', height: '100%', backgroundColor: '#c67849', borderRadius: 999 },
  progressText: { color: '#f7e7d0', fontSize: 13, fontWeight: '700', marginTop: 10 },
  infoCard: { backgroundColor: '#24161f', borderRadius: 24, padding: 18 },
  infoTitle: { color: '#f7e7d0', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  infoText: { color: '#a99284', fontSize: 14, lineHeight: 22, marginBottom: 4 },
});
