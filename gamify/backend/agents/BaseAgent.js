// ============================================
// 🤖 BaseAgent — คลาสพื้นฐานสำหรับ Agent ทุกตัว
// ============================================
// เพิ่ม:
//   - Self Reflection
//   - Multi-step reasoning
//   - Tool Calling interface
//   - Planning hooks
//   - Confidence scoring
//   - Event bus integration
// ============================================

const sharedMemory = require('./shared-memory');
const eventBus = require('./event-bus');

class BaseAgent {
  constructor(name) {
    this.name = name;
    this.eventBus = eventBus;
    this.memory = sharedMemory;
    this.tools = {};
  }

  // ===== Self Reflection =====
  /**
   * ตรวจสอบผลลัพธ์ของตัวเองก่อนส่งต่อ
   * @param {*} output — ผลลัพธ์ที่ agent ผลิต
   * @param {object} context — บริบทการทำงาน
   * @returns {{ passed, confidence, reasoning, adjustedOutput }}
   */
  reflect(output, context = {}) {
    const reflection = {
      passed: true,
      confidence: 1.0,
      reasoning: 'ผ่านการตรวจสอบ',
      weaknesses: [],
      adjustedOutput: output,
    };

    // ให้ subclass override ตรงนี้

    // บันทึก reflection
    const agentMemory = this.memory.getAgentMemory(this.name);
    agentMemory.reflections.push({
      timestamp: Date.now(),
      output: typeof output === 'object' ? { ...output } : output,
      reflection,
    });

    return reflection;
  }

  /**
   * ตรวจสอบความมั่นใจของผลลัพธ์
   */
  assessConfidence(result) {
    // ค่าเริ่มต้น: confidence สูงสุด
    // subclass สามารถ override เพื่อลด confidence ได้
    return 1.0;
  }

  // ===== Multi-Step Reasoning =====
  /**
   * คิดวิเคราะห์หลายขั้นตอนก่อนตัดสินใจ
   * @param {object} context — ข้อมูลนำเข้า
   * @param {array} steps — ขั้นตอนการคิด
   * @returns {object} — ผลการวิเคราะห์
   */
  async reason(context, steps = []) {
    console.log(`🧩 [${this.name}] Reasoning: ${steps.length} steps`);

    const reasoningChain = [];
    let currentContext = { ...context };

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepResult = await step(currentContext);

      reasoningChain.push({
        step: i + 1,
        description: step.description || `Step ${i + 1}`,
        input: currentContext,
        output: stepResult,
      });

      currentContext = {
        ...currentContext,
        ...(stepResult.data || {}),
        [`_step${i + 1}`]: stepResult,
      };
    }

    // สรุป reasoning chain
    const conclusion = reasoningChain[reasoningChain.length - 1]?.output?.conclusion || {};

    return {
      reasoningChain,
      conclusion,
      confidence: conclusion.confidence || 0.5,
    };
  }

  // ===== Tool Calling =====
  /**
   * ลงทะเบียน tool
   */
  registerTool(name, tool) {
    this.tools[name] = tool;
    console.log(`🛠️  [${this.name}] Registered tool: ${name}`);
  }

  /**
   * เรียกใช้ tool
   * @param {string} name — ชื่อ tool
   * @param {object} params — พารามิเตอร์
   * @returns {*} — ผลลัพธ์จาก tool
   */
  async useTool(name, params = {}) {
    const tool = this.tools[name];
    if (!tool) {
      throw new Error(`❌ Tool "${name}" not found in ${this.name}`);
    }

    console.log(`🛠️  [${this.name}] Calling tool: ${name}`, params);
    const result = await tool.execute(params);
    console.log(`🛠️  [${this.name}] Tool ${name} result:`, result);

    return result;
  }

  // ===== Planning =====
  /**
   * สร้างแผนการทำงานแบบ dynamic
   * @param {object} context — สถานการณ์ปัจจุบัน
   * @returns {array} — ลำดับขั้นตอน
   */
  plan(context) {
    // subclass override เพื่อสร้างแผนเฉพาะ
    return [];
  }

  // ===== Agent Communication =====
  /**
   * ส่ง event ไปยัง Agent อื่น
   */
  async sendEvent(type, payload, extra = {}) {
    const event = EventBus.createEvent({
      type,
      from: this.name,
      payload,
      ...extra,
    });
    return this.eventBus.emit(event, {});
  }

  /**
   * รับ event จาก Agent อื่น (override ใน subclass)
   */
  async onEvent(event) {
    console.log(`📡 [${this.name}] Received event: ${event.type} from ${event.from}`);
    return { received: true, handler: 'default' };
  }

  // ===== Utilities =====
  /**
   * บันทึกการตัดสินใจ
   */
  logDecision(action, detail) {
    const mem = this.memory.getAgentMemory(this.name);
    mem.recentDecisions.push({
      timestamp: Date.now(),
      action,
      detail,
    });
  }
}

module.exports = BaseAgent;
