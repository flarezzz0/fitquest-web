// ============================================================
// Client-side Anti-Cheat Engine v2
// Many detection layers + weighted scoring + pattern analysis
// ============================================================

export interface WorkoutLogEntry {
  activityId?: string;
  imageUri?: string;
  date: string;
  duration?: number;
  fraudScore?: number;
}

export interface SessionMetadata {
  deviceMotionAvailable?: boolean;
  gpsAvailable?: boolean;
  appForegroundTime?: number;
  screenOnDuration?: number;
}

export interface AntiCheatResult {
  passed: boolean;
  fraudScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  flags: AntiCheatFlag[];
  summary: string;
}

export interface AntiCheatFlag {
  code: string;
  weight: number;
  detail: string;
}

const ACTIVITY_CONFIG: Record<string, { minDuration: number; maxDuration: number; maxPerDay: number }> = {
  cardio: { minDuration: 10, maxDuration: 180, maxPerDay: 3 },
  weights: { minDuration: 10, maxDuration: 240, maxPerDay: 3 },
  walk: { minDuration: 5, maxDuration: 360, maxPerDay: 4 },
  yoga: { minDuration: 10, maxDuration: 120, maxPerDay: 2 },
  default: { minDuration: 5, maxDuration: 180, maxPerDay: 4 },
};

const FW = {
  DURATION_TOO_SHORT: 25,
  DURATION_TOO_LONG: 15,
  EXACT_DUPLICATE_IMAGE: 45,
  SIMILAR_IMAGE_HASH: 30,
  DAILY_LIMIT_EXCEEDED: 20,
  TOO_FREQUENT_30S: 15,
  TOO_FREQUENT_2MIN: 8,
  SUSPICIOUS_BURST: 25,
  DURATION_MISMATCH_PATTERN: 20,
  NO_FOREGROUND_TIME: 35,
  FOREGROUND_TIME_MISMATCH: 25,
  PRIOR_HIGH_FRAUD_PATTERN: 20,
};

export function runClientAntiCheat(input: {
  activityId: string;
  duration: number;
  imageUri: string;
  workoutLog: WorkoutLogEntry[];
  metadata?: SessionMetadata;
}): AntiCheatResult {
  const { activityId, duration, imageUri, workoutLog, metadata } = input;
  const flags: AntiCheatFlag[] = [];
  const config = ACTIVITY_CONFIG[activityId] ?? ACTIVITY_CONFIG.default;
  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Duration
  if (duration < config.minDuration) flags.push({ code: "DURATION_TOO_SHORT", weight: FW.DURATION_TOO_SHORT, detail: `${duration}m < min ${config.minDuration}m` });
  if (duration > config.maxDuration) flags.push({ code: "DURATION_TOO_LONG", weight: FW.DURATION_TOO_LONG, detail: `${duration}m > max ${config.maxDuration}m` });

  // 2a. Exact duplicate image
  const exactDups = workoutLog.filter((l) => l.imageUri && l.imageUri === imageUri);
  if (exactDups.length > 0) flags.push({ code: "EXACT_DUPLICATE_IMAGE", weight: FW.EXACT_DUPLICATE_IMAGE, detail: `URI matched ${exactDups.length} log(s)` });

  // 2b. Similar filename pattern
  const base = imageUri.replace(/[_\-]\d+(\.\w+)$/, "$1").replace(/\d+(\.\w+)$/, "$1");
  const similar = workoutLog.filter((l) => l.imageUri && l.imageUri !== imageUri && l.imageUri.replace(/[_\-]\d+(\.\w+)$/, "$1").replace(/\d+(\.\w+)$/, "$1") === base);
  if (similar.length >= 2) flags.push({ code: "SIMILAR_IMAGE_HASH", weight: FW.SIMILAR_IMAGE_HASH, detail: `${similar.length} files share base "${base}"` });

  // 3. Daily frequency
  const todayLogs = workoutLog.filter((l) => l.date.startsWith(todayStr));
  if (todayLogs.length >= config.maxPerDay) flags.push({ code: "DAILY_LIMIT_EXCEEDED", weight: FW.DAILY_LIMIT_EXCEEDED, detail: `${todayLogs.length}/${config.maxPerDay} today` });

  // 4. Time proximity
  const recent = workoutLog.map((l) => ({ ...l, ts: new Date(l.date).getTime() })).sort((a, b) => b.ts - a.ts);
  if (recent.length > 0) {
    const diff = now - recent[0].ts;
    if (diff < 30000) flags.push({ code: "TOO_FREQUENT_30S", weight: FW.TOO_FREQUENT_30S, detail: `${Math.round(diff / 1000)}s ago` });
    else if (diff < 120000) flags.push({ code: "TOO_FREQUENT_2MIN", weight: FW.TOO_FREQUENT_2MIN, detail: `${Math.round(diff / 1000)}s ago` });
  }

  // 5. Burst pattern - 3+ sessions in 10 min
  const burst = recent.filter((l) => l.ts > now - 600000);
  if (burst.length >= 3) flags.push({ code: "SUSPICIOUS_BURST", weight: FW.SUSPICIOUS_BURST, detail: `${burst.length} sessions in 10 min` });

  // 6. Bot-like identical duration
  if (workoutLog.length >= 4) {
    const same = workoutLog.filter((l) => l.duration === duration).length;
    if (same >= 4) flags.push({ code: "DURATION_MISMATCH_PATTERN", weight: FW.DURATION_MISMATCH_PATTERN, detail: `Duration ${duration}m appears in ${same} sessions` });
  }

  // 7. Metadata checks
  if (metadata) {
    if (metadata.appForegroundTime !== undefined && metadata.appForegroundTime < 30)
      flags.push({ code: "NO_FOREGROUND_TIME", weight: FW.NO_FOREGROUND_TIME, detail: `Foreground only ${metadata.appForegroundTime}s` });
    if (metadata.appForegroundTime !== undefined && metadata.appForegroundTime < duration * 60 * 0.3)
      flags.push({ code: "FOREGROUND_TIME_MISMATCH", weight: FW.FOREGROUND_TIME_MISMATCH, detail: `Foreground ${metadata.appForegroundTime}s < ${Math.round(duration * 60 * 0.3)}s expected` });
  }

  // 8. Prior high fraud pattern
  const priorHigh = workoutLog.filter((l) => (l.fraudScore ?? 0) >= 40).length;
  if (priorHigh >= 2) flags.push({ code: "PRIOR_HIGH_FRAUD_PATTERN", weight: FW.PRIOR_HIGH_FRAUD_PATTERN, detail: `${priorHigh} prior high-fraud sessions` });

  // Score
  const rawScore = flags.reduce((sum, f) => sum + f.weight, 0);
  const fraudScore = Math.min(100, rawScore);
  const riskLevel: AntiCheatResult["riskLevel"] = fraudScore >= 75 ? "critical" : fraudScore >= 50 ? "high" : fraudScore >= 20 ? "medium" : "low";
  const passed = riskLevel !== "high" && riskLevel !== "critical";
  const summary = flags.length === 0 ? "✅ No suspicious activity detected." : `⚠️ ${flags.length} flag(s): ${flags.map((f) => f.code).join(", ")}`;

  return { passed, fraudScore, riskLevel, flags, summary };
}
