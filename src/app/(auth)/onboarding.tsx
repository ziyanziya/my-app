import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AuthShell from '@/components/auth-shell';

const pages = [
  {
    title: 'بداية يومية مع الفجر',
    description: 'رتب مهامك الصباحية بدقة وابدأ رحلتك الروحية بهدف وراحة نفسية.',
  },
  {
    title: 'تذكيرات ذكية',
    description: 'حافظ على عادة الأذكار والصلاة مع إشعارات دقيقة قبل وبعد المهمة.',
  },
  {
    title: 'تتبع إنجازك',
    description: 'راقب نسب الإكمال اليومية والمستويات واعرف تقدمك الحقيقي.',
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const router = useRouter();

  return (
    <AuthShell>
      <View style={styles.top}> 
        <Text style={styles.step}>الخطوة {page + 1} من {pages.length}</Text>
        <Text style={styles.title}>{pages[page].title}</Text>
        <Text style={styles.description}>{pages[page].description}</Text>
      </View>

      <View style={styles.pagination}>
        {pages.map((_, index) => (
          <View key={index} style={[styles.dot, page === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        {page < pages.length - 1 ? (
          <TouchableOpacity style={styles.primaryButton} onPress={() => setPage(page + 1)}>
            <Text style={styles.primaryButtonText}>التالي</Text>
          </TouchableOpacity>
        ) : (
          <Link href="/login" style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>ابدأ الآن</Text>
          </Link>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.secondaryButtonText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  top: {
    flex: 1,
    justifyContent: 'center',
  },
  step: {
    color: '#b79c8f',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#f8ede0',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: '#d5c3b4',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5f424f',
  },
  dotActive: {
    backgroundColor: '#d9a46b',
    width: 20,
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
