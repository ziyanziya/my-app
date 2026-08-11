import React, { useState, useEffect, useMemo } from 'react';
import { useFonts, Amiri_400Regular } from '@expo-google-fonts/amiri';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Line,
  Polygon,
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { PrayerService, PrayerTimesResult } from '../services/prayer.service';
import { DailyWheelItem, generateDailyWheel } from '../services/prayer-wheel.service';

type TimeCardProps = {
  currentTime: Date;
};

type BottomNavProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const createPieSlice = (cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) => {
  const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', startOuter.x, startOuter.y,
    'A', rOuter, rOuter, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', rInner, rInner, 0, largeArcFlag, 1, startInner.x, startInner.y,
    'Z',
  ].join(' ');
};

const defaultWheelItems = [
  { name: 'أذكار المساء', isActive: true },
  { name: 'صلاة المغرب' },
  { name: 'سنة المغرب' },
  { name: 'صلاة العشاء' },
  { name: 'سورة الملك' },
  { name: 'سنة العشاء' },
  { name: 'قيام الليل' },
  { name: 'الشفع والوتر' },
  { name: 'أذكار النوم' },
  { name: 'صلاة الفجر' },
  { name: 'الدعاء' },
  { name: 'الذكر' },
  { name: 'قراءة القرآن' },
  { name: 'سنة الضحى' },
  { name: 'صلاة الضحى' },
  { name: 'أذكار الصباح' },
  { name: 'الذكر' },
  { name: 'صلاة الزوال' },
  { name: 'سنة الظهر' },
  { name: 'الذكر' },
  { name: 'الورد اليومي للقرآن' },
  { name: 'الدعاء' },
  { name: 'صلاة العصر' },
];

// أيقونات مبسطة وأنيقة
const BookIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path d="M4 19.5h16M6 4h12v14H6z" stroke="#b8956a" strokeWidth={1.2} fill="none" strokeLinecap="round" />
  </Svg>
);

const MoonIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#b8956a" strokeWidth={1.2} fill="none" strokeLinecap="round" />
  </Svg>
);

const StarIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Polygon points="12,2 15.09,10.26 24,10.26 17.55,15.74 19.64,24 12,19.52 4.36,24 6.45,15.74 0,10.26 8.91,10.26" 
      stroke="#b8956a" strokeWidth={0.8} fill="none" />
  </Svg>
);

const SunIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="5" fill="none" stroke="#b8956a" strokeWidth={1.2} />
    <Line x1="12" y1="2" x2="12" y2="6" stroke="#b8956a" strokeWidth={1.2} strokeLinecap="round" />
    <Line x1="12" y1="18" x2="12" y2="22" stroke="#b8956a" strokeWidth={1.2} strokeLinecap="round" />
    <Line x1="2" y1="12" x2="6" y2="12" stroke="#b8956a" strokeWidth={1.2} strokeLinecap="round" />
    <Line x1="18" y1="12" x2="22" y2="12" stroke="#b8956a" strokeWidth={1.2} strokeLinecap="round" />
  </Svg>
);

const getIcon = (index: number) => {
  const icons = [
    <BookIcon key="icon-0" />,  // أذكار المساء
    <SunIcon key="icon-1" />,   // صلاة المغرب
    <BookIcon key="icon-2" />,  // سنة بعد المغرب
    <MoonIcon key="icon-3" />,  // صلاة العشاء
    <BookIcon key="icon-4" />,  // سنة بعد العشاء
    <StarIcon key="icon-5" />,  // قيام الليل
    <BookIcon key="icon-6" />,  // الشفع والوتر
    <MoonIcon key="icon-7" />,   // أذكار النوم
    <SunIcon key="icon-8" />,   // صلاة الفجر
    <BookIcon key="icon-9" />,  // أذكار الصباح
    <BookIcon key="icon-10" />,  // قراءة القرآن
    <SunIcon key="icon-11" />,   // سنة الضحى
    <SunIcon key="icon-12" />,   // صلاة الضحى
    <StarIcon key="icon-13" />,  // أذكار الزوال
    <BookIcon key="icon-14" />,  // سنة الظهر القبلية
    <SunIcon key="icon-15" />,   // صلاة الظهر
    <BookIcon key="icon-16" />,  // سنة الظهر البعدية
    <BookIcon key="icon-17" />,  // الورد اليومي للقرآن
    <SunIcon key="icon-18" />,   // صلاة العصر
    <BookIcon key="icon-19" />,  // أذكار العصر
    <BookIcon key="icon-20" />,  // الدعاء
    <BookIcon key="icon-21" />,  // الاستغفار
    <StarIcon key="icon-22" />,  // مراجعة الإنجازات اليومية
  ];
  return icons[index] || <BookIcon />;
};

const CenterMoonIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 36 36">
    <Path d="M25 15.5A10 10 0 1 1 12.5 3 8 8 0 0 0 25 15.5z" 
      fill="none" stroke="#f5e6d3" strokeWidth={1.5} strokeLinecap="round" />
    <Circle cx="22" cy="9" r="1.5" fill="#f5e6d3" />
    <Circle cx="26" cy="6" r="1" fill="#f5e6d3" />
  </Svg>
);

// أيقونات زخرفية للشريط الذهبي
const OrnamentStar = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12">
    <Polygon points="6,1 7.5,4.5 11.5,4.5 8.5,7 9.5,11 6,8 2.5,11 3.5,7 0.5,4.5 4.5,4.5" fill="#d4a574" />
  </Svg>
);

const AnimatedG = Animated.createAnimatedComponent(G);

type SliceSegmentProps = {
  index: number;
  item: { name: string; isActive?: boolean; reverseTextDirection?: boolean };
  itemAngle: number;
  sliceAngle: number;
  cx: number;
  cy: number;
  outerRadius: number;
  innerRadius: number;
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  scaleValue: SharedValue<number>;
};

const SliceSegment = ({
  index,
  item,
  itemAngle,
  sliceAngle,
  cx,
  cy,
  outerRadius,
  innerRadius,
  selectedIndex,
  setSelectedIndex,
  scaleValue,
}: SliceSegmentProps) => {
  const startAngle = itemAngle - sliceAngle / 2;
  const endAngle = itemAngle + sliceAngle / 2;
  const path = createPieSlice(cx, cy, outerRadius, innerRadius, startAngle, endAngle);
  const labelRadius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const labelPos = polarToCartesian(cx, cy, labelRadius, itemAngle);
  const fontSize = Math.max(7, cx * 0.052);
  const baseRotate = itemAngle + 90;
  const rotateAngle = (itemAngle > 90 && itemAngle < 270) ? baseRotate + 180 : baseRotate;

  const animatedProps = useAnimatedProps(() => {
    const progress = scaleValue.value;
    const offset = 10 * (progress - 1);
    const radians = ((itemAngle - 90) * Math.PI) / 180;
    const translateX = offset * Math.cos(radians);
    const translateY = offset * Math.sin(radians);
    return {
      transform: `translate(${translateX}, ${translateY}) scale(${progress})`,
    } as any;
  });

  return (
    <AnimatedG
      key={`segment-group-${index}`}
      animatedProps={animatedProps}
    >
      <Path
        d={path}
        fill={item.isActive ? '#f9f4ec' : '#efe6d9'}
        stroke="rgba(201,169,110,0.16)"
        strokeWidth={0.75}
        pointerEvents="auto"
        onPress={() => setSelectedIndex(index === selectedIndex ? null : index)}
        onClick={() => setSelectedIndex(index === selectedIndex ? null : index)}
      />
      <SvgText
        x={labelPos.x}
        y={labelPos.y}
        fill="#4b0f16"
        fontSize={fontSize}
        fontWeight="600"
        fontFamily="Amiri_400Regular"
        textAnchor="middle"
        alignmentBaseline="middle"
        transform={`rotate(${rotateAngle + (item.reverseTextDirection ? 180 : 0)} ${labelPos.x} ${labelPos.y})`}
      >
        {item.name}
      </SvgText>
    </AnimatedG>
  );
};

const PrayerCircle = ({ currentTime, wheelItems }: { currentTime: Date; wheelItems: { name: string; isActive?: boolean; reverseTextDirection?: boolean }[] }) => {
  const { width } = useWindowDimensions();
  const circleSize = Math.min(width * 0.94, 390);
  const cx = circleSize / 2;
  const cy = circleSize / 2;
  const outerRadius = circleSize * 0.44;
  const ringWidth = circleSize * 0.22;
  const innerRadius = outerRadius - ringWidth;
  const centerRadius = innerRadius * 0.88;
  const sliceAngle = 360 / wheelItems.length;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const scaleValue0 = useSharedValue(1);
  const scaleValue1 = useSharedValue(1);
  const scaleValue2 = useSharedValue(1);
  const scaleValue3 = useSharedValue(1);
  const scaleValue4 = useSharedValue(1);
  const scaleValue5 = useSharedValue(1);
  const scaleValue6 = useSharedValue(1);
  const scaleValue7 = useSharedValue(1);
  const scaleValue8 = useSharedValue(1);
  const scaleValue9 = useSharedValue(1);
  const scaleValue10 = useSharedValue(1);
  const scaleValue11 = useSharedValue(1);
  const scaleValue12 = useSharedValue(1);
  const scaleValue13 = useSharedValue(1);
  const scaleValue14 = useSharedValue(1);
  const scaleValue15 = useSharedValue(1);
  const scaleValue16 = useSharedValue(1);
  const scaleValue17 = useSharedValue(1);
  const scaleValue18 = useSharedValue(1);
  const scaleValue19 = useSharedValue(1);
  const scaleValue20 = useSharedValue(1);
  const scaleValue21 = useSharedValue(1);
  const scaleValue22 = useSharedValue(1);

  const sliceScaleValues = useMemo(
    () => [
      scaleValue0,
      scaleValue1,
      scaleValue2,
      scaleValue3,
      scaleValue4,
      scaleValue5,
      scaleValue6,
      scaleValue7,
      scaleValue8,
      scaleValue9,
      scaleValue10,
      scaleValue11,
      scaleValue12,
      scaleValue13,
      scaleValue14,
      scaleValue15,
      scaleValue16,
      scaleValue17,
      scaleValue18,
      scaleValue19,
      scaleValue20,
      scaleValue21,
      scaleValue22,
    ],
    [
      scaleValue0,
      scaleValue1,
      scaleValue2,
      scaleValue3,
      scaleValue4,
      scaleValue5,
      scaleValue6,
      scaleValue7,
      scaleValue8,
      scaleValue9,
      scaleValue10,
      scaleValue11,
      scaleValue12,
      scaleValue13,
      scaleValue14,
      scaleValue15,
      scaleValue16,
      scaleValue17,
      scaleValue18,
      scaleValue19,
      scaleValue20,
      scaleValue21,
      scaleValue22,
    ],
  );

  useEffect(() => {
    sliceScaleValues.forEach((sharedValue, index) => {
      const target = selectedIndex === index ? 1.08 : 1;
      sharedValue.value = withTiming(target, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    });
  }, [selectedIndex, sliceScaleValues]);

  return (
    <View style={[circleStyles.container, { width: circleSize, height: circleSize }]}> 
      <Svg width={circleSize} height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`} style={{ pointerEvents: 'none' }}>
        <Defs>
          <LinearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#d4a574" />
            <Stop offset="100%" stopColor="#b8945a" />
          </LinearGradient>
          <RadialGradient id="deepBurgundy" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#4c0f1f" />
            <Stop offset="55%" stopColor="#5d1225" />
            <Stop offset="100%" stopColor="#1b0813" />
          </RadialGradient>
          <RadialGradient id="ivoryGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#f7f2ea" />
            <Stop offset="100%" stopColor="#d9cdba" />
          </RadialGradient>
        </Defs>

        {/* Outer ivory halo */}
        <Circle cx={cx} cy={cy} r={outerRadius + 6} fill="rgba(247,242,234,0.18)" />
        <Circle cx={cx} cy={cy} r={outerRadius + 2} fill="url(#ivoryGlow)" />

        {/* Segment ring */}
        {wheelItems.map((item, index) => (
         <SliceSegment
           key={`segment-group-${index}`}
           index={index}
           item={item}
           itemAngle={index * sliceAngle}
           sliceAngle={sliceAngle}
           cx={cx}
           cy={cy}
           outerRadius={outerRadius}
           innerRadius={innerRadius}
           selectedIndex={selectedIndex}
           setSelectedIndex={setSelectedIndex}
           scaleValue={sliceScaleValues[index]}
         />
        ))}

        <Circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth={1.2} />

        

        {/* Center jewel */}
        <Circle cx={cx} cy={cy} r={centerRadius + 4} fill="rgba(27,8,19,0.15)" />
        <Circle cx={cx} cy={cy} r={centerRadius} fill="url(#deepBurgundy)" stroke="rgba(201,169,110,0.3)" strokeWidth={3} />

        {/* Gold pointer accent (longer, sharper) — rotates like a clock hand */}
        {currentTime && (() => {
          const seconds = currentTime.getSeconds();
          const minutes = currentTime.getMinutes();
          const hours = currentTime.getHours() % 12;
          const angle = hours * 30 + minutes * 0.5 + seconds * (0.5 / 60);

          return (
            <G transform={`rotate(${angle} ${cx} ${cy})`}>
              <Polygon
                points={`${cx},${cy - centerRadius - 22} ${cx + 8},${cy - centerRadius + 22} ${cx - 8},${cy - centerRadius + 22}`}
                fill="url(#goldAccent)"
                opacity={0.98}
              />
              <Circle
                cx={cx}
                cy={cy - centerRadius + 14}
                r={2.2}
                fill="#5b1b2a"
                stroke="rgba(212,165,116,0.5)"
                strokeWidth={0.9}
              />
            </G>
          );
        })()}
        </Svg>

      {/* Overlay touch targets for each slice */}
      {wheelItems.map((_, index) => {
        const itemAngle = index * sliceAngle;
        const labelRadius = innerRadius + (outerRadius - innerRadius) * 0.6;
        const labelPos = polarToCartesian(cx, cy, labelRadius, itemAngle);

        return (
          <TouchableOpacity
            key={`touch-${index}`}
            style={{
              position: 'absolute',
              width: 50,
              height: 50,
              borderRadius: 25,
              left: labelPos.x - 25,
              top: labelPos.y - 25,
            }}
            onPress={() => setSelectedIndex(index === selectedIndex ? null : index)}
            activeOpacity={0.6}
          />
        );
      })}

      {/* Center content */}
      <View style={circleStyles.centerContent}>
        <Text style={circleStyles.brandName}>الصراط</Text>
        <Text style={circleStyles.brandEn}>SIRAT</Text>
      </View>
    </View>
  );
};

const TimeCard = ({ currentTime }: TimeCardProps) => {
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes}:${seconds} ${ampm}`;
  };

  return (
    <View style={styles.timeCard}>
      <Text style={styles.timeLabel}>الوقت الحالي</Text>
      <Text style={styles.timeValue}>{formatTime(currentTime)}</Text>
      <Text style={styles.hijriDate}>الخميس 23 ذو القعدة 1446 هـ</Text>
    </View>
  );
};

const PrayerTimesCard = ({ prayerTimes, error }: { prayerTimes: PrayerTimesResult | null; error: string | null }) => {
  const formatPrayer = (date?: Date | null) => {
    if (!date) return 'غير متاح';
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={styles.prayerCard}>
      <Text style={styles.prayerLabel}>أوقات الصلاة</Text>
      {error ? (
        <Text style={styles.prayerError}>{error}</Text>
      ) : (
        <View style={styles.prayerGrid}>
          <View style={styles.prayerRow}>
            <Text style={styles.prayerName}>الفجر</Text>
            <Text style={styles.prayerTimeValue}>{formatPrayer(prayerTimes?.fajr)}</Text>
          </View>
          <View style={styles.prayerRow}>
            <Text style={styles.prayerName}>الظهر</Text>
            <Text style={styles.prayerTimeValue}>{formatPrayer(prayerTimes?.dhuhr)}</Text>
          </View>
          <View style={styles.prayerRow}>
            <Text style={styles.prayerName}>العصر</Text>
            <Text style={styles.prayerTimeValue}>{formatPrayer(prayerTimes?.asr)}</Text>
          </View>
          <View style={styles.prayerRow}>
            <Text style={styles.prayerName}>المغرب</Text>
            <Text style={styles.prayerTimeValue}>{formatPrayer(prayerTimes?.maghrib)}</Text>
          </View>
          <View style={styles.prayerRow}>
            <Text style={styles.prayerName}>العشاء</Text>
            <Text style={styles.prayerTimeValue}>{formatPrayer(prayerTimes?.isha)}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const ProgressCard = () => {
  const progress = 0.7;
  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.progressCard}>
      <Text style={styles.progressLabel}>إنجازاتك اليوم</Text>
      <View style={styles.progressRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>طاعات مكتملة</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>350</Text>
          <Text style={styles.statLabel}>نقطة</Text>
        </View>
        <View style={styles.progressRing}>
          <Svg width={56} height={56}>
            <Circle cx={28} cy={28} r={24} fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth={4} />
            <Circle cx={28} cy={28} r={24} fill="none" stroke="#c9a96e" strokeWidth={4}
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" transform="rotate(-90 28 28)" />
          </Svg>
          <Text style={styles.progressPercent}>70%</Text>
        </View>
      </View>
    </View>
  );
};

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'الرئيسية' },
    { id: 'achievements', icon: '⭐', label: 'الإنجازات' },
    { id: 'favorites', icon: '❤️', label: 'المفضلة' },
    { id: 'calendar', icon: '📅', label: 'التقويم' },
    { id: 'more', icon: '⋯', label: 'المزيد' },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity key={tab.id} style={styles.navItem}
          onPress={() => onTabChange(tab.id)} activeOpacity={0.7}>
          <Text style={[styles.navIcon, activeTab === tab.id && styles.navIconActive]}>
            {tab.icon}
          </Text>
          <Text style={[styles.navLabel, activeTab === tab.id && styles.navLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function PrayerHomeScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('home');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesResult | null>(null);
  const [prayerError, setPrayerError] = useState<string | null>(null);
  const [wheelItems, setWheelItems] = useState<DailyWheelItem[]>([]);
  const [fontsLoaded] = useFonts({ Amiri_400Regular });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout> | null = null;

    const loadPrayerTimes = async () => {
      try {
        const times = await PrayerService.getTodayPrayerTimes();
        setPrayerTimes(times);
        setWheelItems(generateDailyWheel(times));
        setPrayerError(null);
      } catch (error) {
        setPrayerError(error instanceof Error ? error.message : 'Unable to load prayer times');
      }
    };

    const scheduleNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      const timeoutMs = nextMidnight.getTime() - now.getTime();
      midnightTimer = setTimeout(async () => {
        await loadPrayerTimes();
        scheduleNextMidnight();
      }, timeoutMs);
    };

    loadPrayerTimes();
    scheduleNextMidnight();

    return () => {
      if (midnightTimer) {
        clearTimeout(midnightTimer);
      }
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a0e14" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.greeting}>السلام عليكم</Text>
          <Text style={styles.userName}>أحمد المسلم</Text>
        </View>
        <View style={styles.avatarHeader}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2a0a1a" strokeWidth={2} strokeLinecap="round">
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
          </Svg>
        </View>
      </View>

      <View style={styles.scrollContent}>
        <PrayerCircle
          currentTime={currentTime}
          wheelItems={
            wheelItems.length > 0
              ? wheelItems.map((item) => ({
                  name: item.label,
                  reverseTextDirection: item.reverseTextDirection,
                }))
              : defaultWheelItems
          }
        />
        <TimeCard currentTime={currentTime} />
        <PrayerTimesCard prayerTimes={prayerTimes} error={prayerError} />
        <ProgressCard />
      </View>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0e14',
  },
  scrollContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  menuBtn: { padding: 8 },
  menuIcon: { fontSize: 22, color: '#f5e6d3' },
  headerCenter: { alignItems: 'center', flex: 1, marginRight: 12 },
  greeting: { fontSize: 11, color: '#c9a96e', opacity: 0.75, letterSpacing: 0.5 },
  userName: { fontSize: 16, fontWeight: '500', color: '#f5e6d3', marginTop: 1 },
  avatarHeader: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#c9a96e',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(201,169,110,0.4)',
  },
  timeCard: {
    backgroundColor: 'rgba(60,30,40,0.7)',
    borderRadius: 22, padding: 16, width: '100%',
    alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(201,169,110,0.12)',
  },
  timeLabel: { fontSize: 11, color: 'rgba(245,230,211,0.55)', marginBottom: 5 },
  timeValue: {
    fontSize: 28, fontWeight: '600', color: '#f5e6d3',
    fontVariant: ['tabular-nums'], letterSpacing: 0.5,
  },
  hijriDate: { fontSize: 11, color: '#c9a96e', marginTop: 6, opacity: 0.85 },
  prayerCard: {
    backgroundColor: 'rgba(60,30,40,0.7)',
    borderRadius: 22,
    padding: 16,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.12)',
  },
  prayerLabel: {
    fontSize: 12,
    color: 'rgba(245,230,211,0.7)',
    marginBottom: 12,
    fontWeight: '600',
  },
  prayerGrid: {
    marginTop: 4,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,230,211,0.08)',
  },
  prayerName: {
    fontSize: 12,
    color: '#f5e6d3',
  },
  prayerTimeValue: {
    fontSize: 12,
    color: '#c9a96e',
    fontWeight: '600',
  },
  prayerError: {
    fontSize: 12,
    color: '#f5b0a0',
  },
  progressCard: {
    backgroundColor: 'rgba(60,30,40,0.65)',
    borderRadius: 22, padding: 16, width: '100%',
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(201,169,110,0.1)',
  },
  progressLabel: { fontSize: 12, color: 'rgba(245,230,211,0.58)', marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '600', color: '#f5e6d3' },
  statLabel: { fontSize: 10, color: 'rgba(245,230,211,0.4)', marginTop: 4 },
  progressRing: {
    position: 'relative', width: 52, height: 52,
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  progressPercent: {
    position: 'absolute', fontSize: 12,
    fontWeight: '600', color: '#f5e6d3',
  },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(201,169,110,0.08)',
    backgroundColor: '#1a0e14',
  },
  navItem: { alignItems: 'center', paddingHorizontal: 10 },
  navIcon: { fontSize: 18, color: 'rgba(245,230,211,0.5)', marginBottom: 2 },
  navIconActive: { color: '#c9a96e' },
  navLabel: { fontSize: 8, color: 'rgba(245,230,211,0.5)' },
  navLabelActive: { color: '#c9a96e', fontWeight: '500' },
});

const circleStyles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginVertical: 20,
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  iconWrapper: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStackTop: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  textStackBottom: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  prayerName: {
    fontSize: 8,
    color: '#8a6a5a',
    lineHeight: 10,
    textAlign: 'center',
    fontWeight: '400',
  },
  prayerNameActive: {
    color: '#5a3a2a',
    fontWeight: '600',
  },
  prayerTime: {
    fontSize: 7,
    color: '#a08070',
    lineHeight: 9,
    textAlign: 'center',
  },
  textCenter: { textAlign: 'center' as const },
  textLeft: { textAlign: 'left' as const },
  textRight: { textAlign: 'right' as const },
  centerContent: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f5e6d3',
    letterSpacing: 3,
    lineHeight: 36,
    marginTop: 8,
    fontFamily: 'Amiri_400Regular',
  },
  brandEn: {
    fontSize: 10,
    color: 'rgba(245,230,211,0.45)',
    letterSpacing: 4,
    marginTop: 3,
    fontWeight: '600',
  },
  detailsButton: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,230,211,0.25)',
    backgroundColor: 'rgba(245,230,211,0.05)',
  },
  detailsText: {
    fontSize: 8,
    color: 'rgba(245,230,211,0.65)',
    lineHeight: 11,
    fontWeight: '400',
  },
});