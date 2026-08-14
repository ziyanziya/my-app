import { Link } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AuthShell from '@/components/auth-shell';

export default function SplashScreen() {
  return (
    <AuthShell>
      <View style={styles.topSection}>
        <Text style={styles.title}>صراط</Text>
        <Text style={styles.subtitle}>رحلة يومية نحو التركيز والخشوع.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>مرحبا بك في صراط</Text>
        <Text style={styles.cardText}>
          إشعارات ذكية، تتبع العادات، وواجهة هادئة تساعدك على بدء يومك من الفجر بترتيب وهدوء.
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>12</Text>
            <Text style={styles.statNote}>عادة</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>70%</Text>
            <Text style={styles.statNote}>إكمال اليوم</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Link href="/onboarding" style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>ابدأ الآن</Text>
        </Link>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  topSection: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#f8ede0',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    color: '#d3c1af',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#24161f',
    padding: 22,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    marginBottom: 24,
  },
  cardTitle: {
    color: '#f7e7d0',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  cardText: {
    color: '#c8b3a5',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#38212d',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    color: '#f7e7d0',
    fontSize: 24,
    fontWeight: '800',
  },
  statNote: {
    marginTop: 4,
    color: '#b9a38f',
    fontSize: 12,
  },
  actions: {
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#d9a46b',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#150b14',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#7f5a50',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#e9d6c5',
    fontSize: 16,
    fontWeight: '700',
  },
});
