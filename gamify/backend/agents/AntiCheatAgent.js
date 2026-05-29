// ============================================
// 🚨 AntiCheatAgent v2 — Multi-Step Reasoning
// ============================================
// เพิ่ม:
//   - Multi-step reasoning
//   - Self-reflection
//   - Pattern recognition
//   - คุยกับ MemoryAgent
// ============================================

const BaseAgent = require('./BaseAgent');
const eventBus = require('./event-bus');

class AntiCheatAgent extends BaseAgent {
  constructor() {
    super('AntiCheatAgent');
    this.knownHashes = new Set();
    this.recentActivities = [];
    this.normalRanges = {
      cardio: { duration: { min: 10, max: 180 }, distance: { min: 0.5, max: 42 }, calories: { min: 50, max: 3000 } },
      weights: { duration: { min: 15, max: 240 }, distance: { min: 0, max: 0.5 }, calories: { min: 50, max: 2000 } },
      walk: { duration: { min: 5, max: 360 }, distance: { min: 0.1, max: 30 }, calories: { min: 20, max: 1500 } },
      yoga: { duration: { min: 10, max: 120 }, distance: { min: 0, max: 1 }, calories: { min: 20, max: 500 } },
    };
  }

  async init() {
    this.eventBus.subscribe('AntiCheatAgent', [
      'verification.low_confidence',
      'fraud.request',
    ]);
    console.log('🚨 [AntiCheatAgent] v2 Ready ✓');
  }

  /**
   * รับ event
   */
  async onEvent(event) {
    switch (event.type) {
      case 'fraud.request':
        return this._handleFraudCheck(event);
      case 'verification.low_confidence':
        return this._handleLowConfidence(event);
      default:
        return { handled: false };
    }
  }

  /**
   * ตรวจสอบ fraud ด้วย multi-step reasoning
   */
  async _handleFraudCheck(event) {
    const { activityId, duration, distance, calories, imageHash, userId } = event.payload || {};

    console.log('🚨 [AntiCheatAgent] Multi-step fraud analysis...');

    const steps = [
      this._stepDuplicateCheck.bind(this),
      this._stepValueCheck.bind(this),
      this._stepSpeedCheck.bind(this),
      this._stepFrequencyCheck.bind(this),
      this._stepUserHistoryCheck.bind(this),
      this._stepConclusion.bind(this),
    ];

    const reasoningResult = await this.reason(
      { activityId, duration, distance, calories, imageHash, userId },
      steps
    );

    const conclusion = reasoningResult.conclusion;

    // Self-reflection
    const reflection = this.reflect(conclusion, { userId });

    this.logDecision('fraud_analysis', {
      score: conclusion.fraudScore,
      risk: conclusion.riskLevel,
      reasoning: reasoningResult.reasoningChain.map(s => s.output.description),
    });

    // ถ้าเจอความเสี่ยง → แจ้ง MainAgent ผ่าน Event Bus
    if (conclusion.riskLevel === 'high') {
      await this.eventBus.emit(
        EventBus.createEvent({
          type: 'fraud.detected',
          from: this.name,
          payload: { userId, activityId, score: conclusion.fraudScore, flags: conclusion.flags },
          confidence: reflection.confidence,
          reasoning: reflection.reasoning,
        }),
        this.agentRefs || {}
      );
    }

    return {
      fraudScore: conclusion.fraudScore,
      riskLevel: conclusion.riskLevel,
      flags: conclusion.flags,
      passed: conclusion.riskLevel !== 'high',
      confidence: reflection.confidence,
      reasoning: reasoningResult.reasoningChain,
      message: this._buildMessage(conclusion),
    };
  }

  // ===== Reasoning Steps =====
  async _stepDuplicateCheck(ctx) {
    const isDuplicate = ctx.imageHash && this.knownHashes.has(ctx.imageHash);
    return {
      description: `Duplicate check: ${isDuplicate ? '⚠️ DUPLICATE' : '✅ new'}`,
      data: { isDuplicate, score: isDuplicate ? 40 : 0 },
      conclusion: null,
    };
  }

  async _stepValueCheck(ctx) {
    const range = this.normalRanges[ctx.activityId];
    if (!range) return { description: 'No range for activity', data: { score: 0 }, conclusion: null };

    let score = 0;
    if (ctx.duration > range.duration.max) score += 15;
    if (ctx.duration < range.duration.min) score += 5;
    if (ctx.distance > range.distance.max) score += 20;
    if (ctx.calories > range.calories.max) score += 10;

    return {
      description: `Value check score: ${score}`,
      data: { valueScore: score },
      conclusion: null,
    };
  }

  async _stepSpeedCheck(ctx) {
    if (!ctx.duration || !ctx.distance || ctx.distance <= 0) {
      return { description: 'No speed data', data: { score: 0 }, conclusion: null };
    }
    const speed = ctx.distance / (ctx.duration / 60);
    const score = speed > 40 ? 30 : speed > 25 ? 25 : 0;
    return {
      description: `Speed ${speed.toFixed(1)}km/h → score ${score}`,
      data: { speedScore: score, speed },
      conclusion: null,
    };
  }

  async _stepFrequencyCheck(ctx) {
    const recent = this.recentActivities.filter(a =>
      Date.now() - a.timestamp < 5 * 60 * 1000
    );
    const score = recent.length > 2 ? 15 : 0;
    return {
      description: `Recent ${recent.length} activities in 5min → score ${score}`,
      data: { freqScore: score },
      conclusion: null,
    };
  }

  async _stepUserHistoryCheck(ctx) {
    if (!ctx.userId) return { description: 'No user history', data: { score: 0 }, conclusion: null };

    const user = this.memory.getUser(ctx.userId);
    const fraudCount = user.fraudHistory.filter(f =>
      Date.now() - f.timestamp < 7 * 24 * 60 * 60 * 1000
    ).length;
    const score = Math.min(20, fraudCount * 5);

    return {
      description: `User fraud history: ${fraudCount} recent → score ${score}`,
      data: { historyScore: score },
      conclusion: null,
    };
  }

  async _stepConclusion(ctx) {
    const score = (ctx._step1?.score || 0) +
                  (ctx._step2?.valueScore || 0) +
                  (ctx._step3?.speedScore || 0) +
                  (ctx._step4?.freqScore || 0) +
                  (ctx._step5?.historyScore || 0);

    const flags = [];
    if (ctx._step1?.isDuplicate) flags.push('duplicate_image');
    if (ctx._step2?.valueScore > 10) flags.push('anomalous_values');
    if (ctx._step3?.speedScore > 20) flags.push('speed_unrealistic');
    if (ctx._step4?.freqScore > 10) flags.push('too_frequent');

    let riskLevel = 'low';
    if (score >= 50) riskLevel = 'high';
    else if (score >= 20) riskLevel = 'medium';

    // บันทึก hash
    if (ctx.imageHash && score < 20) {
      this.knownHashes.add(ctx.imageHash);
    }

    // Cleanup
    this.recentActivities = this.recentActivities.filter(a =>
      Date.now() - a.timestamp < 24 * 60 * 60 * 1000
    );

    return {
      description: `Final: score=${score}, risk=${riskLevel}, flags=${flags.join(',') || 'none'}`,
      data: {},
      conclusion: { fraudScore: score, riskLevel, flags },
    };
  }

  // ===== Self Reflection =====
  reflect(output, context) {
    const { fraudScore, riskLevel, flags } = output;
    let confidence = 0.9;

    const weaknesses = [];

    if (riskLevel === 'medium') {
      confidence -= 0.2;
      weaknesses.push('medium risk — monitor');
    }

    if (flags.length > 1) {
      confidence -= 0.1;
    }

    const passed = riskLevel !== 'high';

    return {
      passed,
      confidence: Math.max(0.3, confidence),
      reasoning: passed
        ? `Fraud score ${fraudScore} (${riskLevel})`
        : `High risk ${fraudScore}: ${flags.join(', ')}`,
      weaknesses,
      adjustedOutput: output,
    };
  }

  /**
   * เมื่อ VerificationAgent ส่งว่า confidence ต่ำ
   */
  async _handleLowConfidence(event) {
    const { ocrResult, expectedActivity } = event.payload || {};

    console.log('🚨 [AntiCheatAgent] Received low confidence alert from Verification');

    // ตรวจสอบเพิ่มเติม
    const fraudCheck = await this._handleFraudCheck({
      type: 'fraud.request',
      payload: {
        activityId: expectedActivity,
        duration: ocrResult?.extracted?.duration,
        distance: ocrResult?.extracted?.distance,
        calories: ocrResult?.extracted?.calories,
      },
    });

    // ส่งผลกลับ
    await this.eventBus.emit(
      EventBus.createEvent({
        type: 'anti_cheat.cross_check',
        from: this.name,
        payload: fraudCheck,
        confidence: fraudCheck.confidence,
        reasoning: fraudCheck.reasoning?.map(r => r.description).join(' → '),
      }),
      this.agentRefs || {}
    );

    return fraudCheck;
  }

  _buildMessage(conclusion) {
    if (conclusion.riskLevel === 'high') {
      return `🚨 พบความผิดปกติสูง! Score ${conclusion.fraudScore}: ${conclusion.flags.join(', ')}`;
    }
    if (conclusion.riskLevel === 'medium') {
      return `⚠️ พบความผิดปกติเล็กน้อย (Score ${conclusion.fraudScore})`;
    }
    return `✅ ปลอดภัย (Fraud Score: ${conclusion.fraudScore})`;
  }

  loadHashes(hashes) {
    hashes.forEach(h => this.knownHashes.add(h));
  }
}

module.exports = AntiCheatAgent;
