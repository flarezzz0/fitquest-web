// ============================================
// 👮 ModerationAgent v2 — Content Moderation
// ============================================
// เพิ่ม: Self-reflection, Confidence scoring
// ============================================

const BaseAgent = require('./BaseAgent');
const eventBus = require('./event-bus');

class ModerationAgent extends BaseAgent {
  constructor() {
    super('ModerationAgent');
    this.imgSignatures = {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      gif: [0x47, 0x49, 0x46],
      bmp: [0x42, 0x4D],
      webp: [0x52, 0x49, 0x46, 0x46],
    };
  }

  async init() {
    this.eventBus.subscribe('ModerationAgent', ['moderation.request']);
    console.log('👮 [ModerationAgent] v2 Ready ✓');
  }

  async onEvent(event) {
    if (event.type === 'moderation.request') {
      return this._handleModeration(event);
    }
    return { handled: false };
  }

  /**
   * Moderation check with self-reflection
   */
  async _handleModeration(event) {
    const { imageBuffer } = event.payload || {};

    console.log('👮 [ModerationAgent] Checking content...');

    // Multi-step reasoning
    const steps = [
      this._stepFileSize.bind(this),
      this._stepFileType.bind(this),
      this._stepImageDimensions.bind(this),
      this._stepConclusion.bind(this),
    ];

    const reasoningResult = await this.reason(
      { imageBuffer },
      steps
    );

    const conclusion = reasoningResult.conclusion;

    // Self-reflection
    const reflection = this.reflect(conclusion, { size: imageBuffer?.length });

    this.logDecision('moderation_result', {
      passed: conclusion.passed,
      confidence: reflection.confidence,
    });

    return {
      passed: conclusion.passed,
      flags: conclusion.flags || [],
      message: conclusion.passed
        ? '✅ รูปผ่านการตรวจสอบ'
        : `❌ ${conclusion.flags?.join(', ')}`,
      confidence: reflection.confidence,
      reasoning: reasoningResult.reasoningChain.map(s => s.output.description),
    };
  }

  async _stepFileSize(ctx) {
    const size = ctx.imageBuffer?.length || 0;
    const valid = size > 0 && size < 10 * 1024 * 1024;
    return {
      description: `File size: ${(size / 1024).toFixed(1)}KB ${valid ? '✅' : '❌'}`,
      data: { validSize: valid },
      conclusion: null,
    };
  }

  async _stepFileType(ctx) {
    if (!ctx.imageBuffer) return { description: 'No file', data: { validType: false }, conclusion: null };
    const header = ctx.imageBuffer.slice(0, 4);
    let validType = false;
    for (const [name, sig] of Object.entries(this.imgSignatures)) {
      if (sig.every((b, i) => header[i] === b)) { validType = true; break; }
    }
    return {
      description: `File type: ${validType ? 'valid image ✅' : '❌ not an image'}`,
      data: { validType },
      conclusion: null,
    };
  }

  async _stepImageDimensions(ctx) {
    if (!ctx._step2?.validType) return { description: 'Skipped (invalid type)', data: { validDims: false }, conclusion: null };
    try {
      const sharp = require('sharp');
      const meta = await sharp(ctx.imageBuffer).metadata();
      const validDims = meta.width >= 100 && meta.height >= 100;
      return {
        description: `Image: ${meta.width}x${meta.height} ${validDims ? '✅' : '❌ too small'}`,
        data: { validDims, width: meta.width, height: meta.height },
        conclusion: null,
      };
    } catch (e) {
      return { description: `Image analysis error: ${e.message}`, data: { validDims: false }, conclusion: null };
    }
  }

  async _stepConclusion(ctx) {
    const passed = ctx._step1?.validSize && ctx._step2?.validType && ctx._step3?.validDims;
    const flags = [];
    if (!ctx._step1?.validSize) flags.push('file_size_invalid');
    if (!ctx._step2?.validType) flags.push('invalid_file_type');
    if (!ctx._step3?.validDims) flags.push('image_too_small');
    return {
      description: passed ? '✅ All checks passed' : `❌ ${flags.join(', ')}`,
      data: {},
      conclusion: { passed, flags },
    };
  }

  reflect(output) {
    const { passed, flags } = output;
    const confidence = passed ? 0.95 : 0.8;
    return {
      passed,
      confidence,
      reasoning: passed ? 'All content checks passed' : `Blocked: ${flags?.join(', ')}`,
      weaknesses: [],
      adjustedOutput: output,
    };
  }
}

module.exports = ModerationAgent;
