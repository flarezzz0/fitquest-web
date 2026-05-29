// ============================================
// 🧠 MainAgent v2 — Game Master + Planner
// ============================================
// พัฒนาจาก rule-based pipeline → Autonomous Planner
// เชื่อมต่อทุก Agent + Event Bus + Tools
// ============================================

const BaseAgent = require('./BaseAgent');
const eventBus = require('./event-bus');
const sharedMemory = require('./shared-memory');

class MainAgent extends BaseAgent {
  constructor({ ocrTool, fraudTool, rewardTool, imageAnalysisTool, notificationTool }) {
    super('MainAgent');

    // Register tools
    this.registerTool('ocr', ocrTool);
    this.registerTool('fraud', fraudTool);
    this.registerTool('reward', rewardTool);
    this.registerTool('image_analysis', imageAnalysisTool);
    this.registerTool('notification', notificationTool);
  }

  async init(agentRefs = {}) {
    this.agentRefs = agentRefs;

    // Subscribe to events
    this.eventBus.subscribe('MainAgent', [
      'verification.done',
      'anti_cheat.done',
      'reward.calculated',
      'moderation.done',
      'agent.error',
    ]);

    console.log('🧠 [MainAgent] v2 Planner Ready ✓');
  }

  /**
   * Dynamic Planning — สร้างแผนตามสถานการณ์
   * แทน step1()->step2()->step3() แบบตายตัว
   */
  async processActivity({ activityId, imageBuffer, imageHash, duration, distance, calories, userId }) {
    console.log(`\n🧠 [MainAgent] Planning flow for: ${activityId}`);

    const startTime = Date.now();
    const user = sharedMemory.getUser(userId);
    const session = sharedMemory.getSession(`session_${userId}`);

    const result = {
      activityId, duration, distance, calories,
      verification: null,
      antiCheat: null,
      moderation: null,
      reward: null,
      recommendation: null,
      totalCoins: 0,
      status: 'pending',
      messages: [],
      processingTime: 0,
      reasoning: [],
    };

    try {
      // ===== STEP 1: Moderation Check =====
      result.messages.push('👮 Checking content...');
      const moderation = await this.agentRefs.moderation.onEvent({
        type: 'moderation.request', from: this.name,
        payload: { imageBuffer }
      });
      result.moderation = moderation;
      result.messages.push(moderation.message || 'Content check done');

      if (moderation.passed === false) {
        return this._fail(result, 'rejected_moderation', '🚫 รูปไม่ผ่านการตรวจสอบ Content', startTime);
      }

      // ===== STEP 2: Dynamic Fraud Analysis =====
      result.messages.push('🚨 Running anti-cheat analysis...');
      const fraudResult = await this.useTool('fraud', {
        activityId, duration, distance, calories, userId
      });

      result.antiCheat = fraudResult;

      // Self-reflection on fraud result
      const fraudReflection = this._reflectOnFraud(fraudResult, user);
      result.reasoning.push(fraudReflection);

      if (fraudReflection.action === 'reject') {
        sharedMemory.recordFraudAttempt(userId, { activityId, score: fraudResult.fraudScore });
        await this.eventBus.emit(
          EventBus.createEvent({
            type: 'fraud.detected', from: this.name,
            payload: { userId, detail: `Fraud score ${fraudResult.fraudScore}`, score: fraudResult.fraudScore }
          }),
          this.agentRefs
        );
        return this._fail(result, 'rejected_cheat',
          `🚨 ${fraudReflection.reasoning} (Score: ${fraudResult.fraudScore})`, startTime);
      }

      if (fraudReflection.action === 'flag') {
        result.messages.push(`⚠️ ${fraudReflection.reasoning}`);
      }

      // ===== STEP 3: Verification with OCR Tool =====
      result.messages.push('🔍 Running OCR verification...');
      const ocrResult = await this.useTool('ocr', { imageBuffer });

      // Self-reflection on OCR
      const ocrReflection = this._reflectOnOCR(ocrResult, activityId, duration);
      result.reasoning.push(ocrReflection);

      const verificationPayload = {
        ocrResult,
        ocrReflection,
        expectedActivity: activityId,
        expectedDuration: duration,
      };

      const verification = await this.agentRefs.verification.onEvent({
        type: 'verification.request', from: this.name,
        payload: verificationPayload,
      });
      result.verification = verification;
      result.messages.push(verification.message || 'Verification done');

      if (!verification.valid) {
        // ถ้า OCR confidence ต่ำ → ขออัปโหลดใหม่แทน reject ทันที
        if (ocrResult.confidence < 40) {
          return this._fail(result, 'retry_needed',
            '📸 รูปไม่ชัด กรุณาถ่ายใหม่', startTime);
        }
        return this._fail(result, 'rejected_verification',
          '❌ ข้อมูลไม่ตรงกับกิจกรรม', startTime);
      }

      // ===== STEP 4: Calculate Reward =====
      result.messages.push('🪙 Calculating reward...');
      const rewardPayload = {
        activityId,
        duration: ocrResult.extracted?.duration || duration,
        streak: user.currentStreak || 0,
      };
      const reward = await this.useTool('reward', rewardPayload);
      result.reward = reward;
      result.totalCoins = reward.totalCoins;

      // Send event to MemoryAgent
      await this.eventBus.emit(
        EventBus.createEvent({
          type: 'activity.completed', from: this.name,
          payload: {
            userId, activityId,
            coins: reward.totalCoins,
            duration, streak: user.currentStreak,
          }
        }),
        this.agentRefs
      );

      // ===== STEP 5: Recommendation =====
      result.messages.push('🎯 Generating recommendations...');
      const recommendation = await this.agentRefs.recommendation.onEvent({
        type: 'recommendation.request', from: this.name,
        payload: { userId, activityId }
      });
      result.recommendation = recommendation;

      // ===== FINALIZE =====
      result.status = 'approved';
      result.messages.push(`✅ ผ่าน! ได้รับ ${result.totalCoins} 🪙`);
      result.processingTime = Date.now() - startTime;

      // Log decision
      this.logDecision('activity_approved', {
        activityId, coins: reward.totalCoins, time: result.processingTime
      });

    } catch (error) {
      console.error('🧠 [MainAgent] Error:', error);
      result.status = 'error';
      result.messages.push(`❌ Error: ${error.message}`);
      result.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Reflection: วิเคราะห์ผล Fraud
   */
  _reflectOnFraud(fraudResult, user) {
    const fraudHistory = user.fraudHistory || [];
    const recentFrauds = fraudHistory.filter(f =>
      Date.now() - f.timestamp < 7 * 24 * 60 * 60 * 1000
    );

    if (fraudResult.fraudScore >= 50) {
      return {
        action: 'reject',
        reasoning: `Fraud score ${fraudResult.fraudScore}: ${fraudResult.flags.join(', ')}`,
        confidence: 0.95,
      };
    }

    if (fraudResult.fraudScore >= 20) {
      if (recentFrauds.length > 2) {
        return {
          action: 'reject',
          reasoning: `Fraud score ${fraudResult.fraudScore} + user has ${recentFrauds.length} recent fraud attempts`,
          confidence: 0.85,
        };
      }
      return {
        action: 'flag',
        reasoning: `Fraud score ${fraudResult.fraudScore} — monitor`,
        confidence: 0.6,
      };
    }

    return {
      action: 'pass',
      reasoning: `No anomalies (score: ${fraudResult.fraudScore})`,
      confidence: 0.98,
    };
  }

  /**
   * Reflection: วิเคราะห์ผล OCR
   */
  _reflectOnOCR(ocrResult, expectedActivity, expectedDuration) {
    const { confidence, extracted } = ocrResult;

    if (confidence < 30) {
      return {
        action: 'fail',
        reasoning: `OCR confidence ต่ำมาก (${confidence}%) — ภาพอาจเบลอหรือไม่ใช่ Screenshot`,
        confidence: confidence / 100,
      };
    }

    if (confidence < 60) {
      return {
        action: 'flag',
        reasoning: `OCR confidence ปานกลาง (${confidence}%) — ควรตรวจสอบด้วยตนเอง`,
        confidence: confidence / 100,
      };
    }

    // ตรวจสอบ duration ที่อ่านได้กับที่คาดหวัง
    if (extracted?.duration && expectedDuration) {
      const ratio = extracted.duration / expectedDuration;
      if (ratio < 0.5) {
        return {
          action: 'flag',
          reasoning: `Duration จาก OCR (${extracted.duration}min) น้อยกว่าที่คาด (${expectedDuration}min) มาก`,
          confidence: 0.5,
        };
      }
    }

    return {
      action: 'pass',
      reasoning: `OCR confidence ${confidence}% — reliable`,
      confidence: confidence / 100,
    };
  }

  /**
   * สร้าง response fail
   */
  _fail(result, status, message, startTime) {
    result.status = status;
    result.messages.push(message);
    result.processingTime = Date.now() - startTime;
    this.logDecision('activity_rejected', { status, message });
    return result;
  }

  /**
   * Chat with planning awareness
   */
  async chat(message, context = {}) {
    const msg = message.toLowerCase();
    const user = sharedMemory.getUser(context.userId || 'default');

    // Intent matching with context
    if (msg.includes('แต้ม') || msg.includes('coin') || msg.includes('เหรียญ')) {
      const recSuggestion = this.memory.suggestRecovery(user.id);
      return {
        type: 'info',
        text: `💰 ${user.totalCoins} 🪙\n💪 ${user.totalWorkouts} ครั้ง\n🔥 Streak ${user.currentStreak || 0} วัน` +
              (recSuggestion ? `\n\n💡 ${recSuggestion}` : ''),
        context: { coins: user.totalCoins, workouts: user.totalWorkouts, streak: user.currentStreak },
      };
    }

    if (msg.includes('แนะนำ') || msg.includes('ทำไร') || msg.includes('should')) {
      const fav = user.favoriteActivities[0];
      const recovery = this.memory.suggestRecovery(user.id);

      let text = '🎯 คำแนะนำ:\n';
      if (fav) text += `• คุณชอบ "${fav}" — ลองทำต่อเนื่อง!\n`;
      if (recovery) text += `• ${recovery}\n`;
      text += `• ตั้งเป้าอาทิตย์ละ 3-4 ครั้ง\n`;
      text += `• ครบทุกประเภทได้โบนัส 25 🪙`;

      return { type: 'recommendation', text };
    }

    if (msg.includes('level') || msg.includes('เลเวล')) {
      const nextLevelCoins = [100, 250, 500, 1000].find(c => c > user.totalCoins) || 'MAX';
      return {
        type: 'info',
        text: `⬆️ LV.${user.level} | สะสม ${user.totalCoins} 🪙\n🎯 เลเวลถัดไป: ${nextLevelCoins}`,
      };
    }

    if (msg.includes('สรุป') || msg.includes('summary') || msg.includes('report')) {
      const summary = {
        total: user.totalWorkouts,
        streak: user.currentStreak,
        longestStreak: user.longestStreak || user.currentStreak,
        coins: user.totalCoins,
        favorite: user.favoriteActivities[0] || 'ยังไม่มี',
        fraudAttempts: user.fraudHistory.length,
      };

      return {
        type: 'summary',
        text: `📊 สรุปของคุณ:\n` +
              `• 🏋️ ออกกำลังกาย ${summary.total} ครั้ง\n` +
              `• 🔥 Streak ${summary.streak} วัน\n` +
              `• 👑 Streak สูงสุด ${summary.longestStreak} วัน\n` +
              `• 🪙 สะสม ${summary.coins} เหรียญ\n` +
              `• ⭐ ชอบ ${summary.favorite}\n` +
              `• 🛡️ พยายามโกง ${summary.fraudAttempts} ครั้ง`,
        summary,
      };
    }

    return {
      type: 'chat',
      text: `🤖 FitQuest Game Master!\n` +
            `ถามได้: แต้ม / แนะนำ / เลเวล / สรุป / สถิติ\n` +
            `💡 ฉันจำพฤติกรรมคุณได้นะ!`,
    };
  }

  /**
   * รับ event จาก Agent อื่น
   */
  async onEvent(event) {
    console.log(`🧠 [MainAgent] Received: ${event.type} from ${event.from}`);
    this.logDecision('received_event', { type: event.type, from: event.from });

    if (event.type === 'agent.error') {
      return { handled: true, action: 'notify_user', message: `Agent ${event.from} มีปัญหา: ${event.payload?.error}` };
    }

    return { handled: true, action: 'acknowledged' };
  }
}

module.exports = MainAgent;
