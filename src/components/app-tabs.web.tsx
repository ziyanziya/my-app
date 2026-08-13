import { Pressable, useColorScheme, View, StyleSheet, Text } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  return (
    <View style={[styles.tabsContainer, { backgroundColor: colors.backgroundElement }]}> 
      <a href="/" style={styles.tabAnchor}>
        <Pressable style={styles.tabButton}>
          <Text style={[styles.tabText, { color: colors.text }]}>Home</Text>
        </Pressable>
      </a>
      <a href="/explore" style={styles.tabAnchor}>
        <Pressable style={styles.tabButton}>
          <Text style={[styles.tabText, { color: colors.text }]}>Explore</Text>
        </Pressable>
      </a>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    width: '100%',
    padding: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabAnchor: {
    textDecorationLine: 'none',
  },
  tabButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#ffffff20',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
