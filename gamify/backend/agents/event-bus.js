// ============================================
// 📡 Event Bus — Agent-to-Agent Communication
// ============================================
// Agent สามารถส่ง message หากันผ่าน Event Bus
// รองรับ Pub/Sub pattern
// ============================================

const sharedMemory = require('./shared-memory');

class EventBus {
  constructor() {
    this.subscribers = new Map();  // eventType → Set<agentName>
    this.messages = [];
  }

  /**
   * Agent ลงทะเบียนรับ event
   */
  subscribe(agentName, eventTypes) {
    eventTypes.forEach(type => {
      if (!this.subscribers.has(type)) {
        this.subscribers.set(type, new Set());
      }
      this.subscribers.get(type).add(agentName);
      console.log(`📡 [EventBus] ${agentName} subscribed to "${type}"`);
    });
  }

  /**
   * Agent ส่ง event → ไปหาทุก Agent ที่ subscribe
   */
  async emit(event, agentRefs = {}) {
    const { type, from, payload, confidence, reasoning } = event;

    console.log(`\n📡 [EventBus] ${from} → "${type}"`);
    if (reasoning) console.log(`📡   reasoning: ${reasoning}`);
    if (confidence !== undefined) console.log(`📡   confidence: ${confidence}`);

    const logEntry = {
      timestamp: Date.now(),
      type,
      from,
      payload,
      confidence,
      reasoning,
    };
    this.messages.push(logEntry);
    if (this.messages.length > 200) this.messages = this.messages.slice(-100);

    // Log to shared memory
    sharedMemory.logEvent(logEntry);

    // หา subscribers
    const targets = this.subscribers.get(type) || new Set();
    if (targets.size === 0) {
      console.log(`📡   (no subscribers for "${type}")`);
      return [];
    }

    const results = [];
    for (const targetName of targets) {
      if (targetName === from) continue; // ไม่ส่งหาตัวเอง

      const agent = agentRefs[targetName];
      if (!agent || !agent.onEvent) continue;

      console.log(`📡   → delivering to ${targetName}`);
      try {
        const result = await agent.onEvent({
          type,
          from,
          payload,
          confidence,
          reasoning,
        });
        results.push({ agent: targetName, result });
      } catch (err) {
        console.error(`📡   ${targetName} error:`, err.message);
        results.push({ agent: targetName, error: err.message });
      }
    }

    return results;
  }

  /**
   * ดึงประวัติ event ล่าสุด
   */
  getHistory(limit = 20) {
    return this.messages.slice(-limit);
  }

  /**
   * สร้าง Event object
   */
  static createEvent({ type, from, payload, confidence = 1.0, reasoning = null }) {
    return { type, from, payload, confidence, reasoning };
  }
}

// Singleton
const eventBus = new EventBus();
module.exports = eventBus;
