import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

const achievements = [
  { title: 'بداية قوية', description: 'أكملت 3 أنشطة متتالية', icon: '🏅' },
  { title: 'مُثابِر', description: 'تم إكمال 7 أيام من الالتزام', icon: '🔥' },
  { title: 'مُصلح نفسي', description: 'حافظت على الروتين لمدة أسبوع', icon: '🌿' },
];

export default function AchievementsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Text style={styles.iconText}>←</Text>
          </Pressable>
          <Text style={styles.topTitle}>الإنجازات</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>إجمالي الإنجازات</Text>
          <Text style={styles.heroValue}>12</Text>
          <Text style={styles.heroSubtext}>أنت على الطريق الصحيح نحو مستوى جديد</Text>
        </View>

        {achievements.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.iconBadge}>
              <Text style={styles.iconTextLarge}>{item.icon}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardText}>{item.description}</Text>
            </View>
          </View>
        ))}
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
  card: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#24161f', borderRadius: 20, padding: 16 },
  iconBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3c2432', alignItems: 'center', justifyContent: 'center' },
  iconTextLarge: { fontSize: 22 },
  cardBody: { flex: 1, marginRight: 12 },
  cardTitle: { color: '#f7e7d0', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  cardText: { color: '#a99284', fontSize: 13, lineHeight: 18 },
});
