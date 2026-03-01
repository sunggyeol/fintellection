const US_MARKET_TZ = "America/New_York";
const OPEN_MINUTES = 9 * 60 + 30; // 9:30 AM ET
const CLOSE_MINUTES = 16 * 60; // 4:00 PM ET
const ONE_MINUTE_MS = 60_000;
const SAFETY_BUFFER_MS = 30_000;

type NyParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

function getNyParts(date: Date): NyParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: US_MARKET_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  const weekdayRaw = map.get("weekday");
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  if (!weekdayRaw || weekdayMap[weekdayRaw] === undefined) {
    throw new Error(`Unexpected weekday from Intl formatter: ${weekdayRaw ?? "unknown"}`);
  }

  return {
    year: Number(map.get("year")),
    month: Number(map.get("month")),
    day: Number(map.get("day")),
    hour: Number(map.get("hour")),
    minute: Number(map.get("minute")),
    weekday: weekdayMap[weekdayRaw],
  };
}

function isWeekday(weekday: number): boolean {
  return weekday >= 1 && weekday <= 5;
}

function dayOfWeek(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function addDays(year: number, month: number, day: number, days: number): {
  year: number;
  month: number;
  day: number;
} {
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function nextBusinessDate(year: number, month: number, day: number): {
  year: number;
  month: number;
  day: number;
} {
  let candidate = addDays(year, month, day, 1);
  while (!isWeekday(dayOfWeek(candidate.year, candidate.month, candidate.day))) {
    candidate = addDays(candidate.year, candidate.month, candidate.day, 1);
  }
  return candidate;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(map.get("year")),
    Number(map.get("month")) - 1,
    Number(map.get("day")),
    Number(map.get("hour")),
    Number(map.get("minute")),
    Number(map.get("second"))
  );
  return asUtc - date.getTime();
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const offsetA = getTimeZoneOffsetMs(new Date(naiveUtc), timeZone);
  let timestamp = naiveUtc - offsetA;

  // Second pass handles DST transitions around the target day.
  const offsetB = getTimeZoneOffsetMs(new Date(timestamp), timeZone);
  if (offsetB !== offsetA) {
    timestamp = naiveUtc - offsetB;
  }

  return new Date(timestamp);
}

export function isUsRegularSessionOpen(now = new Date()): boolean {
  const ny = getNyParts(now);
  if (!isWeekday(ny.weekday)) return false;

  const minutes = ny.hour * 60 + ny.minute;
  return minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;
}

export function getNextUsRegularSessionOpen(now = new Date()): Date {
  const ny = getNyParts(now);
  const minutes = ny.hour * 60 + ny.minute;

  let target = { year: ny.year, month: ny.month, day: ny.day };
  if (!isWeekday(ny.weekday)) {
    // Weekend: advance to next Monday.
    while (!isWeekday(dayOfWeek(target.year, target.month, target.day))) {
      target = addDays(target.year, target.month, target.day, 1);
    }
  } else if (minutes >= OPEN_MINUTES) {
    // If market is currently open or already closed, next open is next business day.
    target = nextBusinessDate(target.year, target.month, target.day);
  }

  const nextOpen = zonedTimeToUtc(
    target.year,
    target.month,
    target.day,
    9,
    30,
    US_MARKET_TZ
  );

  if (nextOpen.getTime() <= now.getTime()) {
    const fallback = nextBusinessDate(target.year, target.month, target.day);
    return zonedTimeToUtc(fallback.year, fallback.month, fallback.day, 9, 30, US_MARKET_TZ);
  }

  return nextOpen;
}

export function getOffHoursFreezeTtlMs(now = new Date(), minMs = ONE_MINUTE_MS): number {
  if (isUsRegularSessionOpen(now)) return minMs;

  const nextOpen = getNextUsRegularSessionOpen(now);
  const ttl = nextOpen.getTime() - now.getTime() + SAFETY_BUFFER_MS;
  return Math.max(minMs, ttl);
}

