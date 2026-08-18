import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { PrayerService } from '../services/prayer.service';
import AdhanService, { AdhanPreferences, PrayerKey } from '../services/adhan.service';
import { getAuthApiBaseUrl } from '../services/auth-api';
import { UserAdhanUploader } from '../components/user-adhan-uploader';
import { goBackOrHome } from '../utils/navigation';

const PAGE_BACKGROUND = require('../../assets/images/auth/islamic-auth-background.png');

type AdhanFile = { name: string; displayName?: string; url: string };
const prayers: Array<{ key: PrayerKey; label: string }> = [
  { key: 'fajr', label: 'الفجر' }, { key: 'dhuhr', label: 'الظهر' }, { key: 'asr', label: 'العصر' }, { key: 'maghrib', label: 'المغرب' }, { key: 'isha', label: 'العشاء' },
];
const STORAGE_KEY = 'adhanPreferences';

export default function PrayersPage() {
  const [times, setTimes] = useState<any>(null);
  const [files, setFiles] = useState<AdhanFile[]>([]);
  const [preferences, setPreferences] = useState<AdhanPreferences>({ enabled: false, selections: {} });
  const [picker, setPicker] = useState<PrayerKey | null>(null);
  const [playing, setPlaying] = useState<PrayerKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadName, setUploadName] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([PrayerService.getTodayPrayerTimes(), AsyncStorage.getItem(STORAGE_KEY), fetch(`${getAuthApiBaseUrl()}/adhan`)])
      .then(async ([prayerTimes, saved, response]) => {
        if (!active) return;
        const body = response.ok ? await response.json() : { data: [] };
        setTimes(prayerTimes);
        setFiles(Array.isArray(body.data) ? body.data : []);
        if (saved) setPreferences({ enabled: !!JSON.parse(saved).enabled, selections: JSON.parse(saved).selections || {} });
      }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    if (preferences.enabled) AdhanService.startAdhanScheduler(preferences); else AdhanService.stopAdhanScheduler();
  }, [preferences]);

  const choose = (url: string) => {
    if (!picker) return;
    setPreferences((value) => ({ ...value, selections: { ...value.selections, [picker]: url } }));
    setPicker(null);
  };
  const test = async (key: PrayerKey) => {
    if (playing === key) { await AdhanService.stopAdhan(); setPlaying(null); return; }
    const source = preferences.selections[key] || files[0]?.url;
    if (!source) return;
    await AdhanService.loadAdhanSoundAsync(source);
    await AdhanService.playAdhan();
    setPlaying(key);
  };
  const current = picker ? preferences.selections[picker] : undefined;

  return <SafeAreaView style={s.safe}><ImageBackground source={PAGE_BACKGROUND} resizeMode="cover" style={s.pageBackground}><View pointerEvents="none" style={s.pageOverlay} /><ScrollView contentContainerStyle={s.content}>
    <View style={s.top}><Pressable onPress={goBackOrHome} style={s.back}><Text style={s.backText}>‹</Text></Pressable><Text style={s.title}>الصلوات والأذان</Text></View>
    <Pressable style={[s.enable, preferences.enabled && s.enableOn]} onPress={() => setPreferences((value) => ({ ...value, enabled: !value.enabled }))}>
      <Text style={s.enableIcon}>{preferences.enabled ? '✓' : '⏸'}</Text><View style={s.enableText}><Text style={s.enableTitle}>{preferences.enabled ? 'الأذان مفعّل' : 'الأذان متوقف'}</Text><Text style={s.muted}>سيعمل عند دخول وقت الصلاة</Text></View><Text style={s.switch}>{preferences.enabled ? '●' : '○'}</Text>
    </Pressable>
    <Text style={s.section}>اختيار المؤذن</Text>
    {loading ? <ActivityIndicator color="#dcb575" /> : prayers.map((prayer) => {
      const file = files.find((item) => item.url === preferences.selections[prayer.key]) || files[0];
      return <View key={prayer.key} style={[s.card, prayer.key === 'fajr' && s.fajr]}><View style={s.row}><View><Text style={s.prayer}>{prayer.label}</Text><Text style={s.time}>{times?.[prayer.key] ? new Date(times[prayer.key]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text></View><Pressable onPress={() => test(prayer.key)} style={[s.test, playing === prayer.key && s.stop]}><Text style={s.testText}>{playing === prayer.key ? '⏹ إيقاف' : '▶ تجربة'}</Text></Pressable></View><Pressable style={s.choose} onPress={() => setPicker(prayer.key)}><Text style={s.chooseLabel}>المؤذن</Text><Text style={s.chooseName}>{file?.displayName || 'اختر من القائمة'}</Text><Text style={s.chevron}>‹</Text></Pressable></View>;
    })}
    <View style={s.note}><Text style={s.noteTitle}>إضافة صوت مؤذن</Text><Text style={s.muted}>أدخل اسم المؤذن ثم اختر ملفاً صوتياً لإضافته إلى قائمتك.</Text><TextInput value={uploadName} onChangeText={setUploadName} placeholder="اسم المؤذن" placeholderTextColor="#a98d75" style={s.nameInput} textAlign="right" /><UserAdhanUploader displayName={uploadName} onUploaded={(file) => { setFiles((current) => [...current, file]); setUploadName(''); }} /></View>
  </ScrollView></ImageBackground>
  <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}><Pressable style={s.overlay} onPress={() => setPicker(null)}><Pressable style={s.sheet} onPress={(event) => event.stopPropagation()}><Text style={s.sheetTitle}>اختر المؤذن</Text>{files.map((file) => <Pressable key={file.name} onPress={() => choose(file.url)} style={[s.option, current === file.url && s.optionActive]}><Text style={s.optionName}>{file.displayName || file.name}</Text>{current === file.url ? <Text style={s.check}>✓</Text> : null}</Pressable>)}{!files.length ? <Text style={s.muted}>لا توجد أصوات مضافة بعد.</Text> : null}</Pressable></Pressable></Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#160b12' }, pageBackground: { flex: 1 }, pageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 4, 10, 0.48)' }, content: { padding: 18, paddingBottom: 44 }, top: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }, back: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#29121c', alignItems: 'center', justifyContent: 'center' }, backText: { color: '#f7eadc', fontSize: 30 }, title: { color: '#f7eadc', fontSize: 27, fontWeight: '800', writingDirection: 'rtl' }, enable: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: '#2a1620', borderWidth: 1, borderColor: 'rgba(220,181,117,.18)', marginBottom: 26 }, enableOn: { backgroundColor: '#253022', borderColor: '#719b60' }, enableIcon: { color: '#fff', fontSize: 20, width: 42, height: 42, borderRadius: 21, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', backgroundColor: '#765161' }, enableText: { flex: 1, alignItems: 'flex-end', marginHorizontal: 12 }, enableTitle: { color: '#f7eadc', fontSize: 16, fontWeight: '800', writingDirection: 'rtl' }, muted: { color: '#cbb9a0', fontSize: 12, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' }, switch: { color: '#dcb575', fontSize: 25 }, section: { color: '#f7eadc', fontSize: 18, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl', marginBottom: 10 }, card: { backgroundColor: '#25131d', borderRadius: 16, padding: 14, marginBottom: 9 }, fajr: { borderWidth: 1, borderColor: 'rgba(220,181,117,.42)', backgroundColor: '#302116' }, row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }, prayer: { color: '#f7eadc', fontSize: 16, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' }, time: { color: '#dcb575', fontSize: 12, textAlign: 'right' }, test: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, backgroundColor: 'rgba(220,181,117,.12)', borderWidth: 1, borderColor: 'rgba(220,181,117,.3)' }, stop: { backgroundColor: 'rgba(217,77,77,.25)', borderColor: '#e89090' }, testText: { color: '#f5dab0', fontWeight: '800', fontSize: 12 }, choose: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'rgba(0,0,0,.18)', padding: 11, borderRadius: 10 }, chooseLabel: { color: '#a98d75', marginLeft: 10, fontSize: 11 }, chooseName: { flex: 1, color: '#f7eadc', textAlign: 'right', writingDirection: 'rtl' }, chevron: { color: '#dcb575', fontSize: 24 }, note: { backgroundColor: 'rgba(220,181,117,.08)', padding: 14, borderRadius: 14, marginTop: 8, alignItems: 'flex-end' }, noteTitle: { color: '#e5c891', fontWeight: '800', writingDirection: 'rtl' }, nameInput: { alignSelf: 'stretch', color: '#f7eadc', backgroundColor: '#201019', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12, borderWidth: 1, borderColor: 'rgba(220,181,117,.2)' }, overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.62)', justifyContent: 'flex-end' }, sheet: { backgroundColor: '#291620', padding: 20, borderTopLeftRadius: 25, borderTopRightRadius: 25 }, sheetTitle: { color: '#f7eadc', fontSize: 19, fontWeight: '800', writingDirection: 'rtl', textAlign: 'right', marginBottom: 12 }, option: { flexDirection: 'row-reverse', backgroundColor: '#201019', borderRadius: 11, padding: 14, marginBottom: 8 }, optionActive: { borderWidth: 1, borderColor: '#dcb575' }, optionName: { flex: 1, color: '#f7eadc', textAlign: 'right', writingDirection: 'rtl' }, check: { color: '#91d477', fontSize: 18 } });
