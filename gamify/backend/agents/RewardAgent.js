// ============================================
// 🪙 RewardAgent v2 — Reward Calculator + Reflection
// ============================================

const BaseAgent = require('./BaseAgent');
const eventBus = require('./event-bus');

class RewardAgent extends BaseAgent {
  constructor() {
    super('RewardAgent');

    this.baseRates = { cardio: 10, weights: 12, walk: 3, yoga: 6, custom: 1 };
    this.streakRules = [
      { min: 0, max: 3, mult: 1 },
      { min: 4, max: 7, mult: 1.5 },
      { min: 8, max: Infinity, mult: 2 },
    ];
  }

  async init() {
    this.eventBus.subscribe('RewardAgent', ['reward.request']);
    console.log('🪙 [RewardAgent] v2 Ready ✓');
  }

  async onEvent(event) {
    if (event.type === 'reward.request') return this._handleReward(event);
    return { handled: false };
  }

  async _handleReward(event) {
    const { activityId, duration, streak } = event.payload || {};

    const steps = [
      this._stepBaseCalc.bind(this),
      this._stepStreakBonus.bind(this),
      this._stepTotal.bind(this),
    ];

    const reasoning = await this.reason(
      { activityId, duration, streak: streak || 0 },
      steps
    );

    const c = reasoning.conclusion;
    const reflection = this.reflect(c, { activityId });

    this.logDecision('reward_calculated', {
      activityId, total: c.total, confidence: reflection.confidence,
    });

    return {
      baseCoins: c.base,
      streakMultiplier: c.mult,
      streakBonus: c.bonus,
      totalCoins: c.total,
      confidence: reflection.confidence,
      reasoning: reasoning.reasoningChain.map(s => s.output.description),
      message: `🪙 ${c.base} + โบนัส ${c.bonus} = ${c.total} 🪙 (x${c.mult})`,
    };
  }

  async _stepBaseCalc(ctx) {
    let base = this.baseRates[ctx.activityId] || 0;
    if (ctx.activityId === 'custom' && ctx.duration) base = Math.floor(ctx.duration / 5);
    return {
      description: `Base: ${base} (${ctx.activityId})`,
      data: { base },
      conclusion: null,
    };
  }

  async _stepStreakBonus(ctx) {
    const s = ctx.streak || 0;
    let mult = 1;
    for (const r of this.streakRules) {
      if (s >= r.min && s <= r.max) { mult = r.mult; break; }
    }
    return {
      description: `Streak ${s} → x${mult}`,
      data: { mult },
      conclusion: null,
    };
  }

  async _stepTotal(ctx) {
    const base = ctx._step1?.base || 0;
    const mult = ctx._step2?.mult || 1;
    const bonus = Math.round(base * (mult - 1));
    return {
      description: `Total: ${base} + ${bonus} = ${base + bonus}`,
      data: {},
      conclusion: { base, mult, bonus, total: base + bonus },
    };
  }

  reflect(output) {
    if (output.total <= 0) {
      return { passed: false, confidence: 0.1, reasoning: 'Total coins = 0, possible error', weaknesses: ['zero_total'], adjustedOutput: output };
    }
    return { passed: true, confidence: 1.0, reasoning: `Calculated ${output.total} coins`, weaknesses: [], adjustedOutput: output };
  }
}

module.exports = RewardAgent;
