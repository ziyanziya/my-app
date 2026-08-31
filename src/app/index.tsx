import React, { useCallback, useEffect, useState } from 'react';
import { useFonts, Amiri_400Regular } from '@expo-google-fonts/amiri';
import {
  View,
  Image,
  Text,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  ScrollView,
  Animated,
  ImageBackground,
  TouchableOpacity,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
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
  SvgUri,
} from 'react-native-svg';
import type { PrayerTimesResult } from '../services/prayer.service';
import type { DailyWheelItem } from '../services/prayer-wheel.service';
import { getAuthApiBaseUrl } from '../services/auth-api';
import { clearAuthSession, fetchWithAuth } from '../services/auth-session';

const homeBackground = require('../../assets/images/auth/islamic-auth-background.png');
const homeLogo = require('../../assets/images/auth/elsirat-logo-final-transparent.png');
type TimeCardProps = {
  currentTime: Date;
};

type BottomNavProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const sideMenuItems = [
  { id: 'profile', label: 'ملف المستخدم / الحساب', icon: '◉' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙' },
  { id: 'notifications', label: 'الإشعارات', icon: '♢' },
  { id: 'favorites', label: 'المفضلات', icon: '♡' },
  { id: 'help', label: 'المساعدة', icon: '?' },
];

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
  const innerInset = Math.min((endAngle - startAngle) * 0.16, 2.5);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle - innerInset);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle + innerInset);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', startOuter.x, startOuter.y,
    'A', rOuter, rOuter, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', rInner, rInner, 0, largeArcFlag, 1, startInner.x, startInner.y,
    'Z',
  ].join(' ');
};

const clampSliceSelection = (value: number | null): number | null => {
return value === undefined || value === null ? null : value;
};

const formatWheelTime = (date?: Date) => {
  if (!date) return undefined;
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const formatRemainingTime = (endTime: Date, currentTime: Date) => {
  let remainingMs = endTime.getTime() - currentTime.getTime();
  if (remainingMs < 0) remainingMs += 24 * 60 * 60 * 1000;

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatWorshipButtonLabel = (item: { id?: string; name: string }) => {
  return `أدِّ ${item.name}`;
};

const PULSE_DURATION_MS = 10 * 60 * 1000;

const AnimatedG = Animated.createAnimatedComponent(G);

const BlinkingRemainingTime = ({ time }: { time: string }) => {
  const [isDimmed, setIsDimmed] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => setIsDimmed((value) => !value), 500);
    return () => clearInterval(interval);
  }, []);

  return <Text style={[circleStyles.remainingTime, isDimmed && circleStyles.remainingTimeDimmed]}>متبقي {time}</Text>;
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
  { name: 'صلاة التهجد' },
  { name: 'الدعاء' },
  { name: 'صلاة الفجر' },
  { name: 'قراءة القرآن' },
  { name: 'سنة العمرة' },
  { name: 'أذكار الصباح' },
  { name: 'صلاة الضحى' },
  { name: 'الذكر' },
  { name: 'صلاة الزوال' },
  { name: 'صلاة الظهر' },
  { name: 'سنة صلاة الظهر' },
  { name: 'الذكر' },
  { name: 'الورد اليومي' },
  { name: 'الدعاء' },
  { name: 'صلاة العصر' },
];

// Ø£ÙŠÙ‚ÙˆÙ†Ø§Øª Ù…Ø¨Ø³Ø·Ø© ÙˆØ£Ù†ÙŠÙ‚Ø©
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
    <BookIcon key="icon-0" />,  // Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…Ø³Ø§Ø¡
    <SunIcon key="icon-1" />,   // ØµÙ„Ø§Ø© Ø§Ù„Ù…ØºØ±Ø¨
    <BookIcon key="icon-2" />,  // Ø³Ù†Ø© Ø¨Ø¹Ø¯ Ø§Ù„Ù…ØºØ±Ø¨
    <MoonIcon key="icon-3" />,  // ØµÙ„Ø§Ø© Ø§Ù„Ø¹Ø´Ø§Ø¡
    <BookIcon key="icon-4" />,  // Ø³Ù†Ø© Ø¨Ø¹Ø¯ Ø§Ù„Ø¹Ø´Ø§Ø¡
    <StarIcon key="icon-5" />,  // Ù‚ÙŠØ§Ù… Ø§Ù„Ù„ÙŠÙ„
    <BookIcon key="icon-6" />,  // Ø§Ù„Ø´ÙØ¹ ÙˆØ§Ù„ÙˆØªØ±
    <MoonIcon key="icon-7" />,   // Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù†ÙˆÙ…
    <SunIcon key="icon-8" />,   // ØµÙ„Ø§Ø© Ø§Ù„ÙØ¬Ø±
    <BookIcon key="icon-9" />,  // Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­
    <BookIcon key="icon-10" />,  // Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù‚Ø±Ø¢Ù†
    <SunIcon key="icon-11" />,   // Ø³Ù†Ø© Ø§Ù„Ø¶Ø­Ù‰
    <SunIcon key="icon-12" />,   // ØµÙ„Ø§Ø© Ø§Ù„Ø¶Ø­Ù‰
    <StarIcon key="icon-13" />,  // Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ø²ÙˆØ§Ù„
    <BookIcon key="icon-14" />,  // Ø³Ù†Ø© Ø§Ù„Ø¸Ù‡Ø± Ø§Ù„Ù‚Ø¨Ù„ÙŠØ©
    <SunIcon key="icon-15" />,   // ØµÙ„Ø§Ø© Ø§Ù„Ø¸Ù‡Ø±
    <BookIcon key="icon-16" />,  // Ø³Ù†Ø© Ø§Ù„Ø¸Ù‡Ø± Ø§Ù„Ø¨Ø¹Ø¯ÙŠØ©
    <BookIcon key="icon-17" />,  // Ø§Ù„ÙˆØ±Ø¯ Ø§Ù„ÙŠÙˆÙ…ÙŠ Ù„Ù„Ù‚Ø±Ø¢Ù†
    <SunIcon key="icon-18" />,   // ØµÙ„Ø§Ø© Ø§Ù„Ø¹ØµØ±
    <BookIcon key="icon-19" />,  // Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ø¹ØµØ±
    <BookIcon key="icon-20" />,  // Ø§Ù„Ø¯Ø¹Ø§Ø¡
    <BookIcon key="icon-21" />,  // Ø§Ù„Ø§Ø³ØªØºÙØ§Ø±
    <StarIcon key="icon-22" />,  // Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²Ø§Øª Ø§Ù„ÙŠÙˆÙ…ÙŠØ©
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

// Ø£ÙŠÙ‚ÙˆÙ†Ø§Øª Ø²Ø®Ø±ÙÙŠØ© Ù„Ù„Ø´Ø±ÙŠØ· Ø§Ù„Ø°Ù‡Ø¨ÙŠ
const OrnamentStar = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12">
    <Polygon points="6,1 7.5,4.5 11.5,4.5 8.5,7 9.5,11 6,8 2.5,11 3.5,7 0.5,4.5 4.5,4.5" fill="#d4a574" />
  </Svg>
);

type SliceSegmentProps = {
  index: number;
  item: { name: string; time?: string; startTime?: Date; endTime?: Date; isActive?: boolean; reverseTextDirection?: boolean };
  itemAngle: number;
  sliceAngle: number;
  cx: number;
  cy: number;
  outerRadius: number;
  innerRadius: number;
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  isCurrent?: boolean;
  pulseOpacity?: number;
  selectedScale?: number;
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
  isCurrent = false,
  pulseOpacity = 0,
  selectedScale = 1,
}: SliceSegmentProps) => {
  const startAngle = itemAngle - sliceAngle / 2;
  const endAngle = itemAngle + sliceAngle / 2;
  const isSelected = selectedIndex === index;
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const sliceAnchor = polarToCartesian(
    cx,
    cy,
    innerRadius,
    itemAngle,
  );

  React.useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: isSelected ? selectedScale : 1,
      friction: 7,
      tension: 68,
      useNativeDriver: true,
    }).start();
  }, [isSelected, scaleValue, selectedScale]);

  const path = createPieSlice(cx, cy, outerRadius, innerRadius, startAngle, endAngle);

  return (
    <AnimatedG
      key={`segment-group-${index}`}
      transform={[
        { translateX: sliceAnchor.x },
        { translateY: sliceAnchor.y },
        { scale: scaleValue },
        { translateX: -sliceAnchor.x },
        { translateY: -sliceAnchor.y },
      ]}
    >
      <Path
        d={path}
        fill={isSelected ? 'url(#deepBurgundy)' : item.isActive ? '#f9f4ec' : '#efe6d9'}
        stroke={isSelected ? 'rgba(212,165,116,0.82)' : 'rgba(201,169,110,0.16)'}
        strokeWidth={isSelected ? 1.8 : 0.75}
        opacity={isSelected ? 1 : 0.95}
      />
      {isCurrent && (
        <>
          <Path
            d={path}
            fill="none"
            stroke="#ffb52e"
            strokeWidth={7}
            opacity={pulseOpacity * 0.35}
          />
          <Path
            d={path}
            fill="none"
            stroke="#fff1ad"
            strokeWidth={3.2}
            opacity={Math.min(1, pulseOpacity + 0.12)}
          />
        </>
      )}
    </AnimatedG>
  );
};

const PrayerCircle = ({
  currentTime,
  wheelItems,
  onDetailsPress,
  pulseDurationMs = 10 * 60 * 1000,
}: {
  currentTime: Date;
  wheelItems: { id?: string; name: string; time?: string; startTime?: Date; endTime?: Date; isActive?: boolean; reverseTextDirection?: boolean; worshipId?: number | string }[];
  onDetailsPress: (item: { id?: string; name: string; time?: string; startTime?: Date; endTime?: Date; worshipId?: number | string }) => void;
  pulseDurationMs?: number;
}) => {
  const { width } = useWindowDimensions();
  const circleSize = Math.min(width * 0.94, 390);
  const cx = circleSize / 2;
  const cy = circleSize / 2;
  const outerRadius = circleSize * 0.44;
  const ringWidth = circleSize * 0.22;
  const innerRadius = outerRadius - ringWidth;
  // Align the start of each slice with the edge of the center circle.
  const centerRadius = innerRadius - 1;
  const selectedOuterRadius = outerRadius;
  const sliceAngle = 360 / wheelItems.length;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [suppressedPulseIds, setSuppressedPulseIds] = useState<Set<string>>(new Set());
  const currentTimestamp = currentTime.getTime();

  const isEventActive = (item: { startTime?: Date; endTime?: Date }, timestamp: number) => {
    if (!item.startTime || !item.endTime) return false;
    const start = item.startTime.getTime();
    const end = item.endTime.getTime();

    if (end > start) {
      return timestamp >= start && timestamp < end;
    }

    return timestamp >= start || timestamp < end;
  };

  const currentItemIndexes = wheelItems.reduce<number[]>((indexes, item, index) => {
    if (isEventActive(item, currentTimestamp)) {
      indexes.push(index);
    }
    return indexes;
  }, []);
  const highlightedItemIndexes = [...currentItemIndexes].sort((a, b) => {
    const aStart = wheelItems[a].startTime?.getTime() ?? 0;
    const bStart = wheelItems[b].startTime?.getTime() ?? 0;
    return bStart - aStart;
  });
  const hasCurrentItem = highlightedItemIndexes.length > 0;
  const highlightedItem = hasCurrentItem ? wheelItems[highlightedItemIndexes[0]] : undefined;
  const pulsingItemIndexes = currentItemIndexes.filter((index) => {
    const item = wheelItems[index];
    return item.startTime !== undefined
      && currentTimestamp - item.startTime.getTime() < pulseDurationMs
      && !suppressedPulseIds.has(item.id ?? `index-${index}`);
  });
  const hasPulsingItem = pulsingItemIndexes.length > 0;
  const centerItem = highlightedItem;

  const dismissActivePulses = () => {
    const activePulseIds = pulsingItemIndexes
      .map((index) => wheelItems[index].id ?? `index-${index}`)
      .filter((id): id is string => !!id);

    if (activePulseIds.length > 0) {
      setSuppressedPulseIds((currentIds) => {
        const nextIds = new Set(currentIds);
        activePulseIds.forEach((id) => nextIds.add(id));
        return nextIds;
      });
    }
  };

  const handleCenterItemPress = () => {
    dismissActivePulses();
    if (centerItem) {
      setSelectedIndex(null);
      setSuppressedPulseIds((currentIds) => new Set(currentIds));
      onDetailsPress(centerItem);
    }
  };

  const glowingSliceIndexes = pulsingItemIndexes;
  // Use the clock itself as the animation source, so it stays synchronized
  // with the 250 ms current-time refresh without another animation loop.
  const pulseOpacity = 0.28 + ((Math.sin((currentTimestamp / 650) * Math.PI * 2) + 1) / 2) * 0.72;

  const handleSliceSelection = (x: number, y: number) => {
    const deltaX = x - cx;
    const deltaY = y - cy;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < innerRadius) {
      if (centerItem) {
        handleCenterItemPress();
      } else {
        dismissActivePulses();
      }
      return;
    }

    if (distance > outerRadius + 6) {
      return;
    }

    const angleDegrees = ((Math.atan2(deltaY, deltaX) * 180) / Math.PI + 90 + 360) % 360;
    const nextIndex = Math.floor(angleDegrees / sliceAngle);

    setSelectedIndex((currentIndex) => {
      if (currentIndex === nextIndex) {
        return null;
      }
      return clampSliceSelection(nextIndex);
    });
  };

  return (
    <View
      style={[circleStyles.container, { width: circleSize, height: circleSize }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        handleSliceSelection(event.nativeEvent.locationX, event.nativeEvent.locationY);
      }}
    >
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
        {/* Gold outer frame */}
        <Circle cx={cx} cy={cy} r={outerRadius + 10} fill="none" stroke="rgba(255, 214, 112, 0.20)" strokeWidth={8} />
        <Circle cx={cx} cy={cy} r={outerRadius + 7} fill="none" stroke="url(#goldAccent)" strokeWidth={3.2} />
        <Circle cx={cx} cy={cy} r={outerRadius + 2.8} fill="none" stroke="rgba(255, 244, 190, 0.78)" strokeWidth={1} />
        <Circle cx={cx} cy={cy} r={outerRadius + 2} fill="url(#ivoryGlow)" />

        {/* Segment ring */}
        {wheelItems.map((item, index) => (
          index !== selectedIndex && (
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
              isCurrent={glowingSliceIndexes.includes(index)}
              pulseOpacity={pulseOpacity}
            />
          )
        ))}

        <Circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth={1.2} />

        

        {/* Center jewel */}
        <Circle cx={cx} cy={cy} r={centerRadius + 4} fill="rgba(27,8,19,0.15)" />
        <Circle cx={cx} cy={cy} r={centerRadius} fill="url(#deepBurgundy)" stroke="rgba(201,169,110,0.3)" strokeWidth={3} />
        {hasPulsingItem && (
          <>
            <Circle
              cx={cx}
              cy={cy}
              r={centerRadius - 5}
              fill="#a6294b"
              opacity={0.12 + pulseOpacity * 0.38}
            />
            <Circle
              cx={cx}
              cy={cy}
              r={centerRadius + 3}
              fill="none"
              stroke="#ffb52e"
              strokeWidth={9}
              opacity={pulseOpacity * 0.32}
            />
            <Circle
              cx={cx}
              cy={cy}
              r={centerRadius + 1}
              fill="none"
              stroke="#fff1ad"
              strokeWidth={4.2}
              opacity={Math.min(1, pulseOpacity + 0.12)}
            />
          </>
        )}

        {/* Gold pointer accent (longer, sharper) â€” rotates like a clock hand */}
        {currentTime && (() => {
          const millisecondsInDay = 24 * 60 * 60 * 1000;
          const firstEventTime = wheelItems[0]?.startTime;
          let angle: number;

          if (firstEventTime) {
            const cycleStart = firstEventTime.getTime();
            let now = currentTime.getTime();
            if (now < cycleStart) now += millisecondsInDay;

            const timelinePoints = wheelItems
              .map((item, index) => {
                if (!item.startTime) return null;
                let time = item.startTime.getTime();
                if (time < cycleStart) time += millisecondsInDay;
                return { time, angle: index * sliceAngle };
              })
              .filter((point): point is { time: number; angle: number } => point !== null);

            // Slice positions are evenly spaced, but event times are not.
            // Move continuously between the surrounding events so gaps such
            // as the period before Asr still show the real current time.
            const nextIndex = timelinePoints.findIndex((point) => point.time > now);
            const previousIndex = nextIndex === -1 ? timelinePoints.length - 1 : Math.max(0, nextIndex - 1);
            const previousPoint = timelinePoints[previousIndex];
            const nextPoint = nextIndex === -1
              ? timelinePoints[0] && { time: timelinePoints[0].time + millisecondsInDay, angle: 360 }
              : timelinePoints[nextIndex];

            if (previousPoint && nextPoint && nextPoint.time > previousPoint.time) {
              const progress = Math.max(0, Math.min(1, (now - previousPoint.time) / (nextPoint.time - previousPoint.time)));
              angle = previousPoint.angle + (nextPoint.angle - previousPoint.angle) * progress;
            } else {
              angle = previousPoint?.angle ?? 0;
            }
          } else {
            const millisecondsSinceMidnight =
              currentTime.getHours() * 60 * 60 * 1000 +
              currentTime.getMinutes() * 60 * 1000 +
              currentTime.getSeconds() * 1000 +
              currentTime.getMilliseconds();
            angle = (millisecondsSinceMidnight / millisecondsInDay) * 360;
          }

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

        {/* Keep the expanded selection above the center circle and clock hand. */}
        {selectedIndex !== null && (
          <SliceSegment
            key={`selected-segment-${selectedIndex}`}
            index={selectedIndex}
            item={wheelItems[selectedIndex]}
            itemAngle={selectedIndex * sliceAngle}
            sliceAngle={sliceAngle * 3}
            cx={cx}
            cy={cy}
            outerRadius={selectedOuterRadius}
            innerRadius={innerRadius}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            isCurrent={glowingSliceIndexes.includes(selectedIndex)}
            pulseOpacity={pulseOpacity}
            selectedScale={1}
          />
        )}
        </Svg>
      {/* Overlay readable Arabic labels and touch targets for each slice */}
      {wheelItems.map((item, index) => {
       const itemAngle = index * sliceAngle;
       const isSelected = selectedIndex === index;
        // Keep lower-half labels readable
        const shouldReverseTextDirection = Boolean(item.reverseTextDirection || index === 6);
       const indexDistance = selectedIndex === null
         ? 0
         : Math.min(Math.abs(index - selectedIndex), wheelItems.length - Math.abs(index - selectedIndex));
       const isCoveredBySelection = selectedIndex !== null && !isSelected && indexDistance <= 1;

       if (isCoveredBySelection) return null;

       const labelRadius = isSelected
         ? innerRadius + (selectedOuterRadius - innerRadius) * 0.55
         : innerRadius + (outerRadius - innerRadius) * 0.58;
       const labelPos = polarToCartesian(cx, cy, labelRadius, itemAngle);
       const baseRotate = itemAngle + 90;
       const rotateAngle = itemAngle > 90 && itemAngle < 270 ? baseRotate + 180 : baseRotate;
       const labelRotateAngle = !isSelected && shouldReverseTextDirection ? rotateAngle + 180 : rotateAngle;
       const remainingTime = isSelected && item.endTime
         ? formatRemainingTime(item.endTime, currentTime)
         : undefined;

       return (
         <View
           key={`label-${index}`}
           pointerEvents={isSelected ? 'box-none' : 'none'}
           style={{
             position: 'absolute',
             width: isSelected ? 132 : 66,
             minHeight: isSelected ? 76 : 36,
             left: labelPos.x - (isSelected ? 66 : 33),
             top: labelPos.y - (isSelected ? 38 : 18),
             alignItems: 'center',
             justifyContent: 'center',
             transform: [{ rotate: `${labelRotateAngle}deg` }],
           }}
         >
           <View
             style={
               isSelected
                 ? { transform: [{ rotate: `${-rotateAngle}deg` }] }
                 : undefined
             }
           >
             <Text
               numberOfLines={2}
               adjustsFontSizeToFit
               minimumFontScale={0.72}
               style={[
                 circleStyles.sliceLabel,
                 isSelected && circleStyles.sliceLabelSelected,
               ]}
             >
               {item.name}
             </Text>
             {isSelected && (
               (() => {
                 const displayedTime = item.time ?? (item.startTime ? formatWheelTime(item.startTime) : undefined);
                 return displayedTime ? (
                   <View style={circleStyles.sliceTimeRow}>
                     <Text numberOfLines={1} style={[circleStyles.sliceTime, circleStyles.sliceTimeSelected]}>
                       {displayedTime}
                     </Text>
                     {remainingTime && <BlinkingRemainingTime time={remainingTime} />}
                   </View>
                 ) : null;
               })()
             )}
             {isSelected && (
               <TouchableOpacity
                 activeOpacity={0.8}
                 style={circleStyles.detailsButton}
                 onPress={() => {
                   const id = item.id ?? `index-${index}`;
                   setSuppressedPulseIds((currentIds) => new Set(currentIds).add(id));
                   onDetailsPress(item);
                 }}
               >
                 <Text style={circleStyles.detailsText}>الدخول</Text>
               </TouchableOpacity>
             )}
           </View>
         </View>
       );
      })}

      {/* Center content */}
      <View style={circleStyles.centerContent}>
        <Text style={circleStyles.brandName}>الصراط</Text>
        <Text style={circleStyles.brandEn}>SIRAT</Text>
        {centerItem && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCenterItemPress}
            style={[
              circleStyles.worshipButton,
              {
                top: cy - centerRadius,
                left: cx - centerRadius,
                width: centerRadius * 2,
                height: centerRadius * 2,
                borderRadius: centerRadius,
                transform: [{ scale: hasPulsingItem ? 0.94 + pulseOpacity * 0.09 : 1 }],
              },
            ]}
          >
            <Svg
              pointerEvents="none"
              width={centerRadius * 2}
              height={centerRadius * 2}
              viewBox={`0 0 ${centerRadius * 2} ${centerRadius * 2}`}
              style={circleStyles.centerButtonBackground}
            >
              <Defs>
                <RadialGradient id="activeCenterBurgundy" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#4c0f1f" />
                  <Stop offset="55%" stopColor="#5d1225" />
                  <Stop offset="100%" stopColor="#1b0813" />
                </RadialGradient>
              </Defs>
              <Circle
                cx={centerRadius}
                cy={centerRadius}
                r={centerRadius}
                fill="url(#activeCenterBurgundy)"
                stroke="rgba(201,169,110,0.3)"
                strokeWidth={3}
              />
            </Svg>
            <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72} style={circleStyles.worshipButtonText}>
              {formatWorshipButtonLabel(centerItem)}
            </Text>
          </TouchableOpacity>
        )}
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

const ProgressCard = ({ stats }: { stats: any }) => {
  const dailyGoal = Math.max(1, Number(stats?.daily_goal) || 100);
  const dailyNour = stats ? stats.daily_awarded : 0;
  const progress = Math.min(dailyNour / dailyGoal, 1);
  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.progressCard}>
      <Text style={styles.progressLabel}>إنجازاتك اليوم</Text>
      <View style={styles.progressRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{dailyNour}</Text>
          <Text style={styles.statLabel}>نور اليوم</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats ? Math.floor(stats.current_balance) : 0}</Text>
          <Text style={styles.statLabel}>إجمالي النور</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats ? stats.current_streak_days : 0}</Text>
          <Text style={styles.statLabel}>أيام التزام</Text>
        </View>
        <View style={styles.progressRing}>
          <Svg width={56} height={56}>
            <Circle cx={28} cy={28} r={24} fill="none" stroke="rgba(201,169,110,0.12)" strokeWidth={4} />
            <Circle cx={28} cy={28} r={24} fill="none" stroke="#c9a96e" strokeWidth={4}
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" transform="rotate(-90 28 28)" />
          </Svg>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>
    </View>
  );
};

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'الرئيسية' },
    { id: 'qibla', icon: '🧭', label: 'القبلة' },
    { id: 'worships', icon: '📿', label: 'العبادات' },
    { id: 'prayers', icon: '🕌', label: 'الصلوات والأذان' },
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
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesResult | null>(null);
  const [prayerError, setPrayerError] = useState<string | null>(null);
  const [wheelItems, setWheelItems] = useState<DailyWheelItem[]>([]);
  const [pulseDurationMs, setPulseDurationMs] = useState(10 * 60 * 1000);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<any>(null);

  // The home screen stays mounted while a user moves through a worship path.
  // Refresh on focus so a newly awarded Light transaction is reflected on return.
  useFocusEffect(useCallback(() => {
    let active = true;

    fetchWithAuth(`${getAuthApiBaseUrl()}/light/user/me/stats`)
      .then(async (response) => {
        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!response.ok) return;
        const payload = await response.json();
        if (active && payload.success) setUserStats(payload.data);
      })
      .catch(() => {
        // The initial authentication flow continues to handle unavailable sessions.
      });

    return () => { active = false; };
  }, []));
  const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
  const sideMenuTranslateX = React.useRef(new Animated.Value(400)).current;
  const [fontsLoaded] = useFonts({ Amiri_400Regular });

  const openSideMenu = () => {
    setIsSideMenuVisible(true);
    sideMenuTranslateX.setValue(400);
    Animated.timing(sideMenuTranslateX, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const closeSideMenu = () => {
    Animated.timing(sideMenuTranslateX, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setIsSideMenuVisible(false);
    });
  };

  const handleSideMenuItemPress = async (itemId: string) => {
    closeSideMenu();

    if (itemId === 'profile') {
      router.push('/profile');
      return;
    }

    if (itemId === 'logout') {
      await clearAuthSession();
      setIsAuthenticated(false);
      router.replace('/login');
    }
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'more') {
      setIsMoreMenuVisible((current) => !current);
      return;
    }

    if (tabId === 'qibla' || tabId === 'worships' || tabId === 'prayers') {
      router.push(`/${tabId}`);
      return;
    }

    setActiveTab(tabId);
    setIsMoreMenuVisible(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          router.replace('/login');
          return;
        }
        setIsAuthenticated(true);
        try {
          const storedName = await AsyncStorage.getItem('authUserName');
          if (storedName) setUserName(storedName);
        } catch (e) {
          console.warn('Error reading stored user name', e);
        }

        try {
          const statsRes = await fetchWithAuth(`${getAuthApiBaseUrl()}/light/user/me/stats`);
          if (statsRes.status === 401) {
            router.replace('/login');
            return;
          }
          if (statsRes.ok) {
            const statsJson = await statsRes.json();
            if (statsJson.success) setUserStats(statsJson.data);
          }
        } catch (e) {
          console.error("Error fetching stats:", e);
        }

        // Automatic Daily Check-in & Streak Update
        try {
          fetchWithAuth(`${getAuthApiBaseUrl()}/light/daily-checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }).catch(() => {});
        } catch (e) {
          console.warn('Daily check-in failed silently:', e);
        }
      } catch (error) {
        console.warn('Auth check failed:', error);
        router.replace('/login');
      } finally {
        setIsAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout> | null = null;

    const loadPrayerTimes = async () => {
      try {
        const [{ PrayerService }, { generateDailyWheel, loadPrayerWheelEventsConfig }] = await Promise.all([
          import('../services/prayer.service'),
          import('../services/prayer-wheel.service'),
        ]);
        const times = await PrayerService.getTodayPrayerTimes();
        setPrayerTimes(times);
        
        // Fetch wheel events and the global pulse duration setting in parallel
        const [dynamicEvents, settingsRes] = await Promise.all([
          loadPrayerWheelEventsConfig(),
          fetch(`${getAuthApiBaseUrl()}/prayer-wheel-events/settings`).then(res => res.json()).catch(() => ({}))
        ]);

        if (settingsRes?.data?.pulse_duration_minutes) {
          setPulseDurationMs(settingsRes.data.pulse_duration_minutes * 60 * 1000);
        }

        setWheelItems(generateDailyWheel(times, { defaultDurationMinutes: 15, events: dynamicEvents }));
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

  if (!fontsLoaded || !isAuthChecked) return null;
  if (!isAuthenticated) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a0e14" />
      <ImageBackground source={homeBackground} resizeMode="cover" style={styles.pageBackground}>
        <View pointerEvents="none" style={styles.pageOverlay} />

      <View style={styles.header}>
        <View style={styles.headerLogo}><Image source={homeLogo} style={{ width: 34, height: 34 }} resizeMode="contain" accessibilityLabel="شعار الصراط" /></View>
        <TouchableOpacity
          style={styles.menuBtn}
          activeOpacity={0.7}
          onPress={openSideMenu}
          accessibilityRole="button"
          accessibilityLabel="فتح القائمة"
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.greeting}>السلام عليكم</Text>
          <Text style={styles.userName}>{userName ?? 'المستخدم'}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarHeader}
          activeOpacity={0.7}
          onPress={() => router.push('/profile')}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2a0a1a" strokeWidth={2} strokeLinecap="round">
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PrayerCircle
          currentTime={currentTime}
          pulseDurationMs={pulseDurationMs}
          onDetailsPress={(item) => {
            router.push({
              pathname: '/activity-details',
              params: {
                worshipId: String(item.worshipId ?? item.id),
                title: item.name,
                time: item.time ?? '',
                startTimeIso: item.startTime?.toISOString() ?? '',
                endTime: item.endTime?.toISOString() ?? '',
              },
            });
          }}
          wheelItems={
            wheelItems.length > 0
              ? wheelItems.map((item) => ({
                  id: item.id,
                  name: item.label,
                  time: formatWheelTime(item.startTime),
                  startTime: item.startTime,
                  endTime: item.endTime,
                  reverseTextDirection: item.reverseTextDirection,
                  worshipId: item.worshipId,
                }))
              : defaultWheelItems
          }
        />
        <TimeCard currentTime={currentTime} />
        <PrayerTimesCard prayerTimes={prayerTimes} error={prayerError} />
        <ProgressCard stats={userStats} />
      </ScrollView>
      </ImageBackground>

      <Modal
        transparent
        visible={isSideMenuVisible}
        animationType="none"
        onRequestClose={closeSideMenu}
      >
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.menuBackdrop}
            onPress={closeSideMenu}
            accessibilityRole="button"
            accessibilityLabel="إغلاق القائمة"
          />
          <Animated.View style={[styles.sideMenu, { transform: [{ translateX: sideMenuTranslateX }] }]}>
            <View style={styles.sideMenuHeader}>
              <TouchableOpacity
                style={styles.sideMenuCloseButton}
                onPress={closeSideMenu}
                accessibilityRole="button"
                accessibilityLabel="إغلاق القائمة"
              >
                <Text style={styles.sideMenuCloseText}>×</Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.sideMenuTitle}>الصراط</Text>
                <Text style={styles.sideMenuUserName}>{userName ?? 'المستخدم'}</Text>
              </View>
            </View>

            <View style={styles.sideMenuItems}>
              {sideMenuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.sideMenuItem}
                  activeOpacity={0.75}
                  onPress={() => handleSideMenuItemPress(item.id)}
                >
                  <Text style={styles.sideMenuItemIcon}>{item.icon}</Text>
                  <Text style={styles.sideMenuItemLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.sideMenuItem, styles.logoutMenuItem]}
              activeOpacity={0.75}
              onPress={() => handleSideMenuItemPress('logout')}
            >
              <Text style={styles.logoutMenuIcon}>↪</Text>
              <Text style={styles.logoutMenuLabel}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0e14',
  },
  pageBackground: { flex: 1 },
  pageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 4, 10, 0.48)' },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
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
  headerLogo: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 3,
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 4, 8, 0.58)',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sideMenu: {
    width: '82%',
    maxWidth: 340,
    height: '100%',
    backgroundColor: '#29121c',
    alignSelf: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(201,169,110,0.24)',
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  sideMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,169,110,0.18)',
    paddingBottom: 20,
  },
  sideMenuCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201,169,110,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideMenuCloseText: { color: '#f5e6d3', fontSize: 25, lineHeight: 27 },
  sideMenuTitle: { color: '#f5e6d3', fontFamily: 'Amiri_400Regular', fontSize: 25, textAlign: 'right' },
  sideMenuUserName: { color: '#c9a96e', fontSize: 12, marginTop: -3, textAlign: 'right' },
  sideMenuItems: { marginTop: 22, flex: 1 },
  sideMenuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 13,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,230,211,0.08)',
  },
  sideMenuItemIcon: { color: '#c9a96e', fontSize: 20, width: 26, textAlign: 'center' },
  sideMenuItemLabel: { color: '#f5e6d3', fontSize: 15, flex: 1, textAlign: 'right', writingDirection: 'rtl' },
  logoutMenuItem: { borderBottomWidth: 0, borderTopWidth: 1, borderTopColor: 'rgba(214,109,109,0.26)', paddingTop: 10 },
  logoutMenuIcon: { color: '#ef9898', fontSize: 22, width: 26, textAlign: 'center' },
  logoutMenuLabel: { color: '#ef9898', fontSize: 15, flex: 1, textAlign: 'right', writingDirection: 'rtl' },
  moreOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 72,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(10, 4, 8, 0.25)',
  },
  moreMenuCard: {
    backgroundColor: '#29121c',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.24)',
    overflow: 'hidden',
  },
  moreMenuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,230,211,0.08)',
  },
  moreMenuItemIcon: { fontSize: 22, marginLeft: 12 },
  moreMenuItemLabel: { color: '#f5e6d3', fontSize: 16, flex: 1, textAlign: 'right', writingDirection: 'rtl' },
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
  sliceLabel: {
    color: '#4b0f16',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    fontFamily: 'Amiri_400Regular',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  sliceLabelActive: {
    color: '#2f0910',
    fontSize: 10,
  },
  sliceLabelSelected: {
    color: '#f5e6d3',
    fontSize: 10,
    lineHeight: 13,
    textShadowColor: 'rgba(245,230,211,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  sliceTime: {
    color: '#8a6a5a',
    fontSize: 7,
    lineHeight: 9,
    fontVariant: ['tabular-nums'],
  },
  sliceTimeSelected: {
    color: '#c9a96e',
    fontSize: 8,
    lineHeight: 10,
    marginTop: 1,
  },
  sliceTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 1,
  },
  remainingTime: {
    color: '#f5e6d3',
    fontSize: 8,
    lineHeight: 10,
    fontVariant: ['tabular-nums'],
  },
  remainingTimeDimmed: {
    color: '#c9a96e',
    opacity: 0.18,
  },
  sliceLabelReversed: {
    transform: [{ rotate: '180deg' }],
  },
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
  worshipButton: {
    position: 'absolute',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  worshipButtonText: {
    zIndex: 1,
    color: '#fff6d1',
    fontFamily: 'Amiri_400Regular',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    writingDirection: 'rtl',
    textAlign: 'center',
    textShadowColor: 'rgba(255,181,46,0.72)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
  centerButtonBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  detailsButton: {
    alignSelf: 'stretch',
    marginTop: 5,
    minHeight: 28,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,230,211,0.5)',
  },
  detailsText: {
    fontSize: 10,
    color: '#f5e6d3',
    lineHeight: 14,
    fontWeight: '700',
    fontFamily: 'Amiri_400Regular',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});
