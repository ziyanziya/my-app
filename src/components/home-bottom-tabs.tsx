import { View, StyleSheet, TouchableOpacity, Text , useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';


const sideItems = [
  { key: 'home', label: 'الرئيسية', icon: '⌂' },
  { key: 'calendar', label: 'التقويم', icon: '▦' },
];
const trailingItems = [
  { key: 'favorites', label: 'المفضلة', icon: '♡' },
  { key: 'more', label: 'المزيد', icon: '•••' },
];

export function HomeBottomTabs({ activeKey = 'home' }: { activeKey?: string }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.backgroundElement ?? '#24161f' }]}>
      {sideItems.map((item) => (
        <TouchableOpacity key={item.key} style={styles.tabItem}>
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.tabLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.centerLogoWrapper}>
        <View style={styles.centerLogo}>
          <Text style={styles.centerLogoText}>☾</Text>
        </View>
      </TouchableOpacity>

      {trailingItems.map((item) => (
        <TouchableOpacity key={item.key} style={styles.tabItem}>
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.tabLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 28,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  icon: {
    color: '#b29a8e',
    fontSize: 18,
    marginBottom: 4,
  },
  tabLabel: {
    color: '#b29a8e',
    fontWeight: '700',
    fontSize: 11,
  },
  centerLogoWrapper: {
    marginHorizontal: 8,
    marginTop: -28,
  },
  centerLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d9a46b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#150b14',
  },
  centerLogoText: {
    color: '#150b14',
    fontSize: 24,
    fontWeight: '900',
  },
});