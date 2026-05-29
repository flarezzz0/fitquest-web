// ============================================
// 🔍 VerificationAgent v2 — พร้อม Self-Reflection
// ============================================
// เพิ่ม:
//   - Self-reflection ก่อนส่งผล
//   - Multi-step reasoning
//   - Confidence scoring
//   - Event bus (คุยกับ Agent อื่น)
// ============================================

const BaseAgent = require('./BaseAgent');
const eventBus = require('./event-bus');

class VerificationAgent extends BaseAgent {
  constructor() {
    super('VerificationAgent');

    this.minDurations = {
      cardio: 20, weights: 20, walk: 15, yoga: 20, custom: 5,
    };

    this.activityKeywords = {
      running: ['run', 'running', 'วิ่ง', 'cardio'],
      walking: ['walk', 'walking', 'เดิน', 'step'],
      cycling: ['cycle', 'cycling', 'bike', 'ปั่นจักรยาน'],
      yoga: ['yoga', 'โยคะ', 'stretch'],
      weights: ['weight', 'gym', 'workout', 'เวท'],
    };
  }

  async init() {
    this.eventBus.subscribe('VerificationAgent', [
      'verification.request',
      'image.analysis.done',
    ]);
    console.log('🔍 [VerificationAgent] v2 Ready ✓');
  }

  /**
   * รับ event จาก MainAgent
   * วิเคราะห์ผล OCR + self-reflection
   */
  async onEvent(event) {
    switch (event.type) {
      case 'verification.request':
        return this._handleVerification(event);
      default:
        return { handled: false };
    }
  }

  async _handleVerification(event) {
    const { ocrResult, ocrReflection, expectedActivity, expectedDuration } = event.payload || {};

    console.log('🔍 [VerificationAgent] Analyzing verification...');

    // Multi-step reasoning
    const reasoningSteps = [
      this._stepCheckConfidence,
      this._stepExtractData,
      this._stepValidateDuration,
      this._stepDetectActivity,
    ];

    const reasoningResult = await this.reason(
      { ocrResult, ocrReflection, expectedActivity, expectedDuration },
      reasoningSteps
    );

    const conclusion = reasoningResult.conclusion;

    // Self-reflection
    const reflection = this.reflect(conclusion, {
      ocrConfidence: ocrResult?.confidence,
      expectedActivity,
    });

    // ถ้าความมั่นใจต่ำ → ส่ง event ไปหา AntiCheatAgent
    if (reflection.confidence < 0.5) {
      await this.eventBus.emit(
        EventBus.createEvent({
          type: 'verification.low_confidence',
          from: this.name,
          payload: { ocrResult, expectedActivity },
          confidence: reflection.confidence,
          reasoning: reflection.reasoning,
        }),
        this.agentRefs || {}
      );
    }

    this.logDecision('verification_result', {
      valid: conclusion.valid,
      confidence: reflection.confidence,
      reasoning: reflection.reasoning,
    });

    return {
      valid: conclusion.valid,
      duration: conclusion.duration,
      distance: conclusion.distance,
      calories: conclusion.calories,
      detectedActivity: conclusion.detectedActivity,
      confidence: reflection.confidence > 0.7 ? 'high' : reflection.confidence > 0.4 ? 'medium' : 'low',
      confidenceScore: Math.round(reflection.confidence * 100),
      reasoning: reasoningResult.reasoningChain.map(s => s.output.description),
      message: reflection.passed
        ? `✅ AI ยืนยัน: ${conclusion.duration || expectedDuration}นาที`
        : `⚠️ ความมั่นใจต่ำ (${Math.round(reflection.confidence * 100)}%)`,
    };
  }

  // ===== Reasoning Steps =====
  async _stepCheckConfidence(ctx) {
    const confidence = ctx.ocrResult?.confidence || 0;
    return {
      description: `Check OCR confidence: ${confidence}%`,
      data: { isValid: confidence > 30 },
      conclusion: null,
    };
  }

  async _stepExtractData(ctx) {
    const extracted = ctx.ocrResult?.extracted || {};
    return {
      description: `Extract: duration=${extracted.duration}, distance=${extracted.distance}, calories=${extracted.calories}`,
      data: extracted,
      conclusion: null,
    };
  }

  async _stepValidateDuration(ctx) {
    const duration = ctx.ocrResult?.extracted?.duration || ctx.expectedDuration;
    const min = this.minDurations[ctx.expectedActivity] || 15;
    const valid = duration >= min;
    return {
      description: `Duration ${duration}min >= min ${min}min: ${valid}`,
      data: { duration, validDuration: valid },
      conclusion: null,
    };
  }

  async _stepDetectActivity(ctx) {
    const text = ctx.ocrResult?.rawText || '';
    let detected = 'unknown';

    for (const [type, keywords] of Object.entries(this.activityKeywords)) {
      if (keywords.some(k => text.includes(k))) {
        detected = type;
        break;
      }
    }

    const typeMap = {
      running: 'cardio', walking: 'walk', yoga: 'yoga', cycling: 'cardio', weights: 'weights',
    };
    const mapped = typeMap[detected];
    const validType = mapped === ctx.expectedActivity || detected === 'unknown';

    return {
      description: `Detected: ${detected}, expected: ${ctx.expectedActivity}, match: ${validType}`,
      data: { detectedActivity: detected, validType },
      conclusion: {
        valid: validType,
        duration: ctx.ocrResult?.extracted?.duration || ctx.expectedDuration,
        distance: ctx.ocrResult?.extracted?.distance,
        calories: ctx.ocrResult?.extracted?.calories,
        detectedActivity: detected,
        confidence: (ctx.ocrResult?.confidence || 50) / 100,
      },
    };
  }

  // ===== Self Reflection =====
  reflect(output, context) {
    const { ocrConfidence = 50 } = context;
    let confidence = output.confidence || 0.5;
    const weaknesses = [];

    // Low OCR confidence
    if (ocrConfidence < 50) {
      confidence -= 0.3;
      weaknesses.push('OCR confidence ต่ำ — ภาพอาจไม่ชัดเจน');
    }

    // Unknown activity
    if (output.detectedActivity === 'unknown') {
      confidence -= 0.1;
      weaknesses.push('ไม่สามารถระบุประเภทกิจกรรมจากภาพ');
    }

    // Confidence threshold
    const passed = confidence >= 0.4;

    const adjustedOutput = {
      ...output,
      confidence,
      needsHumanReview: confidence < 0.6,
    };

    return {
      passed,
      confidence: Math.max(0, confidence),
      reasoning: passed
        ? `มั่นใจ ${Math.round(confidence * 100)}%`
        : `มั่นใจต่ำ (${Math.round(confidence * 100)}%)` +
          (weaknesses.length ? `: ${weaknesses[0]}` : ''),
      weaknesses,
      adjustedOutput,
    };
  }
}

module.exports = VerificationAgent;
