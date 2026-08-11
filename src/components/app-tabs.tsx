import { useColorScheme, View, Text } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  let NativeTabs: any = null;
  try {
    // try to load native tabs; may be unavailable on web or mismatched sdk
     
    NativeTabs = require('expo-router/unstable-native-tabs').NativeTabs;
  } catch (e) {
    NativeTabs = null;
  }

  if (!NativeTabs) {
    // Fallback: simple horizontal tab placeholders for web
    return (
      <View style={{ flexDirection: 'row', gap: 12, padding: 8 }}>
        <Text style={{ color: colors.text }}>Home</Text>
        <Text style={{ color: colors.text }}>Explore</Text>
      </View>
    );
  }

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
