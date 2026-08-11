import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G, Path, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';

const CIRCLE_SIZE = 340;
const CENTER = CIRCLE_SIZE / 2;
const OUTER_RADIUS = 130;
const INNER_RADIUS = OUTER_RADIUS * 0.55; // 55% of outer radius
const LABEL_RADIUS = OUTER_RADIUS * 0.70;
const SEGMENT_COUNT = 8;
const ANGLE_STEP = 360 / SEGMENT_COUNT;

// Task data with icons
const TASKS_DATA = [
  { title: 'الفجر', time: '04:15', icon: '🌙' },
  { title: 'أذكار الصباح', time: '06:00', icon: '☀️' },
  { title: 'قراءة القرآن', time: '08:00', icon: '📖' },
  { title: 'أذكار بعد الصلاة', time: '08:30', icon: '🕌' },
  { title: 'سنة الضحى', time: '09:30', icon: '☀️' },
  { title: 'الظهر', time: '12:30', icon: '🕌' },
  { title: 'أذكار العصر', time: '15:30', icon: '📖' },
  { title: 'المغرب', time: '18:30', icon: '🌙' },
];


export function DynamicCircle({
  tasks = [],
  currentTask,
  onPressCurrent,
  completedLabel = 'عادات مكتملة',
  remainingLabel = 'عادات متبقية',
  pointsLabel = 'نقطة',
  points = 0,
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
  const progress = useMemo(() => 
    tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0, 
    [completedCount, tasks.length]
  );

  // Generate segment positions
  const segments = useMemo(() => {
    return TASKS_DATA.map((task, index) => {
      const angle = (index * ANGLE_STEP) - 90;
      const radians = (angle * Math.PI) / 180;
      
      // Position for labels (70% of outer radius)
      const labelX = CENTER + LABEL_RADIUS * Math.cos(radians);
      const labelY = CENTER + LABEL_RADIUS * Math.sin(radians);
      
      // Position for icons (85% of outer radius)
      const iconX = CENTER + OUTER_RADIUS * 0.85 * Math.cos(radians);
      const iconY = CENTER + OUTER_RADIUS * 0.85 * Math.sin(radians);
      
      return {
        ...task,
        angle,
        labelX,
        labelY,
        iconX,
        iconY,
        isCompleted: tasks[index]?.completed ?? false,
      };
    });
  }, [tasks]);

  const displayTask = currentTask || tasks[0];

  return (
    <View style={styles.wrapper}>
      <View style={styles.circleContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
          <Defs>
            {/* Gold gradient for outer ring */}
            <LinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#d4af37" />
              <Stop offset="50%" stopColor="#c9956f" />
              <Stop offset="100%" stopColor="#a68555" />
            </LinearGradient>

            {/* Center gradient */}
            <LinearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#4a2f5c" />
              <Stop offset="100%" stopColor="#2b1a35" />
            </LinearGradient>
          </Defs>

          {/* Outer circle with golden ring */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_RADIUS + 3}
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            opacity="0.8"
          />

          {/* Main circle background */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_RADIUS}
            fill="#f5ede0"
            stroke="#e8dcc8"
            strokeWidth="1"
          />

          {/* Segment dividers */}
          {segments.map((seg, i) => {
            const angle = seg.angle;
            const radians = (angle * Math.PI) / 180;
            const x1 = CENTER + OUTER_RADIUS * Math.cos(radians);
            const y1 = CENTER + OUTER_RADIUS * Math.sin(radians);
            return (
              <Line
                key={`divider-${i}`}
                x1={CENTER}
                y1={CENTER}
                x2={x1}
                y2={y1}
                stroke="#d4c4b0"
                strokeWidth="0.5"
                opacity="0.4"
              />
            );
          })}

          {/* Icons for each segment */}
          {segments.map((seg, i) => (
            <SvgText
              key={`icon-${i}`}
              x={seg.iconX}
              y={seg.iconY + 5}
              textAnchor="middle"
              fontSize="24"
              fontWeight="bold"
            >
              {seg.icon}
            </SvgText>
          ))}

          {/* Labels for each segment - STRAIGHT (not rotated) */}
          {segments.map((seg, i) => (
            <G key={`label-${i}`}>
              {/* Title */}
              <SvgText
                x={seg.labelX}
                y={seg.labelY - 8}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#3a2a35"
              >
                {seg.title}
              </SvgText>
              {/* Time */}
              <SvgText
                x={seg.labelX}
                y={seg.labelY + 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#8b7355"
              >
                {seg.time}
              </SvgText>
            </G>
          ))}

          {/* Center circle with gradient */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_RADIUS}
            fill="url(#centerGradient)"
            stroke="#d4af37"
            strokeWidth="1.5"
            opacity="0.9"
          />

          {/* Crescent moon - white elegant */}
          <SvgText
            x={CENTER}
            y={CENTER - 12}
            textAnchor="middle"
            fontSize="36"
            fill="#ffffff"
            fontWeight="900"
          >
            ☾
          </SvgText>

          {/* SIRAT text */}
          <SvgText
            x={CENTER}
            y={CENTER + 12}
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            fill="#d4af37"
            letterSpacing="1"
          >
            صِراط
          </SvgText>

          {/* SIRAT subtitle */}
          <SvgText
            x={CENTER}
            y={CENTER + 28}
            textAnchor="middle"
            fontSize="9"
            fill="#b8956f"
            letterSpacing="2"
            fontWeight="600"
          >
            S I R A T
          </SvgText>
        </Svg>

        {/* Pointer at top */}
        <View style={styles.pointer} />

        {/* Center touchable button */}
        <TouchableOpacity
          style={styles.centerTouchable}
          onPress={onPressCurrent}
          activeOpacity={0.7}
        >
          <Text style={styles.centerButtonText}>اضغط لعرض التفاصيل</Text>
        </TouchableOpacity>
      </View>

      {/* Current time card */}
      <View style={styles.currentTimeCard}>
        <Text style={styles.currentTimeLabel}>الوقت الحالي</Text>
        <Text style={styles.currentTimeValue}>
          {displayTask?.scheduled_at.split('T')[1]?.substring(0, 5) || '--:--'}
        </Text>
      </View>

      {/* Today's progress section */}
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
  circleContainer: {
    position: 'relative',
    width: CIRCLE_SIZE + 20,
    height: CIRCLE_SIZE + 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Pointer at top
  pointer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#d4af37',
    zIndex: 10,
  },

  // Center touchable button
  centerTouchable: {
    position: 'absolute',
    width: INNER_RADIUS * 1.8,
    height: INNER_RADIUS * 1.8,
    borderRadius: INNER_RADIUS,
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

  // Current time card
  currentTimeCard: {
    width: '90%',
    backgroundColor: '#2b1a24',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 24,
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

  // Section title
  sectionTitle: {
    color: '#f7e7d0',
    fontSize: 14,
    fontWeight: '800',
    alignSelf: 'flex-end',
    paddingRight: '10%',
    marginTop: 18,
    marginBottom: 10,
  },

  // Stats row
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

  // Progress badge
  progressBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  progressValue: {
    color: '#2b1a24',
    fontSize: 13,
    fontWeight: '900',
  },
});
