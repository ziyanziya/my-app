import { ReactNode } from 'react';
import { ImageBackground, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authTokens } from './auth-ui';

const authBackgrounds = {
  login: require('../../assets/images/auth/login-background.png'),
  register: require('../../assets/images/auth/register-background.png'),
};

export default function AuthShell({
  title = '',
  subtitle = '',
  variant = 'login',
  children,
}: {
  title?: string;
  subtitle?: string;
  variant?: keyof typeof authBackgrounds;
  children: ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const isCompactHeight = height < 700;
  const horizontalPadding = Math.max(18, Math.min(32, width * 0.06));
  const brandFontSize = isCompactHeight ? 42 : Math.min(52, Math.max(46, width * 0.13));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={authTokens.colors.background} />
      <ImageBackground source={authBackgrounds[variant]} resizeMode="stretch" style={styles.background}>
        <View style={styles.overlay} />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding, paddingTop: isCompactHeight ? 18 : authTokens.spacing.l, paddingBottom: isCompactHeight ? 18 : authTokens.spacing.l }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentWidth, { maxWidth: Math.min(460, width - horizontalPadding * 2) }]}>
          <View style={[styles.brandBlock, isCompactHeight && styles.brandBlockCompact]}>
            <Text style={[styles.brand, { fontSize: brandFontSize, lineHeight: brandFontSize * 1.18 }]}>الصراط</Text>
            <View style={styles.ornament}><View style={styles.ornamentLine} /><Text style={styles.ornamentStar}>✦</Text><View style={styles.ornamentLine} /></View>
            <Text style={styles.welcome}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {children}
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: authTokens.colors.background },
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18, 5, 14, 0.38)' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  contentWidth: { width: '100%' },
  brandBlock: { alignItems: 'center', marginBottom: authTokens.spacing.l },
  brandBlockCompact: { marginBottom: authTokens.spacing.m },
  brand: { color: authTokens.colors.ivory, fontFamily: 'Amiri_400Regular', fontSize: authTokens.typography.brand, lineHeight: 60, textShadowColor: 'rgba(201,161,90,0.65)', textShadowRadius: 13, textShadowOffset: { width: 0, height: 2 } },
  ornament: { flexDirection: 'row', alignItems: 'center', gap: 9, width: 170, marginTop: 2, marginBottom: 16 },
  ornamentLine: { flex: 1, height: 1, backgroundColor: 'rgba(201,161,90,0.56)' },
  ornamentStar: { color: authTokens.colors.accent, fontSize: 15 },
  welcome: { color: authTokens.colors.text, fontSize: authTokens.typography.title, fontWeight: '800', textAlign: 'center', writingDirection: 'rtl' },
  subtitle: { color: authTokens.colors.ivory, fontSize: authTokens.typography.body, lineHeight: 24, textAlign: 'center', writingDirection: 'rtl', marginTop: 8, maxWidth: 300 },
});
