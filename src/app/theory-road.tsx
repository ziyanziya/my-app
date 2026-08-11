import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { getAuthApiBaseUrl } from '../services/auth-api';
import { getTheoryDisplayTheme } from '../constants/theory-display-theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Section = { id: number; title: string; reward_points: number; order_index: number };
type Status = 'locked' | 'available' | 'active' | 'completed';
type Node = Section & { status: Status };
const colors = { bg: '#1a0e14', surface: '#24161f', accent: '#d4a574', rose: '#8b1e38', text: '#f5e6d3', muted: '#a9918a', line: '#6f4354' };
const completionKey = (worshipId: string) => `theory-completed-sections:${worshipId}`;

function BookIcon() { return <Svg width={48} height={48} viewBox="0 0 24 24"><Path d="M3.5 5.5c2.7-1.3 5.3-1.1 8.5.7v12.1c-3.2-1.8-5.8-2-8.5-.7V5.5Zm17 0c-2.7-1.3-5.3-1.1-8.5.7v12.1c3.2-1.8 5.8-2 8.5-.7V5.5Z" fill="none" stroke={colors.text} strokeWidth="1.4" /><Path d="M15.5 8.5h3M15.5 11.5h3" stroke={colors.accent} strokeWidth="1.2" strokeLinecap="round" /></Svg>; }
function Ring({ value }: { value: number }) { const r = 35; const c = 2 * Math.PI * r; return <View style={styles.ring}><Svg width={88} height={88}><Circle cx="44" cy="44" r={r} stroke="#4e2d3d" strokeWidth="7" fill="none" /><Circle cx="44" cy="44" r={r} stroke={colors.accent} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - value / 100)} rotation="-90" origin="44,44" /></Svg><Text style={styles.ringText}>{value}%</Text></View>; }
function Decoration() { return <View pointerEvents="none" style={styles.decoration}><Text style={[styles.star, { top: 70, right: 30 }]}>✦</Text><Text style={[styles.star, { top: 250, right: 80 }]}>✧</Text><Text style={[styles.star, { top: 430, right: 20 }]}>✦</Text><Text style={styles.moon}>☾</Text><Text style={styles.lantern}>۞</Text></View>; }
function JourneyNode({ node, index, worshipId }: { node: Node; index: number; worshipId: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => { if (node.status !== 'active' || index !== 0) return; const a = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.05, duration: 1500, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true })])); a.start(); return () => a.stop(); }, [index, node.status, pulse]);
  const side = index % 2 === 0 ? styles.nodeRight : styles.nodeLeft;
  const locked = node.status === 'locked';
  const isFuture = Number(node.id) < 0;
  return <View style={[styles.nodeRow, side]}><Pressable disabled={isFuture} onPress={() => router.push({ pathname: '/theory-section', params: { worshipId, sectionId: String(node.id) } })} style={styles.nodeTouch}><Animated.View style={[styles.node, locked && styles.nodeLocked, node.status === 'completed' && styles.nodeComplete, node.status === 'active' && styles.nodeActive, { transform: [{ scale: node.status === 'active' ? pulse : 1 }] }]}><Text style={styles.nodeIndex}>{index + 1}</Text>{!locked && <><Text numberOfLines={2} style={styles.nodeTitle}>{node.title}</Text><Text style={styles.nodePoints}>☆ {node.reward_points}</Text></>}{node.status === 'completed' && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}</Animated.View></Pressable></View>;
}

export default function TheoryRoad() {
  const { worshipId = '', title = 'العبادة' } = useLocalSearchParams<{ worshipId?: string; title?: string }>();
  const theme = getTheoryDisplayTheme(worshipId);
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState<Section[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { (async () => { try { const r = await fetch(`${getAuthApiBaseUrl()}/theory-sections/worship/${worshipId}`); if (!r.ok) throw new Error('تعذر تحميل الأقسام.'); const p = await r.json(); setSections((Array.isArray(p.data) ? p.data : []).sort((a: Section, b: Section) => a.order_index - b.order_index)); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر تحميل الأقسام.'); } })(); }, [worshipId]);
  useFocusEffect(useCallback(() => {
    let active = true;
    AsyncStorage.getItem(completionKey(worshipId)).then((stored) => {
      if (!active) return;
      try { setCompletedIds(JSON.parse(stored || '[]')); } catch { setCompletedIds([]); }
    });
    return () => { active = false; };
  }, [worshipId]));
  // كل الأقسام القادمة من قاعدة البيانات متاحة للقراءة؛ الرمادي للمراحل الافتراضية فقط.
  const nodes = useMemo<Node[]>(() => sections.map((s) => ({ ...s, status: completedIds.includes(s.id) ? 'completed' : 'active' })), [completedIds, sections]);
  const completedCount = useMemo(() => sections.filter((section) => completedIds.includes(section.id)).length, [completedIds, sections]);
  const progressPercent = sections.length ? Math.round((completedCount / sections.length) * 100) : 0;
  const earnedLight = useMemo(() => sections.filter((section) => completedIds.includes(section.id)).reduce((total, section) => total + Number(section.reward_points || 0), 0), [completedIds, sections]);
  const displayNodes = useMemo<Node[]>(() => [
    ...nodes,
    ...Array.from({ length: 6 }, (_, index) => ({ id: -(index + 1), title: '', reward_points: 0, order_index: nodes.length + index + 1, status: 'locked' as Status })),
  ], [nodes]);
  const points = useMemo(() => sections.reduce((sum, s) => sum + Number(s.reward_points || 0), 0), [sections]);
  const pathHeight = Math.max(360, displayNodes.length * 118);
  const path = displayNodes.slice(1).map((_, i) => {
    const firstCenterY = 72 + i * 118;
    const secondCenterY = firstCenterY + 118;
    const startX = i % 2 === 0 ? 76 : 24;
    const endX = i % 2 === 0 ? 24 : 76;
    const startY = firstCenterY + 45;
    const endY = secondCenterY - 40;
    return `M ${startX} ${startY} C ${startX} ${startY + 18}, ${endX} ${endY - 18}, ${endX} ${endY}`;
  }).join(' ');
  const statsCard = <View style={styles.stats}><Text style={styles.statsTitle}>تقدّمك</Text><Ring value={progressPercent} /><View style={styles.divider} /><Text style={styles.statLabel}>النور المكتسب</Text><Text style={styles.statValue}>☆ {earnedLight}</Text></View>;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.background, paddingTop: 14 + insets.top }]} showsVerticalScrollIndicator={false}>
        <Decoration />
        <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.accent }]}><View style={[styles.book, { backgroundColor: theme.background, borderColor: theme.accent, shadowColor: theme.accent }]}><BookIcon /></View><View style={styles.heroText}><Text style={[styles.eyebrow, { color: theme.muted }]}>القسم 1</Text><Text style={styles.worship}>{title}</Text><Text style={[styles.kind, { color: theme.accentSoft }]}>الجانب النظري</Text></View></View>
        <View style={styles.main}>
          <View style={styles.journeyColumn}>
            <View style={styles.journeyHeader}><Text style={styles.journeyTitle}>رحلة المعرفة</Text><Text style={styles.journeySub}>اقرأ كل قسم بعناية وانتقل للمثالي مع انتهاء الوقت</Text></View>
            {error ? <Text style={styles.error}>{error}</Text> : <View style={[styles.road, { minHeight: pathHeight }]}>
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox={`0 0 100 ${pathHeight}`} preserveAspectRatio="none">
                <Path d={path} stroke="#b96486" strokeWidth="4" strokeDasharray="10 7" strokeLinecap="round" fill="none" opacity={0.95} />
                <Path d={path} stroke="#e2a4b7" strokeWidth="1" strokeDasharray="10 7" strokeLinecap="round" fill="none" opacity={0.9} />
              </Svg>
              {displayNodes.map((node, i) => <JourneyNode key={node.id} node={node} index={i} worshipId={worshipId} />)}
            </View>}
          </View>
        </View>
        <Pressable disabled={!nodes[0]} style={styles.continue} onPress={() => nodes[0] && router.push({ pathname: '/theory-section', params: { worshipId, sectionId: String(nodes[0].id) } })}><Text style={styles.continueText}>متابعة القراءة</Text><Text style={styles.play}>▷</Text></Pressable>
      </ScrollView>
      <View pointerEvents="box-none" style={styles.fixedStats}>{statsCard}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, content: { padding: 14, paddingBottom: 30, backgroundColor: colors.bg },
  back: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, borderColor: colors.rose, backgroundColor: '#24101b', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, backText: { color: colors.text, fontSize: 31, lineHeight: 31, marginTop: -4 },
  hero: { minHeight: 120, borderRadius: 22, borderWidth: 1, borderColor: '#633142', backgroundColor: 'rgba(41,14,29,.92)', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 15, shadowColor: '#000', shadowOpacity: .3, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 6 }, book: { width: 80, height: 80, borderRadius: 20, borderWidth: 1, borderColor: colors.rose, backgroundColor: '#351022', alignItems: 'center', justifyContent: 'center', shadowColor: colors.rose, shadowOpacity: .55, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 7 }, heroText: { flex: 1, alignItems: 'flex-end' }, eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '700', writingDirection: 'rtl' }, worship: { color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 34, writingDirection: 'rtl', textAlign: 'right', marginTop: 3 }, kind: { color: '#c77a91', fontSize: 15, fontWeight: '800', writingDirection: 'rtl', marginTop: 2 },
  main: { alignItems: 'flex-start', marginTop: 17 }, journeyColumn: { width: '70%' }, journeyHeader: { paddingTop: 7, paddingRight: 3, minHeight: 64 }, journeyTitle: { color: colors.text, fontWeight: '800', fontSize: 15, writingDirection: 'rtl', textAlign: 'right' }, journeySub: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'right', writingDirection: 'rtl', marginTop: 4 }, fixedStats: { position: 'absolute', top: 214, right: 14, width: 76, zIndex: 10 }, stats: { width: '100%', borderWidth: 1, borderColor: '#444050', borderRadius: 15, backgroundColor: '#151019', alignItems: 'center', paddingVertical: 9, shadowColor: '#000', shadowOpacity: .3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 7 }, statsTitle: { color: colors.text, fontSize: 9, fontWeight: '800', writingDirection: 'rtl' }, ring: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginVertical: 2, transform: [{ scale: .73 }] }, ringText: { position: 'absolute', color: '#dfa0b4', fontSize: 15, fontWeight: '900' }, divider: { height: 1, alignSelf: 'stretch', backgroundColor: '#49404b', marginHorizontal: 8, marginVertical: 6 }, statLabel: { color: '#ce8297', fontSize: 7, fontWeight: '700', writingDirection: 'rtl' }, statValue: { color: colors.accent, fontSize: 10, fontWeight: '900', marginTop: 2 },
  road: { position: 'relative', paddingTop: 13 }, nodeRow: { width: '52%', height: 118, alignItems: 'center', justifyContent: 'center' }, nodeRight: { alignSelf: 'flex-end' }, nodeLeft: { alignSelf: 'flex-start' }, nodeTouch: { padding: 7 }, node: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#5c5661', backgroundColor: '#15151b', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }, nodeComplete: { borderColor: colors.accent, backgroundColor: '#351022', shadowColor: colors.rose, shadowOpacity: .8, shadowRadius: 15, shadowOffset: { width: 0, height: 0 }, elevation: 10 }, nodeActive: { width: 91, height: 91, borderRadius: 46, borderColor: '#e2a4b7', backgroundColor: '#351022', shadowColor: colors.rose, shadowOpacity: .95, shadowRadius: 19, shadowOffset: { width: 0, height: 0 }, elevation: 12 }, nodeLocked: { opacity: .5 }, nodeIndex: { color: colors.text, fontSize: 16, fontWeight: '900' }, nodeTitle: { color: colors.text, fontSize: 9, lineHeight: 13, fontWeight: '800', writingDirection: 'rtl', textAlign: 'center', marginTop: 2 }, nodePoints: { color: colors.accent, fontSize: 10, marginTop: 2 }, check: { position: 'absolute', right: -7, top: -7, width: 29, height: 29, borderRadius: 15, backgroundColor: colors.rose, borderWidth: 2, borderColor: '#e1a6b7', alignItems: 'center', justifyContent: 'center' }, checkText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  continue: { alignSelf: 'flex-end', width: 220, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#c77a91', backgroundColor: '#3c1127', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: colors.rose, shadowOpacity: .85, shadowRadius: 13, shadowOffset: { width: 0, height: 0 }, elevation: 10 }, continueText: { color: colors.text, fontSize: 16, fontWeight: '800', writingDirection: 'rtl' }, play: { color: '#e2a4b7', fontSize: 27 }, error: { color: '#d9869e', textAlign: 'center', marginVertical: 30 },
  decoration: { ...StyleSheet.absoluteFillObject, opacity: .08 }, star: { position: 'absolute', color: colors.accent, fontSize: 26 }, moon: { position: 'absolute', right: 22, top: 390, color: colors.accent, fontSize: 110 }, lantern: { position: 'absolute', right: 35, top: 560, color: colors.accent, fontSize: 90 },
});
