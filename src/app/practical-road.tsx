import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { VideoSource } from 'expo-video';
import Svg, { Path } from 'react-native-svg';
import { getAuthApiBaseUrl } from '../services/auth-api';
import { getTheoryDisplayTheme } from '../constants/theory-display-theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PracticalMedia = { id: number; url: string; title: string | null; original_name: string | null };
type PracticalStep = {
  id: number;
  title: string;
  description: string | null;
  reward_points: number;
  order_index: number;
  media?: PracticalMedia[];
};

const resolveMediaUrl = (url: string) => (
  url.startsWith('/') ? `${getAuthApiBaseUrl().replace(/\/api\/v1$/, '')}${url}` : url
);

function VideoIcon() {
  return <Svg width={42} height={42} viewBox="0 0 24 24"><Path d="M4 6.5h11.5v11H4zM15.5 10l4.5-2.5v9L15.5 14" fill="none" stroke="#f5e6d3" strokeWidth={1.35} strokeLinejoin="round" /></Svg>;
}

function InAppVideoPlayer({ media, onClose }: { media: PracticalMedia; onClose: () => void }) {
  const url = resolveMediaUrl(media.url);
  const source: VideoSource = {
    uri: url,
    contentType: url.toLowerCase().includes('.m3u8') ? 'hls' : 'auto',
    metadata: { title: media.title || media.original_name || 'فيديو تعليمي' },
  };
  const player = useVideoPlayer(source, (videoPlayer) => {
    try {
      videoPlayer.play();
    } catch {
      // Ignore autoplay issues on some devices; the player can still be used manually.
    }
  });

  const handleClose = () => {
    try {
      player.pause();
    } catch {
      // ignore: expo-video may already have released the native player during unmount
    }
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <View style={styles.playerOverlay}>
        <View style={styles.playerSheet}>
          <View style={styles.playerHeader}>
            <Pressable style={styles.closePlayer} onPress={handleClose} accessibilityRole="button" accessibilityLabel="إغلاق الفيديو">
              <Text style={styles.closePlayerText}>×</Text>
            </Pressable>
            <View style={styles.playerTitleWrap}>
              <Text numberOfLines={1} style={styles.playerTitle}>{media.title || media.original_name || 'فيديو تعليمي'}</Text>
              <Text style={styles.qualityHint}>الجودة: تلقائية حسب سرعة الاتصال</Text>
            </View>
          </View>
          <VideoView
            style={styles.videoPlayer}
            player={player}
            nativeControls
            contentFit="contain"
            fullscreenOptions={{ enable: true, orientation: 'landscape' }}
          />
        </View>
      </View>
    </Modal>
  );
}

function VideoCardPreview({
  media,
  isPlaying,
  isInline,
  onOpen,
  onInlineToggle,
  onMaximize,
}: {
  media: PracticalMedia;
  isPlaying: boolean;
  isInline: boolean;
  onOpen: () => void;
  onInlineToggle: () => void;
  onMaximize: () => void;
}) {
  const url = resolveMediaUrl(media.url);
  const source: VideoSource = {
    uri: url,
    contentType: url.toLowerCase().includes('.m3u8') ? 'hls' : 'auto',
    metadata: { title: media.title || media.original_name || 'فيديو تعليمي' },
  };

  const player = useVideoPlayer(source, (videoPlayer) => {
    try {
      videoPlayer.muted = !isInline;
      if (isInline) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    } catch {
      // Some versions require the player to be created but not actively playing in preview mode.
    }
  });

  const playCurrentPlayer = () => {
    try {
      player.muted = false;
      player.play();
    } catch {
      // Ignore transient playback state changes.
    }
  };

  const pauseCurrentPlayer = () => {
    try {
      player.muted = true;
      player.pause();
    } catch {
      // Ignore transient playback state changes.
    }
  };

  useEffect(() => {
    if (isInline) {
      playCurrentPlayer();
    } else {
      pauseCurrentPlayer();
    }
  }, [isInline]);

  return (
    <View style={styles.videoCard}>
      {isInline ? (
        <View style={styles.inlinePlayerWrap}>
          <VideoView
            style={styles.inlineVideo}
            player={player}
            nativeControls
            contentFit="cover"
            fullscreenOptions={{ enable: true, orientation: 'landscape' }}
          />
        </View>
      ) : (
        <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`عرض الفيديو ${media.title || media.original_name || 'تعليمي'}`}>
          <View style={styles.videoPreview}>
            <VideoView
              style={styles.previewVideo}
              player={player}
              contentFit="cover"
              nativeControls={false}
              pointerEvents="none"
            />
            <View style={styles.coverBadge}>
              <Text style={styles.previewPlay}>▶</Text>
            </View>
            <View style={styles.coverInfo}>
              <Text style={styles.coverLabel}>فيديو</Text>
              <Text numberOfLines={2} style={styles.videoName}>{media.title || media.original_name || 'فيديو تعليمي'}</Text>
            </View>
          </View>
        </Pressable>
      )}

      <View style={styles.controls}>
        <View style={styles.maximizeSlot}>
          <Pressable style={[styles.stopButton, { borderColor: '#dcb575' }]} onPress={() => {
            playCurrentPlayer();
            onMaximize();
          }}>
            <Text style={[styles.stopText, { color: '#f5e6d3' }]}>⤢ تكبير</Text>
          </Pressable>
        </View>
        <Pressable
          style={[styles.controlButton, { backgroundColor: '#dcb575' }]}
          onPress={() => {
            if (isInline) {
              pauseCurrentPlayer();
              onInlineToggle();
              return;
            }
            playCurrentPlayer();
            onOpen();
          }}
        >
          <Text style={styles.playText}>{isInline ? 'إيقاف' : isPlaying ? 'قيد العرض' : 'عرض'} ▶</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function PracticalRoad() {
  const { worshipId = '', title = 'العبادة' } = useLocalSearchParams<{ worshipId?: string; title?: string }>();
  const theme = getTheoryDisplayTheme(worshipId);
  const insets = useSafeAreaInsets();
  const [steps, setSteps] = useState<PracticalStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedStepIds, setCompletedStepIds] = useState<number[]>([]);
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<PracticalMedia | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const [stepsRes, progRes] = await Promise.all([
          fetch(`${getAuthApiBaseUrl()}/practical-steps/worship/${worshipId}`),
          token ? fetch(`${getAuthApiBaseUrl()}/practical-steps/progress/${worshipId}`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null),
        ]);

        if (!stepsRes.ok) throw new Error('تعذر تحميل الأقسام التطبيقية.');
        const payload = await stepsRes.json();
        if (active) setSteps((Array.isArray(payload.data) ? payload.data : []).sort((a: PracticalStep, b: PracticalStep) => a.order_index - b.order_index));

        if (progRes && progRes.ok) {
          const progData = await progRes.json();
          if (active && Array.isArray(progData.data)) {
            setCompletedStepIds(progData.data.filter((p: any) => p.completed).map((p: any) => p.step_id));
          }
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'تعذر تحميل الأقسام التطبيقية.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [worshipId]);

  const handleCompleteStep = async (stepId: number, rewardPoints: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const res = await fetch(`${getAuthApiBaseUrl()}/practical-steps/${stepId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const resJson = await res.json();
          setCompletedStepIds((prev) => Array.from(new Set([...prev, stepId])));
          const awarded = resJson.data?.awardedPoints !== undefined ? resJson.data.awardedPoints : (rewardPoints || 25);
          if (awarded > 0) {
            setRewardAmount(awarded);
          }
        }
      } else {
        setCompletedStepIds((prev) => Array.from(new Set([...prev, stepId])));
        setRewardAmount(rewardPoints || 25);
      }
    } catch (e) {
      console.warn('Error completing practical step:', e);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.background, paddingTop: 14 + insets.top }]} showsVerticalScrollIndicator={false}>
        <Pressable style={[styles.back, { borderColor: theme.accent }]} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="رجوع">
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
          <View style={[styles.heroIcon, { backgroundColor: theme.background, borderColor: theme.accent }]}><VideoIcon /></View>
          <View style={styles.heroText}>
            <Text style={[styles.eyebrow, { color: theme.muted }]}>المسار العملي</Text>
            <Text style={styles.worship}>{title}</Text>
            <Text style={[styles.kind, { color: theme.accentSoft }]}>الجانب التطبيقي</Text>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>الأقسام التطبيقية</Text>
          <Text style={[styles.listSubtitle, { color: theme.muted }]}>شاهد الفيديو وطبّق الخطوة بهدوء</Text>
        </View>

        {loading ? <Text style={[styles.message, { color: theme.muted }]}>جارٍ تحميل الأقسام...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && steps.length === 0 ? <Text style={[styles.message, { color: theme.muted }]}>لا توجد أقسام تطبيقية لهذه العبادة بعد.</Text> : null}

        {steps.map((step, stepIndex) => {
          const isDone = completedStepIds.includes(step.id);
          return (
            <View key={step.id} style={[styles.stepCard, { backgroundColor: theme.surface, borderColor: isDone ? theme.accent : `${theme.accent}55` }]}>
              <View style={styles.stepHeading}>
                <View style={[styles.stepNumber, { borderColor: theme.accent, backgroundColor: isDone ? theme.accent : 'transparent' }]}>
                  <Text style={[styles.stepNumberText, { color: isDone ? '#fff' : theme.accent }]}>{isDone ? '✓' : stepIndex + 1}</Text>
                </View>
                <View style={styles.stepHeadingText}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
              </View>

              {step.media?.length ? step.media.map((media) => {
                const isPlaying = activeVideoId === media.id || selectedMedia?.id === media.id;
                const isInline = activeVideoId === media.id;
                return (
                  <View key={media.id}>
                    <VideoCardPreview
                      media={media}
                      isPlaying={isPlaying}
                      isInline={isInline}
                      onOpen={() => setActiveVideoId((current) => current === media.id ? null : media.id)}
                      onInlineToggle={() => setActiveVideoId((current) => current === media.id ? null : media.id)}
                      onMaximize={() => setSelectedMedia(media)}
                    />
                    {step.description ? <Text style={[styles.videoDescription, { color: theme.muted }]}>{step.description}</Text> : null}
                  </View>
                );
              }) : <Text style={[styles.noVideo, { color: theme.muted }]}>سيُضاف فيديو لهذا القسم قريبًا.</Text>}

              <Pressable
                style={[styles.doneBtn, { backgroundColor: isDone ? '#2c3e50' : '#8b1e38', borderColor: theme.accent }]}
                onPress={() => !isDone && handleCompleteStep(step.id, step.reward_points)}
                disabled={isDone}
              >
                <Text style={styles.doneBtnText}>{isDone ? 'تم إتمام الخطوة بنجاح ✓' : `إتمام وتطبيق الخطوة (+${step.reward_points || 25} نور)`}</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      {selectedMedia ? <InAppVideoPlayer media={selectedMedia} onClose={() => setSelectedMedia(null)} /> : null}

      {rewardAmount !== null ? (
        <View style={styles.rewardBackdrop}>
          <View style={styles.rewardCard}>
            <Text style={styles.rewardStarIcon}>🌟</Text>
            <Text style={styles.rewardHead}>أحسنت صنعاً!</Text>
            <Text style={styles.rewardSub}>تم إنجاز الخطوة التطبيقية وحصلت على:</Text>
            <Text style={styles.rewardValue}>+{rewardAmount} نور</Text>
            <Pressable style={styles.rewardClose} onPress={() => setRewardAmount(null)}>
              <Text style={styles.rewardCloseText}>متابعة</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 14, paddingBottom: 32 },
  back: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, backgroundColor: '#24101b', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  backText: { color: '#f5e6d3', fontSize: 31, lineHeight: 31, marginTop: -4 },
  hero: { minHeight: 120, borderRadius: 22, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 15, shadowColor: '#000', shadowOpacity: .3, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 6 },
  heroIcon: { width: 80, height: 80, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
  worship: { color: '#f5e6d3', fontSize: 26, fontWeight: '900', lineHeight: 34, writingDirection: 'rtl', textAlign: 'right', marginTop: 3 },
  kind: { fontSize: 15, fontWeight: '800', writingDirection: 'rtl', marginTop: 2 },
  listHeader: { marginTop: 22, marginBottom: 12, alignItems: 'flex-end' },
  listTitle: { color: '#f5e6d3', fontSize: 18, fontWeight: '900', writingDirection: 'rtl' },
  listSubtitle: { fontSize: 11, writingDirection: 'rtl', marginTop: 3 },
  message: { textAlign: 'center', marginVertical: 28, writingDirection: 'rtl' },
  error: { color: '#e394aa', textAlign: 'center', marginVertical: 28, writingDirection: 'rtl' },
  stepCard: { borderWidth: 1, borderRadius: 18, padding: 13, marginBottom: 14 },
  stepHeading: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10 },
  stepNumber: { width: 29, height: 29, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontWeight: '900', fontSize: 13 },
  stepHeadingText: { flex: 1, alignItems: 'flex-end' },
  stepTitle: { color: '#f5e6d3', fontSize: 17, fontWeight: '900', writingDirection: 'rtl', textAlign: 'right' },
  videoDescription: { fontSize: 11, lineHeight: 17, writingDirection: 'rtl', textAlign: 'right', marginTop: 10, marginBottom: 2 },
  videoCard: { borderRadius: 13, marginTop: 13, overflow: 'hidden', backgroundColor: '#160a10' },
  videoPreview: {
    height: 132,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 13,
    backgroundColor: '#000',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  inlinePlayerWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,169,110,0.35)',
  },
  inlineVideo: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  coverBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -22 }, { translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(17, 12, 15, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.5)',
  },
  previewPlay: { color: '#f5e6d3', fontSize: 24, marginLeft: 2 },
  coverInfo: { position: 'absolute', left: 12, right: 12, bottom: 12, alignItems: 'flex-end' },
  coverLabel: { color: '#d7b67b', fontSize: 10, fontWeight: '800', writingDirection: 'rtl', marginBottom: 3 },
  videoName: { color: '#f5e6d3', fontSize: 12, fontWeight: '700', writingDirection: 'rtl', textAlign: 'right' },
  controls: { flexDirection: 'row-reverse', gap: 8, padding: 9, justifyContent: 'flex-end', alignItems: 'center' },
  controlButton: { minWidth: 80, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, alignItems: 'center', backgroundColor: '#dcb575' },
  playText: { color: '#1a0e14', fontSize: 11, fontWeight: '900', writingDirection: 'rtl' },
  maximizeSlot: { marginRight: 0 },
  stopButton: { minWidth: 70, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, alignItems: 'center', borderColor: '#dcb575' },
  stopText: { fontSize: 11, fontWeight: '800', writingDirection: 'rtl' },
  noVideo: { textAlign: 'right', writingDirection: 'rtl', fontSize: 11, marginTop: 12 },
  playerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', padding: 16 },
  playerSheet: { overflow: 'hidden', borderRadius: 16, backgroundColor: '#160a10', borderWidth: 1, borderColor: 'rgba(201,169,110,0.45)' },
  playerHeader: { minHeight: 58, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  playerTitleWrap: { flex: 1, alignItems: 'flex-end' },
  playerTitle: { color: '#f5e6d3', fontSize: 14, fontWeight: '800', writingDirection: 'rtl', textAlign: 'right' },
  qualityHint: { color: '#c9a96e', fontSize: 10, marginTop: 3, writingDirection: 'rtl' },
  closePlayer: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(245,230,211,0.13)', alignItems: 'center', justifyContent: 'center' },
  closePlayerText: { color: '#f5e6d3', fontSize: 25, lineHeight: 28 },
  videoPlayer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  doneBtn: { marginTop: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', writingDirection: 'rtl' },
  rewardBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  rewardCard: { width: '100%', maxWidth: 320, backgroundColor: '#24161f', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: '#d4a574' },
  rewardStarIcon: { fontSize: 44, marginBottom: 8 },
  rewardHead: { color: '#f5e6d3', fontSize: 22, fontWeight: '900', writingDirection: 'rtl', marginBottom: 4 },
  rewardSub: { color: '#a99284', fontSize: 13, writingDirection: 'rtl', textAlign: 'center', marginBottom: 12 },
  rewardValue: { color: '#d4a574', fontSize: 28, fontWeight: '900', marginBottom: 18 },
  rewardClose: { width: '100%', paddingVertical: 12, backgroundColor: '#8b1e38', borderRadius: 14, alignItems: 'center' },
  rewardCloseText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
