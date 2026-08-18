import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function FavoritesScreen() {
  return <SafeAreaView style={styles.safe}><View style={styles.content}><Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>المفضلة</Text><View style={styles.card}><Text style={styles.icon}>♡</Text><Text style={styles.message}>لا توجد عناصر مفضلة بعد.</Text><Text style={styles.hint}>ستظهر هنا الدروس والعبادات التي تحفظها.</Text></View></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: 'transparent' }, content: { padding: 20 }, back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#29121c' }, backText: { color: '#f7eadc', fontSize: 30 }, title: { color: '#f7eadc', fontSize: 26, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl', marginTop: 20 }, card: { marginTop: 22, alignItems: 'center', padding: 28, backgroundColor: '#25131d', borderRadius: 18 }, icon: { color: '#dcb575', fontSize: 42 }, message: { color: '#f7eadc', fontSize: 16, fontWeight: '700', marginTop: 12, writingDirection: 'rtl' }, hint: { color: '#cbb9a0', fontSize: 12, marginTop: 6, writingDirection: 'rtl' } });
