import { useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Line, Stop, Text as SvgText } from 'react-native-svg';

// ─── Layout constants ──────────────────────────────────────────────
const CIRCLE_SIZE   = 320;          // SVG canvas size
const VIEWBOX_PAD   = 30;           // extra padding so glow isn't clipped
const VB            = CIRCLE_SIZE + VIEWBOX_PAD * 2;   // viewBox size = 380
const C             = VB / 2;       // center = 190
const OUTER_R       = 130;          // wheel radius
const INNER_R       = OUTER_R * 0.55;
const LABEL_R       = OUTER_R * 0.70;
const SEG           = 8;
const STEP          = 360 / SEG;

// ─── Static segment data ───────────────────────────────────────────
const TASKS_DATA = [
  { title: 'الفجر',           time: '04:15', icon: '🌙' },
  { title: 'أذكار الصباح',   time: '06:00', icon: '☀️' },
  { title: 'قراءة القرآن',   time: '08:00', icon: '📖' },
  { title: 'أذكار بعد الصلاة', time: '08:30', icon: '🕌' },
  { title: 'سنة الضحى',      time: '09:30', icon: '☀️' },
  { title: 'الظهر',           time: '12:30', icon: '🕌' },
  { title: 'أذكار العصر',    time: '15:30', icon: '📖' },
  { title: 'المغرب',          time: '18:30', icon: '🌙' },
];

// ─── Golden glow rings — drawn OUTSIDE the main wheel ─────────────
// Each ring: { extraR, strokeW, opacity }
// They radiate outward from the rim edge
const GLOW_RINGS = [
  { dr: 1,  sw: 4,  op: 0.70 },   // closest — brightest
  { dr: 5,  sw: 6,  op: 0.45 },
  { dr: 10, sw: 8,  op: 0.25 },
  { dr: 16, sw: 10, op: 0.13 },
  { dr: 23, sw: 12, op: 0.06 },   // farthest — most diffuse
];

// ─────────────────────────────────────────────────────────────────
export function DynamicCircle({
  tasks = [],
  currentTask,
  onPressCurrent,
  completedLabel = 'عادات مكتملة',
  remainingLabel  = 'عادات متبقية',
  pointsLabel     = 'نقطة',
  points          = 0,
}: {
  tasks?: { title: string; scheduled_at: string; completed?: boolean; icon?: string }[];
  currentTask?: { title: string; scheduled_at: string };
  onPressCurrent?: () => void;
  completedLabel?: string;
  remainingLabel?: string;
  pointsLabel?: string;
  points?: number;
}) {
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  const remainingCount = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);
  const progress       = useMemo(
    () => (tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0),
    [completedCount, tasks.length],
  );

  const segments = useMemo(() =>
    TASKS_DATA.map((task, i) => {
      const angle   = i * STEP - 90;
      const rad     = (angle * Math.PI) / 180;
      return {
        ...task,
        angle,
        labelX: C + LABEL_R    * Math.cos(rad),
        labelY: C + LABEL_R    * Math.sin(rad),
        iconX:  C + OUTER_R * 0.85 * Math.cos(rad),
        iconY:  C + OUTER_R * 0.85 * Math.sin(rad),
        divX:   C + OUTER_R    * Math.cos(rad),
        divY:   C + OUTER_R    * Math.sin(rad),
        isCompleted: tasks[i]?.completed ?? false,
      };
    }),
  [tasks]);

  const displayTask = currentTask || tasks[0];

  return (
    <View style={styles.wrapper}>

      {/* ── Wheel container with native shadow ── */}
      <View style={styles.circleContainer}>
        <Svg
          width={VB}
          height={VB}
          viewBox={`0 0 ${VB} ${VB}`}
        >
          <Defs>
            {/* Rim gold gradient */}
            <LinearGradient id="rimGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%"   stopColor="#f7dc6f" />
              <Stop offset="40%"  stopColor="#d4a843" />
              <Stop offset="100%" stopColor="#b8892f" />
            </LinearGradient>

            {/* Center dark gradient */}
            <LinearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%"   stopColor="#4a2f5c" />
              <Stop offset="100%" stopColor="#2b1a35" />
            </LinearGradient>
          </Defs>

          {/* ═══════════════════════════════════════════════
              GOLDEN GLOW — rings expanding outward from rim
              All rendered BEFORE the main wheel fill so
              the wheel sits on top and clips naturally.
          ═══════════════════════════════════════════════ */}
          {GLOW_RINGS.map(({ dr, sw, op }, i) => (
            <Circle
              key={`glow-${i}`}
              cx={C}
              cy={C}
              r={OUTER_R + dr}
              fill="none"
              stroke="#d4aa22"
              strokeWidth={sw}
              opacity={op}
            />
          ))}

          {/* ── Rim — thin crisp golden border ── */}
          <Circle
            cx={C} cy={C} r={OUTER_R}
            fill="none"
            stroke="url(#rimGold)"
            strokeWidth={0.8}
            opacity={1}
          />

          {/* ── Main wheel fill ── */}
          <Circle
            cx={C} cy={C} r={OUTER_R - 0.4}
            fill="#f5ede0"
            stroke="none"
          />

          {/* ── Segment dividers ── */}
          {segments.map((seg, i) => (
            <Line
              key={`div-${i}`}
              x1={C}     y1={C}
              x2={seg.divX} y2={seg.divY}
              stroke="#d4c4b0"
              strokeWidth={0.5}
              opacity={0.4}
            />
          ))}

          {/* ── Emoji icons ── */}
          {segments.map((seg, i) => (
            <SvgText
              key={`ico-${i}`}
              x={seg.iconX} y={seg.iconY + 5}
              textAnchor="middle"
              fontSize={22}
              fontWeight="bold"
            >
              {seg.icon}
            </SvgText>
          ))}

          {/* ── Segment labels ── */}
          {segments.map((seg, i) => (
            <G key={`lbl-${i}`}>
              <SvgText
                x={seg.labelX} y={seg.labelY - 8}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight="700"
                fill="#3a2a35"
              >
                {seg.title}
              </SvgText>
              <SvgText
                x={seg.labelX} y={seg.labelY + 7}
                textAnchor="middle"
                fontSize={9.5}
                fontWeight="600"
                fill="#8b7355"
              >
                {seg.time}
              </SvgText>
            </G>
          ))}

          {/* ── Center disc ── */}
          <Circle
            cx={C} cy={C} r={INNER_R}
            fill="url(#centerGrad)"
            stroke="#d4af37"
            strokeWidth={1.2}
            opacity={0.95}
          />

          {/* ── Crescent & text ── */}
          <SvgText x={C} y={C - 12} textAnchor="middle" fontSize={34} fill="#ffffff" fontWeight="900">
            ☾
          </SvgText>
          <SvgText x={C} y={C + 12} textAnchor="middle" fontSize={15} fontWeight="800" fill="#d4af37" letterSpacing="1">
            صِراط
          </SvgText>
          <SvgText x={C} y={C + 27} textAnchor="middle" fontSize={8.5} fill="#b8956f" letterSpacing="2" fontWeight="600">
            S I R A T
          </SvgText>
        </Svg>

        {/* Pointer */}
        <View style={styles.pointer} />

        {/* Center tap */}
        <TouchableOpacity
          style={[styles.centerTouchable, { width: INNER_R * 1.8, height: INNER_R * 1.8, borderRadius: INNER_R }]}
          onPress={onPressCurrent}
          activeOpacity={0.7}
        >
          <Text style={styles.centerButtonText}>اضغط لعرض التفاصيل</Text>
        </TouchableOpacity>
      </View>

      {/* ── Time card ── */}
      <View style={styles.currentTimeCard}>
        <Text style={styles.currentTimeLabel}>الوقت الحالي</Text>
        <Text style={styles.currentTimeValue}>
          {displayTask?.scheduled_at.split('T')[1]?.substring(0, 5) || '--:--'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>إنجازك اليوم</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>{completedLabel}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{remainingCount}</Text>
          <Text style={styles.statLabel}>{remainingLabel}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{points}</Text>
          <Text style={styles.statLabel}>{pointsLabel}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 20,
  },

  // Native golden drop-shadow sits on this View
  circleContainer: {
    position: 'relative',
    width: VB + 10,
    height: VB + 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#c8960a',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 22,
      },
      android: {
        elevation: 16,
      },
      web: {
        // CSS box-shadow for web
      } as object,
    }),
  },

  pointer: {
    position: 'absolute',
    top: 4,
    left: '50%',
    marginLeft: -9,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#d4af37',
    zIndex: 10,
  },

  centerTouchable: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonText: {
    color: '#f5ede0',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 12,
  },

  currentTimeCard: {
    width: '90%',
    backgroundColor: '#2b1a24',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  currentTimeLabel: {
    color: '#9d8375',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentTimeValue: {
    color: '#f7e7d0',
    fontSize: 20,
    fontWeight: '800',
  },

  sectionTitle: {
    color: '#f7e7d0',
    fontSize: 14,
    fontWeight: '800',
    alignSelf: 'flex-end',
    paddingRight: '10%',
    marginTop: 18,
    marginBottom: 10,
  },

  statsRow: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2b1a24',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    color: '#f7e7d0',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#9d8375',
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },

  progressBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30,
    shadowRadius: 6,
    elevation: 5,
  },
  progressValue: {
    color: '#2b1a24',
    fontSize: 13,
    fontWeight: '900',
  },
});
