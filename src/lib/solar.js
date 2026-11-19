/**
 * Build a Date whose local getHours()/getMinutes() match the wall clock
 * in the given IANA timezone (e.g. Asia/Jakarta for Jawa Kecamatan).
 */
export function wallClockDate(timeZone = 'Asia/Jakarta', base = new Date()) {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = {};
    for (const part of dtf.formatToParts(base)) {
      if (part.type !== 'literal') parts[part.type] = part.value;
    }
    return new Date(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
  } catch {
    return new Date(base);
  }
}

export function solarPhase(localDate, isDayTime, timeZone) {
  const clock = timeZone ? wallClockDate(timeZone, localDate instanceof Date ? localDate : new Date()) : localDate;
  const hour = clock.getHours() + clock.getMinutes() / 60;

  if (hour >= 5 && hour < 7) return 'sunrise';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'sunset';
  if (isDayTime === false && (hour >= 19 || hour < 5)) return 'night';
  if (hour >= 19 || hour < 5) return 'night';
  return 'day';
}

export function phaseLabel(phase) {
  return (
    {
      sunrise: 'Sunrise',
      day: 'Daylight',
      sunset: 'Golden hour',
      night: 'Night',
    }[phase] || phase
  );
}

export function normalizeCondition(weatherText = '', icon = 1) {
  const text = weatherText.toLowerCase();
  if (
    text.includes('thunder') ||
    text.includes('storm') ||
    [15, 16, 17, 41, 42].includes(icon)
  ) {
    return 'thunderstorm';
  }
  if (
    text.includes('rain') ||
    text.includes('shower') ||
    text.includes('drizzle') ||
    (icon >= 12 && icon <= 18) ||
    (icon >= 39 && icon <= 40)
  ) {
    return 'rain';
  }
  if (
    text.includes('partly') ||
    text.includes('mostly sunny') ||
    text.includes('intermittent') ||
    [3, 4, 5].includes(icon)
  ) {
    return 'partly-cloudy';
  }
  if (
    text.includes('cloud') ||
    text.includes('overcast') ||
    text.includes('fog') ||
    text.includes('mist') ||
    (icon >= 6 && icon <= 11)
  ) {
    return 'cloudy';
  }
  return 'clear';
}
