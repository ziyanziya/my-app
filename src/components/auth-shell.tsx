import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Image, ImageBackground, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authTokens } from './auth-ui';

const background = require('../../assets/images/auth/islamic-auth-background.png');
const logo = require('../../assets/images/auth/elsirat-logo-final-transparent.png');

export default function AuthShell({ title = '', subtitle = '', children }: { title?: string; subtitle?: string; variant?: 'login' | 'register'; children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const backgroundFade = useRef(new Animated.Value(0)).current;
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(.86)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(16)).current;
  const compact = height < 720;
  const horizontalPadding = Math.max(18, Math.min(34, width * .065));
  const logoSize = compact ? Math.min(175, width * .48) : Math.min(220, width * .54);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(backgroundFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(logoFade, { toValue: 1, duration: 760, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 8, tension: 45, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(contentOffset, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
    ]).start();
  }, [backgroundFade, contentFade, contentOffset, logoFade, logoScale]);

  return <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="light-content" backgroundColor="#26050b" />
    <Animated.View style={[styles.background, { opacity: backgroundFade }]}>
      <ImageBackground source={background} resizeMode="cover" style={styles.background}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding, paddingVertical: compact ? 14 : 26 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.contentWidth, { maxWidth: Math.min(460, width - horizontalPadding * 2) }]}>
            <Animated.View style={[styles.logoWrap, { opacity: logoFade, transform: [{ scale: logoScale }] }]}>
              <Image source={logo} style={{ width: logoSize, height: logoSize }} resizeMode="contain" accessibilityLabel="شعار الصراط" />
            </Animated.View>
            <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentOffset }] }}>
              <View style={styles.heading}><Text style={styles.welcome}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View>
              <View style={styles.formSurface}>{children}</View>
            </Animated.View>
          </View>
        </ScrollView>
      </ImageBackground>
    </Animated.View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#26050b' }, background: { flex: 1 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 1, 6, .38)' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' }, contentWidth: { width: '100%' }, logoWrap: { alignItems: 'center', marginBottom: 4, shadowColor: '#f5bd43', shadowOpacity: .48, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  heading: { alignItems: 'center', marginBottom: 18 }, welcome: { color: '#fff3da', fontSize: authTokens.typography.title, fontWeight: '800', textAlign: 'center', writingDirection: 'rtl', textShadowColor: 'rgba(0,0,0,.45)', textShadowRadius: 8 }, subtitle: { color: '#f2ddbd', fontSize: authTokens.typography.body, lineHeight: 23, textAlign: 'center', writingDirection: 'rtl', marginTop: 7, maxWidth: 310 },
  formSurface: { backgroundColor: 'rgba(42, 5, 13, .80)', borderWidth: 1, borderColor: 'rgba(240,185,84,.25)', borderRadius: 28, padding: 18, shadowColor: '#000', shadowOpacity: .24, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
});
