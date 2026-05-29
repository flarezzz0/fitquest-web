// ============================================
// 🛠️ Tool Layer — Agent Tools
// ============================================
// Agent เรียกใช้เครื่องมือเหล่านี้ผ่าน useTool()
// ============================================

const { createWorker } = require('tesseract.js');
const sharedMemory = require('../shared-memory');

// ===== 1. OCR Tool =====
class OCRTool {
  constructor() {
    this.worker = null;
  }

  async init() {
    if (!this.worker) {
      this.worker = await createWorker('eng+tha');
    }
  }

  async execute({ imageBuffer }) {
    console.log('🛠️  [OCRTool] Reading image...');
    const { data } = await this.worker.recognize(imageBuffer);

    const text = data.text.toLowerCase();
    const confidence = data.confidence;

    // Extract values
    const duration = this._extract(text, [
      /(\d+)\s*(?:min|mins|นาที)/i,
      /(\d{2}):(\d{2}):(\d{2})/,
    ]);
    const distance = this._extract(text, [
      /(\d+\.?\d*)\s*(?:km|kilometer|กม)/i,
    ], true);
    const calories = this._extract(text, [
      /(\d+)\s*(?:kcal|cal|calories|แคล)/i,
    ]);

    return {
      success: true,
      rawText: text.substring(0, 1000),
      extracted: { duration, distance, calories },
      confidence: Math.round(confidence),
    };
  }

  _extract(text, patterns, isFloat = false) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.toString().includes('\\d{2}:\\d{2}:\\d{2}')) {
          return parseInt(match[2]) + (parseInt(match[1]) * 60);
        }
        return isFloat ? parseFloat(match[1]) : parseInt(match[1]);
      }
    }
    return null;
  }

  async destroy() {
    if (this.worker) await this.worker.terminate();
  }
}

// ===== 2. Fraud Detection Tool =====
class FraudTool {
  constructor() {
    this.normalRanges = {
      cardio: { duration: { min: 10, max: 180 }, distance: { min: 0.5, max: 42 }, calories: { min: 50, max: 3000 } },
      weights: { duration: { min: 15, max: 240 }, distance: { min: 0, max: 0.5 }, calories: { min: 50, max: 2000 } },
      walk: { duration: { min: 5, max: 360 }, distance: { min: 0.1, max: 30 }, calories: { min: 20, max: 1500 } },
      yoga: { duration: { min: 10, max: 120 }, distance: { min: 0, max: 1 }, calories: { min: 20, max: 500 } },
    };
  }

  execute({ activityId, duration, distance, calories, userId }) {
    console.log('🛠️  [FraudTool] Analyzing...');
    const flags = [];
    let score = 0;

    const range = this.normalRanges[activityId];
    if (range) {
      if (duration > range.duration.max) { flags.push('duration_exceeds_max'); score += 15; }
      if (duration < range.duration.min) { flags.push('duration_below_min'); score += 5; }
      if (distance > range.distance.max) { flags.push('distance_exceeds_max'); score += 20; }
      if (calories > range.calories.max) { flags.push('calories_exceeds_max'); score += 10; }
    }

    // Speed check
    if (duration && distance > 0) {
      const speed = distance / (duration / 60);
      if (speed > 25) { flags.push('speed_unrealistic'); score += 25; }
    }

    // User history check
    if (userId) {
      const user = sharedMemory.getUser(userId);
      const fraudScore = sharedMemory.getFraudScore(userId);
      if (fraudScore > 50) { flags.push('user_fraud_history'); score += fraudScore * 0.2; }
    }

    return { fraudScore: Math.round(score), flags, passed: score < 50 };
  }
}

// ===== 3. Reward Calculator Tool =====
class RewardTool {
  constructor() {
    this.baseRates = { cardio: 10, weights: 12, walk: 3, yoga: 6, custom: 1 };
    this.streakMultRules = [
      { min: 0, max: 3, mult: 1 },
      { min: 4, max: 7, mult: 1.5 },
      { min: 8, max: Infinity, mult: 2 },
    ];
  }

  execute({ activityId, duration, streak }) {
    console.log('🛠️  [RewardTool] Calculating...');
    let base = this.baseRates[activityId] || 0;
    if (activityId === 'custom' && duration) base = Math.floor(duration / 5);

    const mult = this._getStreakMult(streak || 0);
    const bonus = Math.round(base * (mult - 1));
    const total = base + bonus;

    return { baseCoins: base, streakMultiplier: mult, streakBonus: bonus, totalCoins: total };
  }

  _getStreakMult(streak) {
    for (const r of this.streakMultRules) {
      if (streak >= r.min && streak <= r.max) return r.mult;
    }
    return 1;
  }
}

// ===== 4. Image Analysis Tool =====
class ImageAnalysisTool {
  async execute({ imageBuffer }) {
    console.log('🛠️  [ImageAnalysis] Analyzing image properties...');
    try {
      const sharp = require('sharp');
      const meta = await sharp(imageBuffer).metadata();
      const stats = await sharp(imageBuffer).stats();

      return {
        success: true,
        width: meta.width,
        height: meta.height,
        format: meta.format,
        size: meta.size,
        hasAlpha: meta.hasAlpha,
        channels: meta.channels,
        averageBrightness: stats.channels ? Math.round(stats.channels.reduce((s, c) => s + c.mean, 0) / stats.channels.length) : null,
        isBlurry: (meta.width < 200 || meta.height < 200),
        isHighQuality: (meta.width >= 800 && meta.size < 5 * 1024 * 1024),
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

// ===== 5. Notification Tool =====
class NotificationTool {
  execute({ title, body, type = 'info' }) {
    console.log(`🛠️  [Notification] ${type}: ${title} — ${body}`);
    // ใน production จะส่ง push notification / webhook
    return { sent: true, title, body };
  }
}

module.exports = { OCRTool, FraudTool, RewardTool, ImageAnalysisTool, NotificationTool };
