import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { useState } from 'react';

const tabs = [
  { path: '/', icon: '🏠', label: 'الرئيسية' },
  { path: '/qibla', icon: '🧭', label: 'القبلة' },
  { path: '/worships', icon: '📿', label: 'العبادات' },
  { path: '/prayers', icon: '🕌', label: 'الأذان' },
];

export function AppBottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const [moreOpen, setMoreOpen] = useState(false);
  const isAuthRoute = segments[0] === '(auth)' || ['/login', '/register', '/splash', '/onboarding', '/forgot-password', '/reset-password'].includes(pathname);
  if (isAuthRoute) return null;

  const go = (path: string) => { setMoreOpen(false); router.replace(path as never); };
  return <>
    <View style={styles.bar}>
      {tabs.map((tab) => <TouchableOpacity key={tab.path} style={styles.item} onPress={() => go(tab.path)} activeOpacity={.75}><Text style={[styles.icon, pathname === tab.path && styles.active]}>{tab.icon}</Text><Text style={[styles.label, pathname === tab.path && styles.active]}>{tab.label}</Text></TouchableOpacity>)}
      <TouchableOpacity style={styles.item} onPress={() => setMoreOpen(true)} activeOpacity={.75}><Text style={styles.icon}>⋯</Text><Text style={styles.label}>المزيد</Text></TouchableOpacity>
    </View>
    <Modal transparent visible={moreOpen} animationType="fade" onRequestClose={() => setMoreOpen(false)}><Pressable style={styles.overlay} onPress={() => setMoreOpen(false)}><View style={styles.menu}>
      <MenuItem icon="⭐" label="الإنجازات" onPress={() => go('/achievements')} />
      <MenuItem icon="♡" label="المفضلة" onPress={() => go('/favorites')} />
      <MenuItem icon="📅" label="التقويم" onPress={() => go('/calendar')} />
    </View></Pressable></Modal>
  </>;
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return <TouchableOpacity style={styles.menuItem} onPress={onPress}><Text style={styles.menuIcon}>{icon}</Text><Text style={styles.menuLabel}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'center', minHeight: 66, paddingHorizontal: 4, backgroundColor: '#1a0e14', borderTopWidth: 1, borderTopColor: 'rgba(201,169,110,.14)' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }, icon: { color: 'rgba(245,230,211,.55)', fontSize: 19, marginBottom: 2 }, label: { color: 'rgba(245,230,211,.55)', fontSize: 9, textAlign: 'center', writingDirection: 'rtl' }, active: { color: '#dcb575', fontWeight: '800' },
  overlay: { flex: 1, justifyContent: 'flex-end', paddingBottom: 74, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,.25)' }, menu: { backgroundColor: '#29121c', borderRadius: 17, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201,169,110,.24)' }, menuItem: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(245,230,211,.08)' }, menuIcon: { fontSize: 21, marginLeft: 12 }, menuLabel: { flex: 1, color: '#f5e6d3', fontSize: 16, textAlign: 'right', writingDirection: 'rtl' },
});
