import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { PrayerService } from '../services/prayer.service';
import AdhanService from '../services/adhan.service';

export default function PrayersPage() {
  const [times, setTimes] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await PrayerService.getTodayPrayerTimes();
        if (mounted) setTimes(t);
      } catch (e) {
        console.warn(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (enabled) {
      AdhanService.startAdhanScheduler(() => {
        // optional callback when adhan plays
      });
    } else {
      AdhanService.stopAdhanScheduler();
    }

    return () => {
      AdhanService.stopAdhanScheduler();
    };
  }, [enabled]);

  const manualPlay = async () => {
    try {
      await AdhanService.playAdhan();
    } catch (e) {
      Alert.alert('خطأ', 'تعذر تشغيل الأذان');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerWrap}>
          <Text style={styles.title}>الصلوات والأذان</Text>
          <Text style={styles.eyebrow}>تحكم بالأذان داخل التطبيق</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#dcb575" />
            <Text style={styles.loadingText}>جارٍ تحميل الأوقات...</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>تفعيل الأذان التلقائي</Text>
              <Pressable style={[styles.toggle, enabled ? styles.toggleOn : styles.toggleOff]} onPress={() => setEnabled((s) => !s)}>
                <Text style={styles.toggleText}>{enabled ? 'مفعّل' : 'معطّل'}</Text>
              </Pressable>
            </View>

            <View style={styles.timesList}>
              <View style={styles.timeRow}><Text style={styles.timeName}>الفجر</Text><Text style={styles.timeValue}>{times?.fajr ? new Date(times.fajr).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '-'}</Text></View>
              <View style={styles.timeRow}><Text style={styles.timeName}>الظهر</Text><Text style={styles.timeValue}>{times?.dhuhr ? new Date(times.dhuhr).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '-'}</Text></View>
              <View style={styles.timeRow}><Text style={styles.timeName}>العصر</Text><Text style={styles.timeValue}>{times?.asr ? new Date(times.asr).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '-'}</Text></View>
              <View style={styles.timeRow}><Text style={styles.timeName}>المغرب</Text><Text style={styles.timeValue}>{times?.maghrib ? new Date(times.maghrib).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '-'}</Text></View>
              <View style={styles.timeRow}><Text style={styles.timeName}>العشاء</Text><Text style={styles.timeValue}>{times?.isha ? new Date(times.isha).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '-'}</Text></View>
            </View>

            <Pressable style={styles.playButton} onPress={manualPlay}>
              <Text style={styles.playButtonText}>تشغيل الأذان الآن (يدوياً)</Text>
            </Pressable>

            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>ملاحظة مهمة</Text>
              <Text style={styles.noteText}>ضع ملف صوتي للأذان مرخّص (مثل تسجيل مؤذن الحرم إذا كان لديك الإذن) في `src/assets/adhan_placeholder.mp3`، أو مرّر URI إلى `AdhanService.loadAdhanSoundAsync(uri)` قبل التفعيل التلقائي.</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a0e14' },
  content: { padding: 18, paddingBottom: 40 },
  backButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(201,169,110,0.35)', backgroundColor: '#24101b', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  backText: { color: '#f5e6d3', fontSize: 30, lineHeight: 30 },
  headerWrap: { marginBottom: 16 },
  eyebrow: { color: '#d7c09d', fontSize: 12 },
  title: { color: '#f5e6d3', fontSize: 28, fontWeight: '800' },
  loadingCard: { padding: 18, alignItems: 'center' },
  loadingText: { color: '#f5e6d3', marginTop: 8 },
  card: { backgroundColor: '#29121c', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(220,181,117,0.08)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { color: '#d7c09d' },
  toggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  toggleOn: { backgroundColor: '#2f8a2f' },
  toggleOff: { backgroundColor: '#6b3f2f' },
  toggleText: { color: '#fff' },
  timesList: { marginTop: 6 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(220,181,117,0.04)' },
  timeName: { color: '#d7c09d' },
  timeValue: { color: '#f5e6d3' },
  playButton: { marginTop: 12, backgroundColor: '#dcb575', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  playButtonText: { color: '#1a0e14', fontWeight: '800' },
  noteBox: { marginTop: 12, backgroundColor: 'rgba(220,181,117,0.06)', padding: 10, borderRadius: 10 },
  noteTitle: { color: '#dcb575', fontWeight: '700', marginBottom: 6 },
  noteText: { color: '#d7c09d', fontSize: 13 },
});
