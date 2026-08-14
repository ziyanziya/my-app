import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View, StyleSheet, Pressable, ActivityIndicator, ImageBackground, Modal } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { PrayerService } from '../services/prayer.service';
import { useRef } from 'react';
import { goBackOrHome } from '../utils/navigation';

const PAGE_BACKGROUND = require('../../assets/images/auth/islamic-auth-background.png');

const getExpoLocation = async () => {
  try {
    return await import('expo-location');
  } catch {
    return null;
  }
};

const KAABA = { latitude: 21.422487, longitude: 39.826206 };

const toRadians = (value: number) => (value * Math.PI) / 180;

const normalizeDegrees = (value: number) => {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

const calculateBearing = (fromLat: number, fromLon: number, toLat: number, toLon: number) => {
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);
  const lonDelta = toRadians(toLon - fromLon);

  const y = Math.sin(lonDelta) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lonDelta);
  const angle = Math.atan2(y, x);

  return normalizeDegrees((angle * 180) / Math.PI);
};

const calculateDistanceKm = (fromLat: number, fromLon: number, toLat: number, toLon: number) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const getDirectionLabel = (difference: number) => {
  if (difference <= 22.5 || difference >= 337.5) return 'شمال';
  if (difference <= 67.5) return 'شمال شرق';
  if (difference <= 112.5) return 'شرق';
  if (difference <= 157.5) return 'جنوب شرق';
  if (difference <= 202.5) return 'جنوب';
  if (difference <= 247.5) return 'جنوب غرب';
  if (difference <= 292.5) return 'غرب';
  return 'شمال غرب';
};

export default function QiblaScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [compassAvailable, setCompassAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCalib, setShowCalib] = useState(false);

  const compassSubRef = useRef<{ remove?: () => void } | null>(null);
  const magSubRef = useRef<any>(null);
  const accSubRef = useRef<any>(null);
  const lastHeadingRef = useRef<number | null>(null);
  const magDataRef = useRef<any>(null);
  const accDataRef = useRef<any>(null);
  const nativeEmitterErrorRef = useRef(false);
  const lastVecRef = useRef<{ x: number; y: number } | null>(null);

  const computeTiltCompensatedHeading = (mag: any, acc: any) => {
    if (!mag || !acc) return null;
    const mx = mag.x;
    const my = mag.y;
    const mz = mag.z;
    const ax = acc.x;
    const ay = acc.y;
    const az = acc.z;

    const roll = Math.atan2(ay, az);
    const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));

    const sinRoll = Math.sin(roll);
    const cosRoll = Math.cos(roll);
    const sinPitch = Math.sin(pitch);
    const cosPitch = Math.cos(pitch);

    const xh = mx * cosPitch + mz * sinPitch;
    const yh = mx * sinRoll * sinPitch + my * cosRoll - mz * sinRoll * cosPitch;

    if (!Number.isFinite(xh) || !Number.isFinite(yh)) return null;

    const headingRad = Math.atan2(yh, xh);
    return normalizeDegrees((headingRad * 180) / Math.PI);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const stored = await PrayerService.loadStoredPrayerTimes();
        if (stored && typeof stored.latitude === 'number' && typeof stored.longitude === 'number') {
          if (mounted) setLocation({ latitude: stored.latitude, longitude: stored.longitude });
        } else {
          // fallback to a sensible default (Riyadh) until user enables precise location
          if (mounted) setLocation({ latitude: 24.7136, longitude: 46.6753 });
        }

        // Do NOT auto-subscribe here to avoid crashing on some devices/emulators.
        // The compass will be started only when the user explicitly taps "تفعيل البوصلة".
        setCompassAvailable(true);
      } catch (caughtError) {
        if (mounted) {
          setError(caughtError instanceof Error ? caughtError.message : 'تعذر تحديد الاتجاه، جرّب إعادة المحاولة.');
        }
        setCompassAvailable(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    // Auto-enable compass when opening the screen (user requested immediate start)
    (async () => {
      try {
        await enableCompass();
      } catch {
        // ignore; enableCompass handles errors
      }
    })();

    return () => {
      mounted = false;
      try {
        compassSubRef.current?.remove?.();
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  // Manually enable compass subscription when user requests it.
  const enableCompass = async () => {
    // Use a temporary global error handler to catch and suppress
    // native EventEmitter errors that can crash the JS app on some devices.
    const prevGlobalHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
    const temporaryHandler = (error: any, isFatal?: boolean) => {
      const msg = error && (error.message || error.toString && error.toString());
      if (typeof msg === 'string' && msg.includes('Value is undefined')) {
        // mark that a native EventEmitter issue occurred; don't show UI error immediately
        nativeEmitterErrorRef.current = true;
        // swallow this known native EventEmitter error
        return;
      }
      if (prevGlobalHandler) {
        try {
          prevGlobalHandler(error, isFatal);
        } catch {
          // ignore
        }
      }
    };

    if ((global as any).ErrorUtils?.setGlobalHandler) {
      try {
        (global as any).ErrorUtils.setGlobalHandler(temporaryHandler);
      } catch {
        // ignore if not supported
      }
    }

    // Retry loop: try a few times before showing an error to the user
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const Location = await getExpoLocation();
      if (!Location || typeof Location.watchHeadingAsync !== 'function') {
        // try magnetometer+accelerometer fallback (tilt-compensated)
        try {
          const Sensors = await import('expo-sensors');
          const { Magnetometer, Accelerometer } = Sensors;
          Magnetometer.setUpdateInterval(100);
          Accelerometer.setUpdateInterval(100);

          magSubRef.current = Magnetometer.addListener((mag: any) => {
            if (!mag || typeof mag.x !== 'number') return;
            magDataRef.current = mag;
            const heading = computeTiltCompensatedHeading(magDataRef.current, accDataRef.current);
            if (heading === null) return;
            // vector smoothing
            const rad = (heading * Math.PI) / 180;
            const vx = Math.cos(rad);
            const vy = Math.sin(rad);
            const alpha = 0.25;
            const last = lastVecRef.current;
            const nextX = last ? last.x * (1 - alpha) + vx * alpha : vx;
            const nextY = last ? last.y * (1 - alpha) + vy * alpha : vy;
            lastVecRef.current = { x: nextX, y: nextY };
            const nextHeading = normalizeDegrees((Math.atan2(nextY, nextX) * 180) / Math.PI);
            setHeading(nextHeading);
          });

          accSubRef.current = Accelerometer.addListener((acc: any) => {
            if (!acc || typeof acc.x !== 'number') return;
            accDataRef.current = acc;
            // if mag already has data, update heading
            if (magDataRef.current) {
              const heading = computeTiltCompensatedHeading(magDataRef.current, accDataRef.current);
              if (heading === null) return;
              const rad = (heading * Math.PI) / 180;
              const vx = Math.cos(rad);
              const vy = Math.sin(rad);
              const alpha = 0.25;
              const last = lastVecRef.current;
              const nextX = last ? last.x * (1 - alpha) + vx * alpha : vx;
              const nextY = last ? last.y * (1 - alpha) + vy * alpha : vy;
              lastVecRef.current = { x: nextX, y: nextY };
              const nextHeading = normalizeDegrees((Math.atan2(nextY, nextX) * 180) / Math.PI);
              setHeading(nextHeading);
            }
          });

          setCompassAvailable(true);
          return;
        } catch {
          setCompassAvailable(false);
          return;
        }
      }

      // When enabling, try to get a fresh device location (user-initiated)
      try {
        const coords = await PrayerService.getDeviceCoordinates();
        if (coords) setLocation(coords);
      } catch {
        // ignore and continue with stored/default location
      }

      try {
        // Prefer magnetometer-based heading when possible to avoid native watch issues.
        // If watchHeadingAsync works without throwing, it will set the heading.
        const sub = await Location.watchHeadingAsync((headingData: any) => {
          if (!headingData || typeof headingData !== 'object') return;
          const trueHeading = typeof headingData.trueHeading === 'number' ? headingData.trueHeading : null;
          const magHeading = typeof headingData.magHeading === 'number' ? headingData.magHeading : null;
          const nextHeading = trueHeading ?? magHeading ?? 0;
          if (Number.isFinite(nextHeading)) setHeading(normalizeDegrees(nextHeading));
        });

        compassSubRef.current = sub;
        setCompassAvailable(true);
        return;
      } catch (e) {
        // fallback to magnetometer
        try {
          const Sensors = await import('expo-sensors');
          const { Magnetometer, Accelerometer } = Sensors;
          Magnetometer.setUpdateInterval(100);
          Accelerometer.setUpdateInterval(100);

          magSubRef.current = Magnetometer.addListener((mag: any) => {
            if (!mag || typeof mag.x !== 'number') return;
            magDataRef.current = mag;
            const heading = computeTiltCompensatedHeading(magDataRef.current, accDataRef.current);
            if (heading === null) return;
            const rad = (heading * Math.PI) / 180;
            const vx = Math.cos(rad);
            const vy = Math.sin(rad);
            const alpha = 0.25;
            const last = lastVecRef.current;
            const nextX = last ? last.x * (1 - alpha) + vx * alpha : vx;
            const nextY = last ? last.y * (1 - alpha) + vy * alpha : vy;
            lastVecRef.current = { x: nextX, y: nextY };
            const nextHeading = normalizeDegrees((Math.atan2(nextY, nextX) * 180) / Math.PI);
            setHeading(nextHeading);
          });

          accSubRef.current = Accelerometer.addListener((acc: any) => {
            if (!acc || typeof acc.x !== 'number') return;
            accDataRef.current = acc;
            if (magDataRef.current) {
              const heading = computeTiltCompensatedHeading(magDataRef.current, accDataRef.current);
              if (heading === null) return;
              const rad = (heading * Math.PI) / 180;
              const vx = Math.cos(rad);
              const vy = Math.sin(rad);
              const alpha = 0.25;
              const last = lastVecRef.current;
              const nextX = last ? last.x * (1 - alpha) + vx * alpha : vx;
              const nextY = last ? last.y * (1 - alpha) + vy * alpha : vy;
              lastVecRef.current = { x: nextX, y: nextY };
              const nextHeading = normalizeDegrees((Math.atan2(nextY, nextX) * 180) / Math.PI);
              setHeading(nextHeading);
            }
          });

          setCompassAvailable(true);
          return;
        } catch {
          setCompassAvailable(false);
          setError(e instanceof Error ? e.message : 'تعذر تفعيل البوصلة');
          return;
        }
      }
        // success path returns from inside the try blocks above
      } catch (err) {
        // on last attempt, surface the error
        if (attempt === maxAttempts) {
          setCompassAvailable(false);
          // if native emitter error occurred, show the friendly message
          if (nativeEmitterErrorRef.current) {
            setError('البوصلة غير متاحة على هذا الجهاز');
          } else {
            setError(err instanceof Error ? err.message : 'تعذر تفعيل البوصلة');
          }
        } else {
          // small delay before retrying
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    try {
      // restore previous global handler
      if ((global as any).ErrorUtils?.setGlobalHandler) {
        try {
          (global as any).ErrorUtils.setGlobalHandler(prevGlobalHandler);
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  };

  const disableCompass = async () => {
    try {
      if (compassSubRef.current?.remove) {
        compassSubRef.current.remove();
      }
    } catch {
      // ignore
    } finally {
      compassSubRef.current = null;
      try {
        if (magSubRef.current && typeof magSubRef.current.remove === 'function') {
          magSubRef.current.remove();
        }
      } catch {
        // ignore
      }
      magSubRef.current = null;
      try {
        if (accSubRef.current && typeof accSubRef.current.remove === 'function') {
          accSubRef.current.remove();
        }
      } catch {
        // ignore
      }
      accSubRef.current = null;
      magDataRef.current = null;
      accDataRef.current = null;
      lastVecRef.current = null;
    }
  };

  const qiblaBearing = useMemo(() => {
    if (!location) return 0;
    return calculateBearing(location.latitude, location.longitude, KAABA.latitude, KAABA.longitude);
  }, [location]);

  const relativeAngle = useMemo(() => {
    if (heading === null) return 0;
    return normalizeDegrees(qiblaBearing - heading);
  }, [heading, qiblaBearing]);

  const headingStatusText = compassAvailable ? 'جاهز' : 'المحاكاة لا تدعم البوصلة';

  const distanceKm = useMemo(() => {
    if (!location) return 0;
    return calculateDistanceKm(location.latitude, location.longitude, KAABA.latitude, KAABA.longitude);
  }, [location]);

  const directionLabel = getDirectionLabel(relativeAngle);

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={PAGE_BACKGROUND} resizeMode="cover" style={styles.pageBackground}>
        <View pointerEvents="none" style={styles.pageOverlay} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={goBackOrHome} accessibilityRole="button" accessibilityLabel="رجوع">
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerWrap}>
          <Text style={styles.eyebrow}>الاتجاه</Text>
          <Text style={styles.title}>القبلة</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#dcb575" />
            <Text style={styles.loadingText}>جارٍ تحديد الاتجاه...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.card}>
            <Text style={styles.warningTitle}>تعذّر تحديد الاتجاه</Text>
            <Text style={styles.warningText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error ? (
          <View style={styles.card}>
                    <View style={styles.controlsRow}>
                      <Text style={styles.helpText}>{compassAvailable ? 'البوصلة مفعلة' : 'البوصلة غير متاحة'}</Text>
                    </View>

                    <View style={styles.compassWrap}>
              <View style={styles.compassOuterRing}>
                <View style={styles.compassInnerRing} />


                {/* degree marks removed to avoid star-shaped overlay behind the North label */}

                <Text style={styles.compassNorth}>N</Text>
                <Text style={styles.compassSouth}>S</Text>
                <Text style={styles.compassEast}>E</Text>
                <Text style={styles.compassWest}>W</Text>


                <View style={[styles.compassNeedle, { transform: [{ rotate: `${relativeAngle}deg` }] }]}>
                  <View style={styles.needleHead} />
                  <View style={styles.needleBody} />
                </View>

                <View style={styles.compassCenterDot} />
              </View>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.valueText}>{Math.round(relativeAngle)}°</Text>
              <Text style={styles.labelText}>الانحراف</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.valueText}>{headingStatusText}</Text>
              <Text style={styles.labelText}>حالة البوصلة</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.valueText}>{directionLabel}</Text>
              <Text style={styles.labelText}>اتجاهك الآن</Text>
            </View>

            {/* distance removed as requested */}

            <View style={styles.locationCard}>
              <Text style={styles.locationTitle}>موقعك الحالي</Text>
              <Text style={styles.locationText}>
                {location ? `${location.latitude.toFixed(4)}، ${location.longitude.toFixed(4)}` : 'جارٍ الحصول على الموقع...'}
              </Text>
            </View>
            <Pressable style={styles.calibButton} onPress={() => setShowCalib(true)} accessibilityRole="button">
              <Text style={styles.calibButtonText}>إرشادات معايرة البوصلة</Text>
            </Pressable>
          </View>
        ) : null}

        <Modal visible={showCalib} animationType="slide" transparent onRequestClose={() => setShowCalib(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>كيفية معايرة البوصلة</Text>
              <Text style={styles.modalText}>1. ابتعد عن المعادن والمغناطيسيات القريبة (حامل السيارة، مكبر الصوت).</Text>
              <Text style={styles.modalText}>2. امسك الهاتف وحرّكه ببطء في شكل 8 واسع لبضع مرات.</Text>
              <Text style={styles.modalText}>3. ثم دوّر الجهاز حول محوره لتغطية كل الاتجاهات.</Text>
              <Text style={styles.modalText}>4. انتظر ثوانٍ حتى يستقر المؤشر، وإذا لم يتحسّن جرّب تكرار المعايرة في مكان مختلف.</Text>
              <Pressable style={styles.modalClose} onPress={() => setShowCalib(false)} accessibilityRole="button">
                <Text style={styles.modalCloseText}>حسناً</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a0e14' },
  pageBackground: { flex: 1 },
  pageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 4, 10, 0.48)' },
  content: { flexGrow: 1, padding: 18, paddingBottom: 40 },
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
  headerWrap: { marginBottom: 18, alignItems: 'flex-end' },
  eyebrow: { color: '#d7c09d', fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
  title: { color: '#f5e6d3', fontSize: 30, fontWeight: '900', writingDirection: 'rtl' },
  card: {
    backgroundColor: '#29121c',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.24)',
    padding: 18,
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#29121c',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.24)',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { color: '#f5e6d3', fontSize: 14, writingDirection: 'rtl' },
  warningTitle: { color: '#f5e6d3', fontSize: 20, fontWeight: '800', writingDirection: 'rtl', marginBottom: 8 },
  warningText: { color: '#d7c09d', fontSize: 13, textAlign: 'center', writingDirection: 'rtl', lineHeight: 20 },
  compassWrap: {
    width: 270,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  compassOuterRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#1a0e14',
    borderWidth: 2,
    borderColor: '#dcb575',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  compassInnerRing: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: 'rgba(220,181,117,0.45)',
    position: 'absolute',
  },
  degreeMark: {
    position: 'absolute',
    width: 2,
    height: 18,
    backgroundColor: 'rgba(245,230,211,0.5)',
    top: 12,
    left: '50%',
    marginLeft: -1,
  },
  compassNorth: {
    position: 'absolute',
    top: 8,
    color: '#f5e6d3',
    fontWeight: '800',
    fontSize: 14,
  },
  compassSouth: {
    position: 'absolute',
    bottom: 8,
    color: '#f5e6d3',
    fontWeight: '800',
    fontSize: 14,
  },
  compassEast: {
    position: 'absolute',
    right: 12,
    color: '#f5e6d3',
    fontWeight: '800',
    fontSize: 14,
  },
  compassWest: {
    position: 'absolute',
    left: 12,
    color: '#f5e6d3',
    fontWeight: '800',
    fontSize: 14,
  },
  compassNeedle: {
    width: 220,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  needleHead: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#dcb575',
    top: -14,
  },
  needleBody: {
    position: 'absolute',
    width: 6,
    height: 120,
    backgroundColor: '#dcb575',
    borderRadius: 6,
  },
  compassCenterDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f5e6d3',
    borderWidth: 3,
    borderColor: '#dcb575',
    position: 'absolute',
  },
  dataRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,169,110,0.2)',
  },
  labelText: { color: '#d7c09d', fontSize: 12, writingDirection: 'rtl' },
  valueText: { color: '#f5e6d3', fontSize: 18, fontWeight: '800', writingDirection: 'rtl' },
  locationCard: {
    width: '100%',
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(220,181,117,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220,181,117,0.18)',
    alignItems: 'flex-end',
  },
  locationTitle: { color: '#dcb575', fontSize: 12, fontWeight: '700', writingDirection: 'rtl', marginBottom: 4 },
  locationText: { color: '#f5e6d3', fontSize: 12, writingDirection: 'rtl', textAlign: 'right' },
  controlsRow: { width: '100%', alignItems: 'center', marginBottom: 12 },
  enableButton: { backgroundColor: '#dcb575', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 16 },
  enableButtonText: { color: '#1a0e14', fontWeight: '700' },
  disableButton: { backgroundColor: '#6b3f2f', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 16 },
  disableButtonText: { color: '#f5e6d3', fontWeight: '700' },
  helpText: { color: '#d7c09d', fontSize: 13 },
 
  calibButton: {
    marginTop: 18,
    backgroundColor: 'rgba(220,181,117,0.12)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220,181,117,0.18)',
  },
  calibButtonText: { color: '#dcb575', fontWeight: '700', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#29121c', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(220,181,117,0.18)' },
  modalTitle: { color: '#f5e6d3', fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'right' },
  modalText: { color: '#d7c09d', fontSize: 14, marginBottom: 6, textAlign: 'right' },
  modalClose: { marginTop: 12, backgroundColor: '#dcb575', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  modalCloseText: { color: '#1a0e14', fontWeight: '800' },
 
});
