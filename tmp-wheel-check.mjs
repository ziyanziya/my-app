import { PrayerTimes, CalculationMethod, Coordinates, HighLatitudeRule } from 'adhan';
const MINUTES_IN_MS = 60 * 1000;
const HOURS_IN_MS = 60 * MINUTES_IN_MS;
const prayerWheelConfig = {
  defaultDurationMinutes: 15,
  events: [
    { id: 'maghribAdhkar', sourceKey:'maghrib', offsetMinutes:-30, durationMinutes:20 },
    { id: 'maghribPrayer', sourceKey:'maghrib', offsetMinutes:0, durationMinutes:10 },
    { id: 'maghribSunnah', sourceKey:'maghrib', offsetMinutes:15, durationMinutes:10 },
    { id: 'ishaPrayer', sourceKey:'isha', offsetMinutes:0, durationMinutes:10 },
    { id: 'surahMalik', sourceKey:'isha', offsetMinutes:15, durationMinutes:15 },
    { id: 'ishaSunnah', sourceKey:'isha', offsetMinutes:30, durationMinutes:10 },
    { id: 'qiyamLayl', sourceKey:'ishaFajrMidpoint', offsetMinutes:0, durationMinutes:45 },
    { id: 'shafWitr', sourceKey:'fajr', offsetMinutes:-180, durationMinutes:15 },
    { id: 'sleepRemembrance', sourceKey:'shafWitr', offsetMinutes:15, durationMinutes:10 },
    { id: 'tahajjudPrayer', sourceKey:'sleepRemembrance', offsetMinutes:10, durationMinutes:45 },
    { id: 'morningSupplication', sourceKey:'tahajjudPrayer', offsetMinutes:45, durationMinutes:15 },
    { id: 'fajrPrayer', sourceKey:'fajr', offsetMinutes:0, durationMinutes:10 },
    { id: 'morningQuran', sourceKey:'fajr', offsetMinutes:15, durationMinutes:20 },
    { id: 'sunnahUmrah', sourceKey:'morningQuran', offsetMinutes:20, durationMinutes:15 },
    { id: 'morningAdhkar', sourceKey:'sunnahUmrah', offsetMinutes:15, durationMinutes:15 },
    { id: 'duhaPrayer', sourceKey:'sunrise', offsetMinutes:20, durationMinutes:10 },
    { id: 'morningDhikrAfterDuha', sourceKey:'duhaPrayer', offsetMinutes:10, durationMinutes:15 },
    { id: 'sunnahZawal', sourceKey:'dhuhr', offsetMinutes:-20, durationMinutes:15 },
    { id: 'dhuhrPrayer', sourceKey:'dhuhr', offsetMinutes:0, durationMinutes:10 },
    { id: 'dhuhrSunnah', sourceKey:'dhuhr', offsetMinutes:10, durationMinutes:15 },
    { id: 'afterDhuhrDhikr', sourceKey:'dhuhr', offsetMinutes:20, durationMinutes:15 },
    { id: 'quranDaily', sourceKey:'dhuhr', offsetMinutes:45, durationMinutes:20 },
    { id: 'dailySupplication', sourceKey:'quranDaily', offsetMinutes:15, durationMinutes:15 },
    { id: 'asrPrayer', sourceKey:'asr', offsetMinutes:0, durationMinutes:10 },
  ]
};
const offsetTime = (baseTime, minutes) => new Date(baseTime.getTime() + minutes * MINUTES_IN_MS);
const timeAfterMidnightIfNeeded = (reference, candidate) => candidate.getTime() <= reference.getTime() ? new Date(candidate.getTime() + 24 * HOURS_IN_MS) : candidate;
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
  if (value instanceof Date) console.log(key, value.toString());
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
