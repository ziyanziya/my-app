export type PrayerWheelBaseTimeKey =
  | 'fajr'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'sunrise'
  | 'ishaFajrMidpoint'
  | 'shafWitr'
  | 'sunnahDuha'
  | 'wardQuran';

export type PrayerWheelEventConfig = {
  id: string;
  label: string;
  worshipId?: number;
  sourceKey: string;
  offsetMinutes: number;
  durationMinutes: number;
  reverseTextDirection?: boolean;
};

export type PrayerWheelConfig = {
  defaultDurationMinutes: number;
  events: PrayerWheelEventConfig[];
};

export const prayerWheelConfig: PrayerWheelConfig = {
  defaultDurationMinutes: 15,
  events: [
    {
      id: 'maghribAdhkar',
      label: 'أذكار المساء',
      sourceKey: 'maghrib',
      offsetMinutes: -30,
      durationMinutes: 20,
      reverseTextDirection: true,
    },
    {
      id: 'maghribPrayer',
      label: 'صلاة المغرب',
      sourceKey: 'maghrib',
      offsetMinutes: 0,
      durationMinutes: 10,
      reverseTextDirection: true,
    },
    {
      id: 'maghribSunnah',
      label: 'سنة المغرب',
      sourceKey: 'maghrib',
      offsetMinutes: 15,
      durationMinutes: 10,
      reverseTextDirection: true,
    },
    {
      id: 'ishaPrayer',
      label: 'صلاة العشاء',
      sourceKey: 'isha',
      offsetMinutes: 0,
      durationMinutes: 10,
      reverseTextDirection: true,
    },
    {
      id: 'surahMalik',
      label: 'سورة الملك',
      sourceKey: 'isha',
      offsetMinutes: 15,
      durationMinutes: 15,
      reverseTextDirection: true,
    },
    {
      id: 'ishaSunnah',
      label: 'سنة العشاء',
      sourceKey: 'isha',
      offsetMinutes: 30,
      durationMinutes: 10,
      reverseTextDirection: true,
    },
    {
      id: 'qiyamLayl',
      label: 'قيام الليل',
      sourceKey: 'ishaFajrMidpoint',
      offsetMinutes: 0,
      durationMinutes: 45,
      reverseTextDirection: true,
    },
    {
      id: 'shafWitr',
      label: 'الشفع والوتر',
      sourceKey: 'fajr',
      offsetMinutes: -180,
      durationMinutes: 15,
    },
    {
      id: 'sleepRemembrance',
      label: 'أذكار النوم',
      sourceKey: 'shafWitr',
      offsetMinutes: 15,
      durationMinutes: 10,
    },
    {
      id: 'tahajjudPrayer',
      label: 'صلاة التهجد',
      sourceKey: 'sleepRemembrance',
      offsetMinutes: 10,
      durationMinutes: 45,
    },
    {
      id: 'morningSupplication',
      label: 'الدعاء',
      sourceKey: 'tahajjudPrayer',
      offsetMinutes: 45,
      durationMinutes: 15,
    },
    {
      id: 'fajrPrayer',
      label: 'صلاة الفجر',
      sourceKey: 'fajr',
      offsetMinutes: 0,
      durationMinutes: 10,
    },
    {
      id: 'morningQuran',
      label: 'قراءة القرآن',
      sourceKey: 'fajr',
      offsetMinutes: 15,
      durationMinutes: 20,
      reverseTextDirection: true,
    },
    {
      id: 'sunnahUmrah',
      label: 'سنة العمرة',
      sourceKey: 'morningQuran',
      offsetMinutes: 20,
      durationMinutes: 15,
      reverseTextDirection: true,
    },
    {
      id: 'morningAdhkar',
      label: 'أذكار الصباح',
      sourceKey: 'sunnahUmrah',
      offsetMinutes: 15,
      durationMinutes: 15,
      reverseTextDirection: true,
    },
    {
      id: 'duhaPrayer',
      label: 'صلاة الضحى',
      sourceKey: 'sunrise',
      offsetMinutes: 20,
      durationMinutes: 10,
      reverseTextDirection: true,
    },
    {
      id: 'morningDhikrAfterDuha',
      label: 'الذكر',
      sourceKey: 'duhaPrayer',
      offsetMinutes: 10,
      durationMinutes: 15,
      reverseTextDirection: true,
    },
    {
      id: 'sunnahZawal',
      label: 'صلاة الزوال',
      sourceKey: 'dhuhr',
      offsetMinutes: -20,
      durationMinutes: 15,
      reverseTextDirection: true,
    },
    {
      id: 'dhuhrPrayer',
      label: 'صلاة الظهر',
      sourceKey: 'dhuhr',
      offsetMinutes: 0,
      durationMinutes: 10,
    },
    {
      id: 'dhuhrSunnah',
      label: 'سنة صلاة الظهر',
      sourceKey: 'dhuhr',
      offsetMinutes: 10,
      durationMinutes: 15,
    },
    {
      id: 'afterDhuhrDhikr',
      label: 'الذكر',
      sourceKey: 'dhuhr',
      offsetMinutes: 20,
      durationMinutes: 15,
    },
    {
      id: 'quranDaily',
      label: 'الورد اليومي',
      sourceKey: 'dhuhr',
      offsetMinutes: 45,
      durationMinutes: 20,
    },
    {
      id: 'dailySupplication',
      label: 'الدعاء',
      sourceKey: 'quranDaily',
      offsetMinutes: 15,
      durationMinutes: 15,
    },
    {
      id: 'asrPrayer',
      label: 'صلاة العصر',
      sourceKey: 'asr',
      offsetMinutes: 0,
      durationMinutes: 10,
    },
  ],
};
