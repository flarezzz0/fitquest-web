// ============================================
// 🧠 MemoryAgent — ระบบความจำ
// ============================================
// หน้าที่:
//   - จำพฤติกรรมผู้ใช้
//   - บันทึกประวัติ Agent
//   - สรุปข้อมูลให้ Agent อื่น
//   - Personalization
// ============================================

const BaseAgent = require('./BaseAgent');
const sharedMemory = require('./shared-memory');
const eventBus = require('./event-bus');

class MemoryAgent extends BaseAgent {
  constructor() {
    super('MemoryAgent');
    this.userCache = new Map();
  }

  async init() {
    this.eventBus.subscribe('MemoryAgent', [
      'activity.completed',
      'user.query',
      'fraud.detected',
      'reward.claimed',
      'memory.request',
    ]);
    console.log('🧠 [MemoryAgent] Ready ✓');
  }

  /**
   * รับ event จาก Agent อื่น
   */
  async onEvent(event) {
    switch (event.type) {
      case 'activity.completed':
        return this._recordActivity(event);
      case 'user.query':
        return this._answerQuery(event);
      case 'fraud.detected':
        return this._recordFraud(event);
      case 'reward.claimed':
        return this._recordReward(event);
      case 'memory.request':
        return this._provideContext(event);
      default:
        return { handled: false };
    }
  }

  /**
   * จำกิจกรรมที่ผู้ใช้ทำ
   */
  _recordActivity(event) {
    const { userId, activityId, coins, duration } = event.payload || {};
    const user = sharedMemory.getUser(userId);

    user.totalWorkouts++;
    user.totalCoins += coins || 0;
    user.currentStreak = event.payload.streak || user.currentStreak;
    user.lastActiveDate = new Date().toISOString();
    user.recentActivities.push(activityId);

    if (user.recentActivities.length > 100) {
      user.recentActivities = user.recentActivities.slice(-50);
    }

    // วิเคราะห์กิจกรรมที่ชอบ
    const counts = {};
    user.recentActivities.forEach(a => { counts[a] = (counts[a] || 0) + 1; });
    user.favoriteActivities = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    this.logDecision('record_activity', { activityId, totalWorkouts: user.totalWorkouts });
    return { stored: true, favorite: user.favoriteActivities };
  }

  /**
   * ตอบคำถามเกี่ยวกับผู้ใช้
   */
  _answerQuery(event) {
    const { userId, query } = event.payload || {};
    const user = sharedMemory.getUser(userId);

    const answers = {
      'favorite_activity': user.favoriteActivities[0] || 'ยังไม่มี',
      'total_workouts': user.totalWorkouts,
      'streak': user.currentStreak,
      'fraud_count': user.fraudHistory.length,
      'summary': this._summarizeUser(user),
    };

    return { answer: answers[query] || null };
  }

  /**
   * จำประวัติการโกง
   */
  _recordFraud(event) {
    const { userId, detail, score } = event.payload || {};
    sharedMemory.recordFraudAttempt(userId, { detail, score });
    return { recorded: true };
  }

  /**
   * จำการแลกรางวัล
   */
  _recordReward(event) {
    const { userId, reward, cost } = event.payload || {};
    const user = sharedMemory.getUser(userId);
    user.rewardPreferences.push(reward);
    if (user.rewardPreferences.length > 20) {
      user.rewardPreferences = user.rewardPreferences.slice(-20);
    }
    return { stored: true };
  }

  /**
   * ให้ context แก่ Agent อื่น
   */
  _provideContext(event) {
    const { userId, requestor } = event.payload || {};
    const user = sharedMemory.getUser(userId);

    const context = {
      userId,
      level: user.level,
      streak: user.currentStreak,
      totalWorkouts: user.totalWorkouts,
      favoriteActivity: user.favoriteActivities[0],
      fraudScore: sharedMemory.getFraudScore(userId),
      recoverySuggestion: sharedMemory.suggestRecovery(userId),
    };

    return { context };
  }

  /**
   * สรุปโปรไฟล์ผู้ใช้
   */
  _summarizeUser(user) {
    const total = user.totalWorkouts;
    const streak = user.currentStreak;
    const fav = user.favoriteActivities[0] || 'ไม่ระบุ';
    return `ออกกำลังกาย ${total} ครั้ง | Streak ${streak} วัน | ชอบ ${fav}`;
  }
}

module.exports = MemoryAgent;
