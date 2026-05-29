// ============================================
// 🧠 Shared Memory — ระบบความจำส่วนกลาง
// ============================================
// Agent ทุกตัวใช้ memory ร่วมกัน
// รองรับ: User Profile, Agent Memory, Session State
// ============================================

class SharedMemory {
  constructor() {
    this.store = {
      users: {},          // userId → profile
      sessions: {},       // sessionId → state
      agents: {},         // agentName → memory
      events: [],         // event log
    };
  }

  // ===== User Profile =====
  getUser(userId) {
    if (!this.store.users[userId]) {
      this.store.users[userId] = this._defaultUser();
    }
    return this.store.users[userId];
  }

  _defaultUser() {
    return {
      id: 'default',
      favoriteActivities: [],
      preferredTime: null,
      streakHistory: [],
      fraudHistory: [],
      rewardPreferences: [],
      level: 1,
      totalCoins: 0,
      totalWorkouts: 0,
      longestStreak: 0,
      currentStreak: 0,
      lastActiveDate: null,
      recentActivities: [],
      createdAt: Date.now(),
    };
  }

  updateUser(userId, data) {
    const user = this.getUser(userId);
    Object.assign(user, data);
    this.store.users[userId] = user;
    return user;
  }

  // ===== Agent Memory =====
  getAgentMemory(agentName) {
    if (!this.store.agents[agentName]) {
      this.store.agents[agentName] = {
        context: {},
        reflections: [],
        recentDecisions: [],
      };
    }
    return this.store.agents[agentName];
  }

  updateAgentMemory(agentName, data) {
    const mem = this.getAgentMemory(agentName);
    Object.assign(mem, data);

    // จำกัดขนาด
    if (mem.reflections.length > 50) mem.reflections = mem.reflections.slice(-50);
    if (mem.recentDecisions.length > 100) mem.recentDecisions = mem.recentDecisions.slice(-100);

    return mem;
  }

  // ===== Session State =====
  getSession(sessionId) {
    if (!this.store.sessions[sessionId]) {
      this.store.sessions[sessionId] = {
        currentFlow: null,
        pendingReviews: [],
        sharedContext: {},
      };
    }
    return this.store.sessions[sessionId];
  }

  updateSession(sessionId, data) {
    const session = this.getSession(sessionId);
    Object.assign(session, data);
    return session;
  }

  // ===== Event Logging =====
  logEvent(event) {
    this.store.events.push({
      timestamp: Date.now(),
      ...event,
    });
    if (this.store.events.length > 1000) {
      this.store.events = this.store.events.slice(-500);
    }
  }

  // ===== Personalization Helpers =====
  getFavoriteActivity(userId) {
    const user = this.getUser(userId);
    if (!user.recentActivities.length) return null;

    const counts = {};
    user.recentActivities.forEach(a => {
      counts[a] = (counts[a] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }

  suggestRecovery(userId) {
    const user = this.getUser(userId);
    const streak = user.currentStreak || 0;
    const recent = user.recentActivities || [];

    if (streak >= 5) {
      const lastFew = recent.slice(-3);
      const allSame = lastFew.every(a => a === lastFew[0]);
      if (allSame) {
        return `🔥 ทำ ${lastFew[0]} ติด ${streak} วัน ลองเปลี่ยนหรือพัก Recovery Day ไหม?`;
      }
    }
    return null;
  }

  // ===== Fraud Tracking =====
  recordFraudAttempt(userId, detail) {
    const user = this.getUser(userId);
    user.fraudHistory.push({
      timestamp: Date.now(),
      ...detail,
    });
    if (user.fraudHistory.length > 20) {
      user.fraudHistory = user.fraudHistory.slice(-20);
    }
  }

  getFraudScore(userId) {
    const user = this.getUser(userId);
    const recent = user.fraudHistory.filter(f =>
      Date.now() - f.timestamp < 7 * 24 * 60 * 60 * 1000
    );
    return Math.min(100, recent.length * 20);
  }
}

// Singleton
const sharedMemory = new SharedMemory();
module.exports = sharedMemory;
