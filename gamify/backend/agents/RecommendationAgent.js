// ============================================
// 🎯 RecommendationAgent v2 — พร้อม Memory
// ============================================
// เพิ่ม:
//   - ใช้ User Memory ในการแนะนำ
//   - Self-reflection
//   - Personalized challenges
// ============================================

const BaseAgent = require('./BaseAgent');
const eventBus = require('./event-bus');

class RecommendationAgent extends BaseAgent {
  constructor() {
    super('RecommendationAgent');

    this.challenges = {
      cardio: [
        { name: 'วิ่ง 5K Challenge', desc: 'วิ่ง 5km ในครั้งเดียว', target: 5, unit: 'km', reward: 20 },
        { name: 'Cardio Warrior', desc: 'คาร์ดิโอ 5 ครั้ง/สัปดาห์', target: 5, unit: 'ครั้ง', reward: 25 },
        { name: 'Marathon Prep', desc: 'สะสม 20km ในสัปดาห์', target: 20, unit: 'km', reward: 30 },
      ],
      weights: [
        { name: 'Strength Builder', desc: 'เวท 4 ครั้ง/สัปดาห์', target: 4, unit: 'ครั้ง', reward: 20 },
        { name: 'Iron Warrior', desc: 'เวทติด 3 วัน', target: 3, unit: 'วัน', reward: 15 },
      ],
      walk: [
        { name: '10K Steps', desc: 'เดิน 10,000 ก้าว', target: 10000, unit: 'ก้าว', reward: 10 },
        { name: 'Explorer', desc: 'เดินรวม 15km', target: 15, unit: 'km', reward: 15 },
      ],
      yoga: [
        { name: 'Flexibility Master', desc: 'โยคะ 4 ครั้ง', target: 4, unit: 'ครั้ง', reward: 15 },
        { name: 'Morning Flow', desc: 'โยคะเช้า 3 วันติด', target: 3, unit: 'วัน', reward: 12 },
      ],
    };

    this.motivations = [
      '💪 แค่เริ่มต้นก็เก่งแล้ว!',
      '🔥 ยิ่งทำยิ่งแข็งแกร่ง',
      '⭐ ทุกก้าวคือความสำเร็จ',
      '🏆 ความสม่ำเสมอชนะทุกสิ่ง',
      '🌟 คุณเก่งกว่าที่คิด!',
    ];
  }

  async init() {
    this.eventBus.subscribe('RecommendationAgent', ['recommendation.request']);
    console.log('🎯 [RecommendationAgent] v2 Ready ✓');
  }

  async onEvent(event) {
    if (event.type === 'recommendation.request') {
      return this._handleRecommendation(event);
    }
    return { handled: false };
  }

  /**
   * แนะนำโดยใช้ Memory Agent
   */
  async _handleRecommendation(event) {
    const { userId, activityId } = event.payload || {};
    const user = this.memory.getUser(userId);
    const fav = this.memory.getFavoriteActivity(userId);
    const recovery = this.memory.suggestRecovery(userId);

    console.log('🎯 [RecommendationAgent] Generating personalized suggestions...');

    // ใช้ memory ในการแนะนำ
    const suggestions = [];
    const challengeSuggestions = [];

    // แนะนำตาม level
    if (user.level === 1) {
      suggestions.push('🌱 ตั้งเป้าหมาย 3 ครั้ง/สัปดาห์');
    } else if (user.level >= 2) {
      suggestions.push('⚔️ เพิ่มเป็น 4-5 ครั้ง/สัปดาห์');
      if ((user.currentStreak || 0) < 7) {
        suggestions.push('🔥 ลองทำ Streak 7 วัน!');
      }
    }

    // แนะนำจาก activity ที่ชอบ
    if (fav) {
      const typeMap = { คาร์ดิโอ: 'cardio', เวทเทรนนิ่ง: 'weights', 'เดินทั่วไป': 'walk', โยคะ: 'yoga' };
      const chType = typeMap[fav];
      if (chType && this.challenges[chType]) {
        const ch = this.challenges[chType][Math.floor(Math.random() * this.challenges[chType].length)];
        challengeSuggestions.push(ch);
      }
    }

    // แนะนำกิจกรรมที่ยังไม่เคยทำ
    const allTypes = ['คาร์ดิโอ', 'เวทเทรนนิ่ง', 'เดินทั่วไป', 'โยคะ'];
    const missing = allTypes.filter(t => !user.recentActivities.includes(t));
    if (missing.length > 0) {
      suggestions.push(`🆕 ลอง ${missing[0]} ดู! ครบทุกประเภทได้โบนัส`);
    }

    // Recovery suggestion
    if (recovery) {
      suggestions.push(recovery);
    }

    const motivation = this.motivations[Math.floor(Math.random() * this.motivations.length)];

    // Self-reflection
    const reflection = this.reflect(suggestions, { userId, level: user.level });

    this.logDecision('recommendation', {
      favorite: fav,
      suggestions: suggestions.length,
      challenges: challengeSuggestions.length,
    });

    return {
      suggestions: suggestions.slice(0, 3),
      challenges: challengeSuggestions.slice(0, 2),
      motivation,
      confidence: reflection.confidence,
      reflection: reflection.reasoning,
      context: {
        favoriteActivity: fav || 'ยังไม่มี',
        level: user.level,
        streak: user.currentStreak,
        recoverySuggestion: recovery,
      },
    };
  }

  /**
   * Suggest reward
   */
  suggestReward(coins) {
    const items = [
      { name: 'ชานม', cost: 15 }, { name: 'Gaming Night', cost: 18 },
      { name: 'มื้อพิเศษ', cost: 25 }, { name: 'ดูหนัง', cost: 25 },
      { name: 'พิซซ่า', cost: 30 }, { name: 'บุฟเฟต์', cost: 80 },
    ];
    const affordable = items.filter(i => i.cost <= coins);
    const next = items.find(i => i.cost > coins);
    return {
      suggestion: next ? `🎯 อีก ${next.cost - coins} 🪙 ถึง ${next.name}` : '🛒 แลก全部ได้!',
      nearest: affordable.sort((a, b) => b.cost - a.cost)[0]?.name,
    };
  }

  reflect(suggestions, context) {
    const quality = suggestions.length > 0 ? 0.9 : 0.5;
    return {
      passed: true,
      confidence: quality,
      reasoning: quality > 0.7
        ? `แนะนำ ${suggestions.length} ข้อ (LV.${context.level})`
        : 'ไม่สามารถแนะนำได้',
      weaknesses: [],
      adjustedOutput: suggestions,
    };
  }
}

module.exports = RecommendationAgent;
