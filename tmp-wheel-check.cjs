const { PrayerTimes, CalculationMethod, Coordinates, HighLatitudeRule } = require('adhan');
const MINUTES_IN_MS = 60 * 1000;
const HOURS_IN_MS = 60 * MINUTES_IN_MS;
const prayerWheelConfig = {
  defaultDurationMinutes: 15,
  events: [
    { id: 'maghribAdhkar', label:'أذكار المساء', sourceKey:'maghrib', offsetMinutes:-30, durationMinutes:20, reverseTextDirection:true },
    { id: 'maghribPrayer', label:'صلاة المغرب', sourceKey:'maghrib', offsetMinutes:0, durationMinutes:10, reverseTextDirection:true },
    { id: 'maghribSunnah', label:'سنة المغرب', sourceKey:'maghrib', offsetMinutes:15, durationMinutes:10, reverseTextDirection:true },
    { id: 'ishaPrayer', label:'صلاة العشاء', sourceKey:'isha', offsetMinutes:0, durationMinutes:10, reverseTextDirection:true },
    { id: 'surahMalik', label:'سورة الملك', sourceKey:'isha', offsetMinutes:15, durationMinutes:15, reverseTextDirection:true },
    { id: 'ishaSunnah', label:'سنة العشاء', sourceKey:'isha', offsetMinutes:30, durationMinutes:10, reverseTextDirection:true },
    { id: 'qiyamLayl', label:'قيام الليل', sourceKey:'ishaFajrMidpoint', offsetMinutes:0, durationMinutes:45, reverseTextDirection:true },
    { id: 'shafWitr', label:'الشفع والوتر', sourceKey:'fajr', offsetMinutes:-180, durationMinutes:15 },
    { id: 'sleepRemembrance', label:'أذكار النوم', sourceKey:'shafWitr', offsetMinutes:15, durationMinutes:10 },
    { id: 'tahajjudPrayer', label:'صلاة التهجد', sourceKey:'sleepRemembrance', offsetMinutes:10, durationMinutes:45 },
    { id: 'morningSupplication', label:'الدعاء', sourceKey:'tahajjudPrayer', offsetMinutes:45, durationMinutes:15 },
    { id: 'fajrPrayer', label:'صلاة الفجر', sourceKey:'fajr', offsetMinutes:0, durationMinutes:10 },
    { id: 'morningQuran', label:'قراءة القرآن', sourceKey:'fajr', offsetMinutes:15, durationMinutes:20, reverseTextDirection:true },
    { id: 'sunnahUmrah', label:'سنة العمرة', sourceKey:'morningQuran', offsetMinutes:20, durationMinutes:15, reverseTextDirection:true },
    { id: 'morningAdhkar', label:'أذكار الصباح', sourceKey:'sunnahUmrah', offsetMinutes:15, durationMinutes:15, reverseTextDirection:true },
    { id: 'duhaPrayer', label:'صلاة الضحى', sourceKey:'sunrise', offsetMinutes:20, durationMinutes:10, reverseTextDirection:true },
    { id: 'morningDhikrAfterDuha', label:'الذكر', sourceKey:'duhaPrayer', offsetMinutes:10, durationMinutes:15, reverseTextDirection:true },
    { id: 'sunnahZawal', label:'صلاة الزوال', sourceKey:'dhuhr', offsetMinutes:-20, durationMinutes:15, reverseTextDirection:true },
    { id: 'dhuhrPrayer', label:'صلاة الظهر', sourceKey:'dhuhr', offsetMinutes:0, durationMinutes:10 },
    { id: 'dhuhrSunnah', label:'سنة صلاة الظهر', sourceKey:'dhuhr', offsetMinutes:10, durationMinutes:15 },
    { id: 'afterDhuhrDhikr', label:'الذكر', sourceKey:'dhuhr', offsetMinutes:20, durationMinutes:15 },
    { id: 'quranDaily', label:'الورد اليومي', sourceKey:'dhuhr', offsetMinutes:45, durationMinutes:20 },
    { id: 'dailySupplication', label:'الدعاء', sourceKey:'quranDaily', offsetMinutes:15, durationMinutes:15 },
    { id: 'asrPrayer', label:'صلاة العصر', sourceKey:'asr', offsetMinutes:0, durationMinutes:10 },
  ]
};
const offsetTime = (baseTime, minutes) => new Date(baseTime.getTime() + minutes * MINUTES_IN_MS);
const timeAfterMidnightIfNeeded = (reference, candidate) => {
  if (candidate.getTime() <= reference.getTime()) {
    return new Date(candidate.getTime() + 24 * HOURS_IN_MS);
  }
  return candidate;
};
const calculateMidpoint = (start, end) => {
  const adjustedEnd = timeAfterMidnightIfNeeded(start, end);
  return new Date(start.getTime() + (adjustedEnd.getTime() - start.getTime()) / 2);
};
const resolveEventTime = (key, config, baseTimes, cache, stack = []) => {
  if (cache[key]) return cache[key];
  if (baseTimes[key]) {
    cache[key] = baseTimes[key];
    return cache[key];
  }
  const eventConfig = config.find((event) => event.id === key);
  if (!eventConfig) throw new Error(`Unsupported wheel source key: ${key}`);
  if (stack.includes(key)) throw new Error(`Circular dependency detected when resolving wheel key: ${key}`);
  const sourceTime = resolveEventTime(eventConfig.sourceKey, config, baseTimes, cache, [...stack, key]);
  const resolved = offsetTime(sourceTime, eventConfig.offsetMinutes);
  cache[key] = resolved;
  return resolved;
};
const generateDailyWheel = (prayerTimes) => {
  const baseTimes = {
    fajr: prayerTimes.fajr,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
    sunrise: prayerTimes.sunrise,
    ishaFajrMidpoint: calculateMidpoint(prayerTimes.isha, prayerTimes.fajr),
  };
  const cache = {};
  return prayerWheelConfig.events.map((eventConfig) => {
    const eventStart = resolveEventTime(eventConfig.id, prayerWheelConfig.events, baseTimes, cache);
    const endTime = offsetTime(eventStart, eventConfig.durationMinutes);
    return { id: eventConfig.id, label: eventConfig.label, startTime: eventStart, endTime };
  });
};
const date = new Date('2026-07-29T15:00:00+03:00');
const coords = new Coordinates(24.7136, 46.6753);
const params = CalculationMethod.MuslimWorldLeague();
params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
const prayerTimes = new PrayerTimes(coords, date, params);
const wheelItems = generateDailyWheel(prayerTimes);
console.log('Now:', date.toString());
console.log('Prayer times:');
for (const [key, value] of Object.entries(prayerTimes)) {
  if (value instanceof Date) {
    console.log(key, value.toString());
  }
}
console.log('\nWheel items:');
for (const item of wheelItems) {
  console.log(item.id, item.label, item.startTime.toString(), '->', item.endTime.toString());
}
const active = wheelItems.filter((item) => date.getTime() >= item.startTime.getTime() && date.getTime() < item.endTime.getTime());
console.log('\nActive items at current time:');
for (const item of active) {
  console.log(item.id, item.label, item.startTime.toString(), '->', item.endTime.toString());
}
