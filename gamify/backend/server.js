// ============================================
// 🚀 FitQuest Server v2 — Autonomous Agent System
// ============================================
// Architecture:
//   Frontend → API Gateway → MainAgent (Planner)
//   → Agent Bus / Event System
//     → VerificationAgent | AntiCheatAgent | ModerationAgent
//     → RewardAgent | RecommendationAgent | MemoryAgent
//   → Tools: OCR | Fraud | Reward | Image Analysis
// ============================================

const express = require('express');
const cors = require('cors');
const multer = require('multer');

// ===== Agent System =====
const MainAgent = require('./agents/MainAgent');
const VerificationAgent = require('./agents/VerificationAgent');
const AntiCheatAgent = require('./agents/AntiCheatAgent');
const ModerationAgent = require('./agents/ModerationAgent');
const RewardAgent = require('./agents/RewardAgent');
const RecommendationAgent = require('./agents/RecommendationAgent');
const MemoryAgent = require('./agents/MemoryAgent');
const sharedMemory = require('./agents/shared-memory');
const eventBus = require('./agents/event-bus');

// ===== Tools =====
const { OCRTool, FraudTool, RewardTool, ImageAnalysisTool, NotificationTool } = require('./agents/tools');

const app = express();
const PORT = process.env.PORT || 3456;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype) ? true : new Error('รองรับเฉพาะรูปภาพ'));
  }
});

// ===== Initialize Agents =====
let agents = {};

async function initAgents() {
  console.log('\n🤖 ====== FITQUEST v2 — AUTONOMOUS AGENT SYSTEM ======');

  // 1. Initialize Tools
  const ocrTool = new OCRTool();
  await ocrTool.init();

  const fraudTool = new FraudTool();
  const rewardTool = new RewardTool();
  const imageAnalysisTool = new ImageAnalysisTool();
  const notificationTool = new NotificationTool();

  console.log('🛠️  Tools ready');

  // 2. Initialize Agents
  const verificationAgent = new VerificationAgent();
  const antiCheatAgent = new AntiCheatAgent();
  const moderationAgent = new ModerationAgent();
  const rewardAgent = new RewardAgent();
  const recommendationAgent = new RecommendationAgent();
  const memoryAgent = new MemoryAgent();

  await verificationAgent.init();
  await antiCheatAgent.init();
  await moderationAgent.init();
  await rewardAgent.init();
  await recommendationAgent.init();
  await memoryAgent.init();

  // 3. Initialize MainAgent (Planner) with tools
  const mainAgent = new MainAgent({
    ocrTool, fraudTool, rewardTool, imageAnalysisTool, notificationTool,
  });

  // Pass agent refs for event bus communication
  const agentRefs = {
    MainAgent: mainAgent,
    VerificationAgent: verificationAgent,
    AntiCheatAgent: antiCheatAgent,
    ModerationAgent: moderationAgent,
    RewardAgent: rewardAgent,
    RecommendationAgent: recommendationAgent,
    MemoryAgent: memoryAgent,
  };

  await mainAgent.init(agentRefs);

  // Set agentRefs on all agents
  Object.values(agentRefs).forEach(agent => {
    if (agent.agentRefs === undefined) agent.agentRefs = agentRefs;
  });

  agents = agentRefs;
  agents._tools = { ocrTool, fraudTool, rewardTool, imageAnalysisTool, notificationTool };

  console.log('\n🤖 ====== SYSTEM READY ======');
  console.log(`📡 Agents: ${Object.keys(agentRefs).join(', ')}`);
  console.log(`🛠️  Tools: ${Object.keys(agents._tools).join(', ')}`);
}

// ===== Routes =====

// Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'FitQuest v2 — Autonomous Agent System',
    architecture: 'API Gateway → MainAgent(Planner) → Event Bus → Sub Agents',
    agents: Object.keys(agents).filter(k => !k.startsWith('_')).map(k => ({
      name: k, status: agents[k] ? 'ready' : 'unavailable',
    })),
    eventBusMessages: eventBus.getHistory(5),
    totalUsers: Object.keys(sharedMemory.store.users).length,
  });
});

// Activity Verification Flow (full pipeline)
app.post('/api/activity/verify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '❌ กรุณาอัปโหลดรูป' });
    if (!req.body.activityId) return res.status(400).json({ error: '❌ กรุณาระบุกิจกรรม' });

    const userId = req.body.userId || 'default';
    const result = await agents.MainAgent.processActivity({
      activityId: req.body.activityId,
      imageBuffer: req.file.buffer,
      imageHash: req.body.imageHash || `hash_${Date.now()}`,
      duration: parseInt(req.body.duration) || 30,
      distance: parseFloat(req.body.distance) || 0,
      calories: parseInt(req.body.calories) || 0,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('❌ [API] Error:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Chat with MainAgent
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: '❌ กรุณาพิมพ์ข้อความ' });
    const response = await agents.MainAgent.chat(message, context || {});
    res.json(response);
  } catch (error) {
    console.error('💬 [API] Chat Error:', error);
    res.status(500).json({ type: 'error', text: '❌ เกิดข้อผิดพลาด' });
  }
});

// Get user memory
app.get('/api/memory/:userId', (req, res) => {
  const user = sharedMemory.getUser(req.params.userId);
  const agentMemories = {};
  Object.keys(agents).filter(k => !k.startsWith('_')).forEach(k => {
    agentMemories[k] = sharedMemory.getAgentMemory(k);
  });
  res.json({
    user: {
      ...user,
      fraudHistory: user.fraudHistory.slice(-5),
      recentActivities: user.recentActivities.slice(-20),
    },
    agentMemories: Object.fromEntries(
      Object.entries(agentMemories).map(([k, v]) => [k, {
        reflectionCount: v.reflections.length,
        decisionCount: v.recentDecisions.length,
      }])
    ),
    eventLog: sharedMemory.store.events.slice(-10),
  });
});

// Event Bus status
app.get('/api/events', (req, res) => {
  res.json({
    history: eventBus.getHistory(20),
    subscriberCount: eventBus.subscribers.size,
  });
});

// Rewards calculate (simple)
app.post('/api/rewards/calculate', (req, res) => {
  const { activityId, duration, streak } = req.body;
  const tool = agents._tools.rewardTool;
  const result = tool.execute({ activityId, duration, streak: parseInt(streak) || 0 });
  res.json(result);
});

// Recommendations
app.post('/api/recommendations', async (req, res) => {
  const { context } = req.body;
  const result = await agents.RecommendationAgent.onEvent({
    type: 'recommendation.request',
    payload: { userId: context?.userId || 'default', activityId: context?.activityId },
  });
  res.json(result);
});

// Anti-cheat check
app.post('/api/anti-cheat/check', async (req, res) => {
  const { activityId, duration, distance, calories, imageHash, userId } = req.body;
  const result = await agents.AntiCheatAgent.onEvent({
    type: 'fraud.request',
    payload: { activityId, duration, distance, calories, imageHash, userId },
  });
  res.json(result);
});

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: `❌ ${err.message}` });
  console.error('❗ [API] Error:', err);
  res.status(500).json({ error: '❌ เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
});

// ===== Start =====
async function start() {
  try {
    await initAgents();
    app.listen(PORT, () => {
      console.log(`\n🚀 FitQuest v2 Autonomous Agent System`);
      console.log(`📡 http://localhost:${PORT}`);
      console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
      console.log(`🧠 Memory: http://localhost:${PORT}/api/memory/default`);
      console.log(`📡 Events: http://localhost:${PORT}/api/events`);
    });
  } catch (error) {
    console.error('❌ Fatal:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  if (agents._tools?.ocrTool) await agents._tools.ocrTool.destroy();
  process.exit(0);
});

start();
