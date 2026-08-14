import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function CalendarScreen() {
  const date = new Date().toLocaleDateString('ar-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return <SafeAreaView style={styles.safe}><View style={styles.content}><Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>التقويم</Text><View style={styles.card}><Text style={styles.icon}>📅</Text><Text style={styles.date}>{date}</Text><Text style={styles.hint}>تابع مناسباتك وأوقات عبادتك من هنا.</Text></View></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#160b12' }, content: { padding: 20 }, back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#29121c' }, backText: { color: '#f7eadc', fontSize: 30 }, title: { color: '#f7eadc', fontSize: 26, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl', marginTop: 20 }, card: { marginTop: 22, alignItems: 'center', padding: 28, backgroundColor: '#25131d', borderRadius: 18 }, icon: { fontSize: 42 }, date: { color: '#f7eadc', fontSize: 17, fontWeight: '700', marginTop: 12, writingDirection: 'rtl', textAlign: 'center' }, hint: { color: '#cbb9a0', fontSize: 12, marginTop: 8, writingDirection: 'rtl' } });
