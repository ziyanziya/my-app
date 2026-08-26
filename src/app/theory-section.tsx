import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { getAuthApiBaseUrl } from '../services/auth-api';
import { fetchWithAuth } from '../services/auth-session';

type Section = { id: number; title: string; content: string; reward_points: number; order_index: number };
const C = { bg: '#1a0e14', panel: '#24161f', rose: '#8b1e38', pink: '#c77a91', gold: '#d4a574', text: '#f5e6d3', muted: '#a9918a' };

const Book = () => <Svg width={38} height={38} viewBox="0 0 24 24"><Path d="M3.5 5.5c2.7-1.3 5.3-1.1 8.5.7v12.1c-3.2-1.8-5.8-2-8.5-.7V5.5Zm17 0c-2.7-1.3-5.3-1.1-8.5.7v12.1c3.2-1.8 5.8-2 8.5-.7V5.5Z" fill="none" stroke={C.text} strokeWidth="1.4" /></Svg>;

export default function TheorySection() {
  const { worshipId = '', sectionId = '' } = useLocalSearchParams<{ worshipId?: string; sectionId?: string }>();
  const id = Number(sectionId);
  const [all, setAll] = useState<Section[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [err, setErr] = useState('');
  const [showReward, setShowReward] = useState(false);
  const rewardScale = useRef(new Animated.Value(0.72)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${getAuthApiBaseUrl()}/theory-sections/worship/${worshipId}`);
        if (!response.ok) throw new Error('تعذر تحميل محتوى القسم.');
        const payload = await response.json();
        setAll((Array.isArray(payload.data) ? payload.data : []).sort((a: Section, b: Section) => a.order_index - b.order_index));
      } catch (error) {
        setErr(error instanceof Error ? error.message : 'تعذر تحميل محتوى القسم.');
      }
    })();
  }, [worshipId]);

  useEffect(() => {
    let active = true;
    fetchWithAuth(`${getAuthApiBaseUrl()}/users/progress/theory/${worshipId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load theory progress');
        const payload = await response.json();
        if (!active) return;
        const progress = Array.isArray(payload.data) ? payload.data : [];
        setCompletedIds(progress.filter((item: { completed?: boolean | number | string }) => item.completed === true || Number(item.completed) === 1).map((item: { section_id: number }) => item.section_id));
      })
      .catch(() => { if (active) setCompletedIds([]); });
    return () => { active = false; };
  }, [worshipId]);

  const index = all.findIndex((item) => item.id === id);
  const section = index >= 0 ? all[index] : null;
  const next = index >= 0 ? all[index + 1] : null;
  const percent = all.length ? Math.round((completedIds.filter((completedId) => all.some((item) => item.id === completedId)).length / all.length) * 100) : 0;
  const completeReading = async () => {
    let awarded = section?.reward_points || 15;
    try {
      const res = await fetchWithAuth(`${getAuthApiBaseUrl()}/users/progress/theory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worship_id: Number(worshipId), section_id: id, completed: 1 }),
      });
      if (!res.ok) {
        setErr('تعذر حفظ إتمام القراءة. حاول مرة أخرى.');
        return;
      }
      const resJson = await res.json();
      setCompletedIds((current) => Array.from(new Set([...current, id])));
      if (resJson.data?.awardedPoints !== undefined) {
        awarded = resJson.data.awardedPoints;
      }
    } catch (e) {
      console.warn('Could not sync theory progress with backend:', e);
      setErr('تعذر حفظ إتمام القراءة. تحقق من اتصالك ثم حاول مرة أخرى.');
      return;
    }

    if (awarded > 0 && section) {
      section.reward_points = awarded;
      rewardScale.setValue(0.72);
      rewardOpacity.setValue(0);
      setShowReward(true);
      Animated.parallel([
        Animated.spring(rewardScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
        Animated.timing(rewardOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      setShowReward(false);
      if (next) router.replace({ pathname: '/theory-section', params: { worshipId, sectionId: String(next.id) } });
      else router.back();
    }
  };
  const continueAfterReward = () => {
    setShowReward(false);
    if (next) router.replace({ pathname: '/theory-section', params: { worshipId, sectionId: String(next.id) } });
    else router.back();
  };

  if (err || !section) return <SafeAreaView style={s.safe}><View style={s.state}>{err ? <Text style={s.stateText}>{err}</Text> : <ActivityIndicator color={C.gold} />}</View></SafeAreaView>;

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={[s.scroll, { paddingTop: 8 + insets.top }]} showsVerticalScrollIndicator={false}>
    <View style={s.top}><Pressable style={s.back} onPress={() => router.back()}><Text style={s.backTxt}>‹</Text></Pressable><View style={s.route}><Text style={s.routeTxt}>رحلة المعرفة</Text></View></View>
    <View style={s.icon}><Book /></View><Text style={s.worship}>{section.title}</Text><Text style={s.sub}>القسم <Text style={s.pink}>{index + 1}</Text> من {all.length}</Text>
    <View style={s.progress}><View style={s.track}><View style={[s.fill, { width: `${percent}%` }]} />{all.map((item, itemIndex) => <View key={item.id} style={[s.dot, completedIds.includes(item.id) && s.dotOn, { left: `${itemIndex / Math.max(1, all.length - 1) * 100}%` }]} />)}</View><Text style={s.percent}>{percent}%</Text></View>
    <View style={s.article}><View style={s.badge}><Text style={s.badgeTxt}>{index + 1}</Text></View><Text style={s.articleTitle}>{section.title}</Text><View style={s.orn}><View style={s.ornLine} /><View style={s.ornLine} /></View><Text style={s.body}>{section.content}</Text></View>
    <Pressable style={s.done} onPress={completeReading}><Book /><Text style={s.doneTxt}>{next ? 'أنهيت القراءة' : 'إنهاء القراءة'}</Text></Pressable><Text style={s.bottom}>ⓘ ركّز جيدًا واستمتع بالتعلّم</Text>
  </ScrollView><Modal transparent visible={showReward} animationType="fade" onRequestClose={continueAfterReward}><View style={s.rewardOverlay}><Animated.View style={[s.rewardModal, { opacity: rewardOpacity, transform: [{ scale: rewardScale }] }]}><View style={s.rewardGlow}><Text style={s.rewardStar}>★</Text></View><Text style={s.rewardTitle}>أحسنت! تمّت القراءة</Text><Text style={s.rewardAmount}>+ {section.reward_points} نور</Text><Text style={s.rewardMessage}>أضفت نورًا جديدًا إلى رحلتك المعرفية</Text><Pressable style={s.rewardContinue} onPress={continueAfterReward}><Text style={s.rewardContinueText}>{next ? 'متابعة القسم التالي' : 'العودة إلى الأقسام'}</Text></Pressable></Animated.View></View></Modal></SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, scroll: { padding: 16, paddingBottom: 32, backgroundColor: C.bg }, state: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }, stateText: { color: C.text, writingDirection: 'rtl' },
  top: { height: 52, flexDirection: 'row', justifyContent: 'space-between' }, back: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.rose, alignItems: 'center', justifyContent: 'center' }, backTxt: { color: C.text, fontSize: 36, lineHeight: 36, marginTop: -6 }, route: { height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.rose, paddingHorizontal: 15, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }, routeTxt: { color: C.text, fontWeight: '800', writingDirection: 'rtl' }, routeIcon: { color: C.pink, fontSize: 21 },
  icon: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: C.rose, backgroundColor: '#351022', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: C.rose, shadowOpacity: .6, shadowRadius: 14, elevation: 8 }, worship: { color: C.text, fontSize: 29, fontWeight: '900', textAlign: 'center', writingDirection: 'rtl', marginTop: 13 }, sub: { color: C.text, fontSize: 15, textAlign: 'center', writingDirection: 'rtl', marginTop: 4 }, pink: { color: C.pink, fontWeight: '900' },
  progress: { height: 68, borderRadius: 18, borderWidth: 1, borderColor: '#42303b', backgroundColor: C.panel, marginTop: 18, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }, track: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#49404b', position: 'relative' }, fill: { height: 5, backgroundColor: C.pink, borderRadius: 3 }, dot: { position: 'absolute', top: -4, width: 13, height: 13, borderRadius: 7, marginLeft: -6.5, backgroundColor: '#49404b' }, dotOn: { backgroundColor: C.pink }, percent: { color: C.text, fontSize: 17, fontWeight: '900' },
  article: { minHeight: 430, marginTop: 17, borderWidth: 1, borderColor: '#513442', borderRadius: 25, backgroundColor: '#1d111a', padding: 22, overflow: 'hidden' }, bookmark: { position: 'absolute', left: 20, top: 15, color: C.pink, fontSize: 28 }, badge: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: C.pink, backgroundColor: '#351022', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }, badgeTxt: { color: C.text, fontSize: 17, fontWeight: '900' }, articleTitle: { color: C.text, fontSize: 27, fontWeight: '900', textAlign: 'center', writingDirection: 'rtl', marginTop: 14 }, orn: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }, ornLine: { flex: 1, height: 1, backgroundColor: '#624554' }, ornStar: { color: C.gold }, body: { color: '#d5c7c8', fontSize: 16, lineHeight: 31, textAlign: 'right', writingDirection: 'rtl', marginTop: 21 }, city: { color: C.rose, opacity: .45, fontSize: 30, marginTop: 'auto', paddingTop: 28 },
  rewardOverlay: { flex: 1, backgroundColor: 'rgba(8, 4, 9, .82)', alignItems: 'center', justifyContent: 'center', padding: 26 }, rewardModal: { width: '100%', maxWidth: 340, borderRadius: 28, borderWidth: 1.5, borderColor: C.pink, backgroundColor: C.panel, alignItems: 'center', padding: 28, shadowColor: C.rose, shadowOpacity: .95, shadowRadius: 28, shadowOffset: { width: 0, height: 0 }, elevation: 18 }, rewardGlow: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#4a1f1e', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.gold, shadowColor: C.gold, shadowOpacity: .9, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 12 }, rewardStar: { color: C.gold, fontSize: 58, lineHeight: 68 }, rewardTitle: { color: C.text, fontSize: 22, fontWeight: '900', writingDirection: 'rtl', marginTop: 20 }, rewardAmount: { color: C.gold, fontSize: 27, fontWeight: '900', writingDirection: 'rtl', marginTop: 11 }, rewardMessage: { color: C.muted, fontSize: 13, writingDirection: 'rtl', textAlign: 'center', marginTop: 9, lineHeight: 21 }, rewardContinue: { minHeight: 50, alignSelf: 'stretch', backgroundColor: C.rose, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 24, borderWidth: 1, borderColor: C.pink }, rewardContinueText: { color: C.text, fontWeight: '900', fontSize: 15, writingDirection: 'rtl' },
  done: { height: 62, borderRadius: 31, borderWidth: 2, borderColor: C.pink, backgroundColor: '#5a1020', marginTop: 19, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 13, shadowColor: C.rose, shadowOpacity: .8, shadowRadius: 14, elevation: 10 }, doneTxt: { color: C.text, fontSize: 20, fontWeight: '900', writingDirection: 'rtl' }, bottom: { color: '#87757a', textAlign: 'center', marginTop: 18, writingDirection: 'rtl' },
});
