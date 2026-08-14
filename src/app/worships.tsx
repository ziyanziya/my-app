import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View, StyleSheet, Pressable, ActivityIndicator, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { getAuthApiBaseUrl } from '../services/auth-api';
import { generateDailyWheel, loadPrayerWheelEventsConfig } from '../services/prayer-wheel.service';
import { PrayerService } from '../services/prayer.service';
import { goBackOrHome } from '../utils/navigation';

const PAGE_BACKGROUND = require('../../assets/images/auth/islamic-auth-background.png');

type WorshipItem = {
  id: number | string;
  worshipId?: number | null;
  name?: string;
  title?: string;
  description?: string;
  time?: string | Date | null;
  points?: number;
  order?: number;
  icon?: string | null;
  is_active?: number;
  computedTime?: Date | null;
  computedEndTime?: Date | null;
};

const toLatinDigits = (value: string) => value.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const formatCountdown = (endTime?: Date | null, now = Date.now()) => {
  if (!endTime) return '00:00:00';

  let remaining = new Date(endTime).getTime() - now;
  if (remaining < 0) remaining = 0;

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return toLatinDigits(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
};

const formatWorshipTime = (value?: string | Date | null) => {
  if (!value) return 'بدون توقيت';

  if (value instanceof Date) {
    return toLatinDigits(
      value.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    );
  }

  const clean = String(value).trim();
  if (!clean) return 'بدون توقيت';

  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    const hour = Number(match[1]);
    const minute = match[2];
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(clean)) {
    const parsed = new Date(clean);
    if (!Number.isNaN(parsed.getTime())) {
      return toLatinDigits(
        parsed.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      );
    }
  }

  return toLatinDigits(clean);
};

export default function WorshipsScreen() {
  const [worships, setWorships] = useState<WorshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorshipKey, setSelectedWorshipKey] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadWorships = async () => {
      try {
        const [worshipResponse, prayerTimes, config] = await Promise.all([
          fetch(`${getAuthApiBaseUrl()}/worships?all=1`),
          PrayerService.getTodayPrayerTimes(),
          loadPrayerWheelEventsConfig(),
        ]);

        if (!worshipResponse.ok) {
          throw new Error('Failed to load worships');
        }

        const worshipPayload = await worshipResponse.json();
        const rows = Array.isArray(worshipPayload?.data) ? (worshipPayload.data as WorshipItem[]) : [];
        const activeRows = rows.filter((item) => item.is_active !== 0).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const activeById = new Map<number, WorshipItem>();
        activeRows.forEach((item) => {
          if (typeof item.id === 'number') {
            activeById.set(item.id, item);
          }
        });

        const wheelItems = generateDailyWheel(prayerTimes, { defaultDurationMinutes: 15, events: config });

        const wheelList = wheelItems.map((item, index) => {
          const mappedWorship = typeof item.worshipId === 'number' ? activeById.get(item.worshipId) : undefined;
          return {
            id: typeof item.worshipId === 'number' ? item.worshipId : `wheel-${index}`,
            worshipId: typeof item.worshipId === 'number' ? item.worshipId : null,
            title: mappedWorship?.title || mappedWorship?.name || item.label,
            name: mappedWorship?.name || item.label,
            description: mappedWorship?.description ?? '',
            time: item.startTime.toISOString(),
            points: mappedWorship?.points ?? 5,
            order: index + 1,
            is_active: 1,
            computedTime: item.startTime,
            computedEndTime: item.endTime,
          } satisfies WorshipItem;
        });

        const missingDbRows = activeRows
          .filter((item) => typeof item.id === 'number' && !wheelItems.some((wheelItem) => wheelItem.worshipId === item.id))
          .map((item) => ({
            ...item,
            order: wheelList.length + 1,
            computedTime: item.computedTime ?? null,
            computedEndTime: item.computedEndTime ?? null,
          }));

        if (isMounted) {
          setWorships([...wheelList, ...missingDbRows].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError('تعذر تحميل العبادات');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWorships();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={PAGE_BACKGROUND} resizeMode="cover" style={styles.pageBackground}>
        <View pointerEvents="none" style={styles.pageOverlay} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={goBackOrHome}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerWrap}>
          <Text style={styles.title}>العبادات</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#dcb575" />
            <Text style={styles.loadingText}>جاري تحميل العبادات...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {worships.map((item, index) => {
              const itemKey = `${item.id ?? item.name ?? item.title ?? 'worship'}-${index}`;
              const label = item.title || item.name || `العبادة ${index + 1}`;
              const displayTime = item.computedTime ? item.computedTime : item.time ?? null;
              const isSelected = selectedWorshipKey === itemKey;
              const countdownText = isSelected ? formatCountdown(item.computedEndTime, now) : null;

              return (
                <Pressable
                  key={itemKey}
                  style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                  onPress={() => setSelectedWorshipKey(isSelected ? null : itemKey)}
                >
                  <View style={styles.indexWrap}>
                    <Text style={styles.index}>{index + 1}</Text>
                  </View>

                  <View style={styles.itemBody}>
                    <Text style={styles.itemLabel}>{label}</Text>
                    <Text style={styles.itemTime}>{formatWorshipTime(displayTime)}</Text>

                    {isSelected && (
                      <View style={styles.expandedBox}>
                        <Text style={styles.countdownLabel}>العد التنازلي</Text>
                        <Text style={styles.countdownValue}>{countdownText}</Text>
                        <Pressable
                          style={styles.detailsButton}
                          onPress={() => {
                            router.push({
                              pathname: '/activity-details',
                              params: {
                                worshipId: String(item.id),
                                title: label,
                                time: formatWorshipTime(displayTime),
                                endTime: item.computedEndTime?.toISOString() ?? '',
                              },
                            });
                          }}
                        >
                          <Text style={styles.detailsButtonText}>عرض التفاصيل</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  <Text style={styles.pointBadge}>{item.points ?? 0} ن</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a0e14' },
  pageBackground: { flex: 1 },
  pageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 4, 10, 0.48)' },
  content: { flexGrow: 1, padding: 18 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.35)',
    backgroundColor: '#24101b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  backText: { color: '#f5e6d3', fontSize: 30, lineHeight: 30 },
  headerWrap: { marginBottom: 16 },
  title: {
    color: '#f5e6d3',
    fontSize: 28,
    fontWeight: '800',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  subtitle: {
    color: '#cbb89d',
    fontSize: 13,
    marginTop: 6,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  loadingText: { color: '#f5e6d3', fontSize: 14, writingDirection: 'rtl' },
  emptyCard: {
    backgroundColor: '#29121c',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
  },
  emptyText: { color: '#f5e6d3', textAlign: 'center', writingDirection: 'rtl' },
  list: { gap: 10 },
  itemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#29121c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  itemRowSelected: {
    borderColor: '#dcb575',
    backgroundColor: '#301922',
  },
  indexWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcb575',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  index: {
    color: '#1a0e14',
    fontWeight: '800',
    fontSize: 12,
  },
  itemBody: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemLabel: {
    color: '#f5e6d3',
    fontSize: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  itemTime: {
    color: '#d7c09d',
    fontSize: 12,
    marginTop: 4,
    writingDirection: 'rtl',
  },
  expandedBox: {
    width: '100%',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,169,110,0.2)',
    alignItems: 'flex-end',
  },
  countdownLabel: {
    color: '#d7c09d',
    fontSize: 12,
    writingDirection: 'rtl',
  },
  countdownValue: {
    color: '#f5e6d3',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    writingDirection: 'rtl',
  },
  detailsButton: {
    marginTop: 10,
    backgroundColor: '#dcb575',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  detailsButtonText: {
    color: '#1a0e14',
    fontWeight: '700',
    fontSize: 12,
  },
  pointBadge: {
    color: '#f2d58a',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(242, 213, 138, 0.12)',
    marginRight: 8,
  },
});
