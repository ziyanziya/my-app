import { useEffect, useMemo, useState } from 'react';
import { Animated, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getAuthApiBaseUrl } from '../services/auth-api';
import Svg, { Path } from 'react-native-svg';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=85';
const PAGE_BACKGROUND = require('../../assets/images/auth/islamic-auth-background.png');

const formatRemainingTime = (endTime?: string, currentTime = Date.now()) => {
  if (!endTime) return '--:--:--';

  let remaining = new Date(endTime).getTime() - currentTime;
  if (remaining < 0) remaining += 24 * 60 * 60 * 1000;

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const BookIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24">
    <Path d="M3.5 5.5c2.7-1.3 5.3-1.1 8.5.7v12.1c-3.2-1.8-5.8-2-8.5-.7V5.5Zm17 0c-2.7-1.3-5.3-1.1-8.5.7v12.1c3.2-1.8 5.8-2 8.5-.7V5.5Z" fill="none" stroke="#f5e6d3" strokeWidth={1.4} strokeLinejoin="round" />
  </Svg>
);

const TheoreticalBookIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24">
    <Path d="M3.5 5.5c2.7-1.3 5.3-1.1 8.5.7v12.1c-3.2-1.8-5.8-2-8.5-.7V5.5Zm17 0c-2.7-1.3-5.3-1.1-8.5.7v12.1c3.2-1.8 5.8-2 8.5-.7V5.5Z" fill="none" stroke="#8b1e38" strokeWidth={1.4} strokeLinejoin="round" />
  </Svg>
);

const VideoIcon = () => (
  <Svg width={25} height={25} viewBox="0 0 24 24">
    <Path d="M4 6.5h11.5v11H4zM15.5 10l4.5-2.5v9L15.5 14" fill="none" stroke="#6a2432" strokeWidth={1.5} strokeLinejoin="round" />
  </Svg>
);

type TheorySectionSummary = {
  id: number;
  title: string;
  content: string;
  reward_points: number;
  order_index: number;
};

type PracticalMedia = {
  id: number;
  media_type: 'upload' | 'external_link';
  url: string;
  original_name: string | null;
  title: string | null;
};

const resolveMediaUrl = (url: string, apiBaseUrl: string) => (
  url.startsWith('/') ? `${apiBaseUrl.replace(/\/api\/v1$/, '')}${url}` : url
);

function PulsingTheoryOrb({ section, worshipId, index }: { section: TheorySectionSummary; worshipId: string; index: number }) {
  const scale = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(index * 120),
      Animated.timing(scale, { toValue: 1.045, duration: 1300, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 1300, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [index, scale]);

  return (
    <Pressable
      style={styles.theoryOrbPressable}
      onPress={() => router.push({ pathname: '/theory-section', params: { worshipId, sectionId: String(section.id) } })}
      accessibilityRole="button"
      accessibilityLabel={`فتح قسم ${section.title}`}
    >
      <Animated.View style={[styles.theoryOrb, { transform: [{ scale }] }]}>
        <Text numberOfLines={3} style={styles.theoryOrbTitle}>{section.title}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function ActivityDetailsScreen() {
  const params = useLocalSearchParams<{ worshipId?: string; title?: string; time?: string; endTime?: string }>();
  const [now, setNow] = useState(() => Date.now());
  const [activeSide] = useState<'theoretical' | 'practical' | null>(null);
  const [theorySections, setTheorySections] = useState<TheorySectionSummary[]>([]);
  const [practicalSteps, setPracticalSteps] = useState<Array<{ id: number; title: string; description: string; required_days: number; reward_points: number; order_index: number; media?: PracticalMedia[] }>>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState('');
  const title = params.title || 'العبادة';
  const startTime = params.time || '--:--';
  const worshipId = params.worshipId ?? null;
  const isNumericWorshipId = worshipId !== null && /^[0-9]+$/.test(worshipId);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!worshipId || !isNumericWorshipId) {
      setTheorySections([]);
      setPracticalSteps([]);
      setContentError('');
      setLoadingContent(false);
      return;
    }

    const loadContent = async () => {
      setLoadingContent(true);
      setContentError('');
      try {
        const baseUrl = getAuthApiBaseUrl();
        const [theoryRes, practicalRes] = await Promise.all([
          fetch(`${baseUrl}/theory-sections/worship/${worshipId}`),
          fetch(`${baseUrl}/practical-steps/worship/${worshipId}`),
        ]);

        if (!theoryRes.ok || !practicalRes.ok) {
          throw new Error('فشل تحميل المحتوى من الخادم.');
        }

        const theoryJson = await theoryRes.json();
        const practicalJson = await practicalRes.json();

        setTheorySections(Array.isArray(theoryJson.data) ? theoryJson.data : []);
        setPracticalSteps(Array.isArray(practicalJson.data) ? practicalJson.data : []);
      } catch (err) {
        setContentError(err instanceof Error ? err.message : 'فشل تحميل المحتوى.');
      } finally {
        setLoadingContent(false);
      }
    };

    loadContent();
  }, [worshipId, isNumericWorshipId]);

  const remainingTime = useMemo(() => formatRemainingTime(params.endTime, now), [now, params.endTime]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground source={PAGE_BACKGROUND} resizeMode="cover" style={styles.pageBackground}>
        <View pointerEvents="none" style={styles.pageOverlay} />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 8 + insets.top }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroShade} />
          <View style={styles.heroIcon}><BookIcon /></View>
        </ImageBackground>

        <View style={styles.sheet}>
          <Text style={styles.activityTitle}>{title}</Text>
          <Text style={styles.startTime}>{startTime}<Text style={styles.amPm}> AM</Text></Text>
          <Text style={styles.timeCaption}>وقت البداية</Text>

          <View style={styles.countdownBox}>
            <Text style={styles.countdownValue}>{remainingTime}</Text>
            <Text style={styles.countdownCaption}>متبقي على نهاية العبادة</Text>
          </View>

          <Text style={styles.sectionTitle}>تذكّر نوع العبادة</Text>
          <Text style={styles.sectionIntro}>أضف هنا تعريفًا قصيرًا بالعبادة وما يميزها.</Text>

          <View style={styles.mediaRow}>
            <Pressable
              style={[styles.mediaCard, activeSide === 'theoretical' && styles.mediaCardActive]}
              onPress={() => {
                if (worshipId) router.push({ pathname: '/theory-road', params: { worshipId, title } });
              }}
            >
              <View style={[styles.theoryIconWrapper, activeSide === 'theoretical' && styles.theoryIconWrapperActive]}>
                <TheoreticalBookIcon />
              </View>
              <Text style={styles.mediaTitle}>الجانب النظري</Text>
              <Text style={styles.mediaText}>محتوى نظري تضيفه لاحقًا</Text>
            </Pressable>
            <Pressable
              style={[styles.mediaCard, activeSide === 'practical' && styles.mediaCardActive]}
              onPress={() => {
                if (worshipId) router.push({ pathname: '/practical-road', params: { worshipId, title } });
              }}
            >
              <VideoIcon />
              <Text style={styles.mediaTitle}>الجانب التطبيقي</Text>
              <Text style={styles.mediaText}>محتوى عملي تضيفه لاحقًا</Text>
            </Pressable>
          </View>

          <View style={styles.contentSection}>
            <Text style={styles.contentTitle}>عن هذه العبادة</Text>
            <Text style={styles.placeholderText}>هذه المساحة مخصصة للمحتوى الذي ستضيفه لاحقًا.</Text>
          </View>

          {activeSide === 'theoretical' && (
            <View style={styles.expandedSection}>
              <Text style={styles.contentTitle}>الجانب النظري</Text>
              {loadingContent ? (
                <Text style={styles.placeholderText}>جارٍ تحميل المحتوى...</Text>
              ) : contentError ? (
                <Text style={[styles.placeholderText, { color: '#c94040' }]}>{contentError}</Text>
              ) : theorySections.length === 0 ? (
                <Text style={styles.placeholderText}>لا يوجد محتوى نظري مُعرّف لهذه العبادة بعد.</Text>
              ) : (
                <View style={styles.theoryOrbGrid}>
                  {theorySections.map((section, index) => (
                    <PulsingTheoryOrb key={section.id} section={section} worshipId={worshipId!} index={index} />
                  ))}
                </View>
              )}
            </View>
          )}

          {activeSide === 'practical' && (
            <View style={styles.expandedSection}>
              <Text style={styles.contentTitle}>الجانب التطبيقي</Text>
              {loadingContent ? (
                <Text style={styles.placeholderText}>جارٍ تحميل المحتوى...</Text>
              ) : contentError ? (
                <Text style={[styles.placeholderText, { color: '#c94040' }]}>{contentError}</Text>
              ) : practicalSteps.length === 0 ? (
                <Text style={styles.placeholderText}>لا يوجد خطوات تطبيقية مُعرفة لهذه العبادة بعد.</Text>
              ) : (
                practicalSteps.map((step) => (
                  <View key={step.id} style={styles.sectionCardSmall}>
                    <Text style={styles.contentTitle}>{step.title}</Text>
                    {step.description ? <Text style={styles.placeholderText}>{step.description}</Text> : null}
                    {step.media?.map((media, index) => (
                      <Pressable
                        key={media.id}
                        style={styles.videoButton}
                        onPress={() => Linking.openURL(resolveMediaUrl(media.url, getAuthApiBaseUrl()))}
                        accessibilityRole="link"
                      >
                        <Text style={styles.videoButtonText}>▶ {media.title || media.original_name || `مشاهدة الفيديو ${index + 1}`}</Text>
                      </Pressable>
                    ))}
                    <Text style={styles.placeholderText}>أيام: {step.required_days} · نور: {step.reward_points}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          <Pressable style={styles.completeButton}>
            <Text style={styles.completeText}>أتممت العبادة</Text>
            <Text style={styles.completeMark}>✓</Text>
          </Pressable>
        </View>
      </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a0e14' },
  pageBackground: { flex: 1 },
  pageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 4, 10, 0.45)' },
  scrollContent: { paddingBottom: 20 },
  header: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#f5e6d3', fontSize: 31, lineHeight: 31, fontWeight: '300' },
  headerTitle: { color: '#f5e6d3', fontSize: 13, fontWeight: '700', writingDirection: 'rtl' },
  headerSpacer: { width: 34 },
  hero: { height: 142, justifyContent: 'flex-end', alignItems: 'center' },
  heroImage: { opacity: 0.9 },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35, 8, 19, 0.28)' },
  heroIcon: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: '#d4a574', backgroundColor: 'rgba(75,15,22,0.86)', alignItems: 'center', justifyContent: 'center', marginBottom: -28, zIndex: 2 },
  sheet: { marginTop: 0, marginHorizontal: 8, paddingTop: 24, paddingHorizontal: 12, paddingBottom: 12, borderRadius: 12, backgroundColor: '#faf6f1', minHeight: 560, alignItems: 'center' },
  activityTitle: { color: '#4b0f16', fontSize: 16, fontWeight: '800', writingDirection: 'rtl' },
  startTime: { color: '#6a2432', fontSize: 20, fontWeight: '800', marginTop: 7, fontVariant: ['tabular-nums'] },
  amPm: { fontSize: 8, color: '#7f5b57' },
  timeCaption: { color: '#876e69', fontSize: 8, marginTop: -1 },
  countdownBox: { alignSelf: 'stretch', marginTop: 8, paddingVertical: 7, borderRadius: 6, backgroundColor: '#fffafa', borderWidth: 1, borderColor: '#eaded9', alignItems: 'center' },
  countdownValue: { color: '#6a2432', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  countdownCaption: { color: '#886d67', fontSize: 7, marginTop: 2, writingDirection: 'rtl' },
  sectionTitle: { color: '#6a2432', fontSize: 12, fontWeight: '800', marginTop: 12, writingDirection: 'rtl' },
  sectionIntro: { color: '#775d58', fontSize: 8, lineHeight: 12, textAlign: 'center', marginTop: 2, writingDirection: 'rtl' },
  mediaRow: { flexDirection: 'row-reverse', alignSelf: 'stretch', gap: 7, marginTop: 8 },
  mediaCard: { flex: 1, minHeight: 74, borderRadius: 6, borderWidth: 1, borderColor: '#d9c1bb', backgroundColor: '#fffafa', alignItems: 'center', justifyContent: 'center', padding: 7 },
  mediaCardActive: { borderColor: '#7a2838', borderWidth: 1.5, backgroundColor: '#f8ece8' },
  theoryIconWrapper: { width: 34, height: 34, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  theoryIconWrapperActive: { },
  mediaTitle: { color: '#6a2432', fontSize: 9, fontWeight: '800', marginTop: 4, writingDirection: 'rtl' },
  mediaText: { color: '#806762', fontSize: 7, lineHeight: 9, textAlign: 'center', marginTop: 2, writingDirection: 'rtl' },
  contentSection: { alignSelf: 'stretch', marginTop: 9, paddingTop: 7, borderTopWidth: 1, borderTopColor: '#eaded9' },
  expandedSection: { alignSelf: 'stretch', marginTop: 9, padding: 9, borderRadius: 6, backgroundColor: '#fffafa', borderWidth: 1, borderColor: '#d9c1bb' },
  contentTitle: { color: '#6a2432', fontSize: 10, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  placeholderText: { color: '#725e59', fontSize: 8, lineHeight: 12, textAlign: 'right', marginTop: 4, writingDirection: 'rtl' },
  placeholderList: { marginTop: 4, alignSelf: 'stretch' },
  placeholderBullet: { color: '#725e59', fontSize: 8, lineHeight: 14, textAlign: 'right', writingDirection: 'rtl' },
  videoPlaceholder: { height: 58, marginTop: 7, borderRadius: 5, backgroundColor: '#eaded9', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#6a2432', fontSize: 14, marginBottom: 2 },
  videoPlaceholderText: { color: '#725e59', fontSize: 8, writingDirection: 'rtl' },
  completeButton: { alignSelf: 'stretch', marginTop: 12, minHeight: 32, borderRadius: 6, backgroundColor: '#5a1020', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7 },
  completeText: { color: '#f5e6d3', fontSize: 10, fontWeight: '700', writingDirection: 'rtl' },
  sectionCardSmall: { marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: '#f6f0e8', borderWidth: 1, borderColor: '#e4d7c7' },
  videoButton: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 5, backgroundColor: '#5a1020' },
  videoButtonText: { color: '#f5e6d3', fontSize: 9, fontWeight: '700', writingDirection: 'rtl' },
  theoryOrbGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-around', gap: 12, marginTop: 12 },
  theoryOrbPressable: { width: '44%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  theoryOrb: { width: '100%', height: '100%', borderRadius: 999, backgroundColor: '#5a1020', borderWidth: 2, borderColor: '#d4a574', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, shadowColor: '#4b0f16', shadowOpacity: 0.26, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  theoryOrbTitle: { color: '#f5e6d3', fontSize: 11, lineHeight: 16, fontWeight: '800', textAlign: 'center', writingDirection: 'rtl' },
  completeMark: { color: '#f5e6d3', fontSize: 14, fontWeight: '700' },
});
