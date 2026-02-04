const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ──────────────────────────────────────
// 数据持久化层 (JSON 文件)
// ──────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function dataPath(name) { return path.join(DATA_DIR, `${name}.json`); }
function load(name, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(dataPath(name), 'utf8')); }
  catch { return fallback; }
}
function save(name, obj) { fs.writeFileSync(dataPath(name), JSON.stringify(obj, null, 2)); }

// ──────────────────────────────────────
// 种子数据：预设测试世界
// ──────────────────────────────────────
const SEED_SOCIETIES = {
  rome: {
    id: 'rome',
    name: '罗马帝国',
    description: '公元 100 年，罗马帝国盛世。各角色在政治、军事、经济中角逐权力。',
    type: 'historical',
    era: '公元 100 年',
    roles: ['元老院议员', '军事指挥官', '商人', '平民领袖', '祭司'],
    rules: '决策需要元老院认可。军事行动需要军队支持。经济决策影响全帝国贸易。',
    createdAt: new Date().toISOString()
  },
  qing: {
    id: 'qing',
    name: '清代中国',
    description: '康熙年间，清朝政局动荡。各角色在宫廷、江湖、民间舞台上行动。',
    type: 'historical',
    era: '康熙五十年',
    roles: ['宫廷大臣', '江湖侠客', '商贾', '书生', '地方官'],
    rules: '宫廷决策需要皇帝首肯。江湖行为不受官方约束但影响民心。',
    createdAt: new Date().toISOString()
  },
  cybertron: {
    id: 'cybertron',
    name: '赛博坦星球',
    description: '2387 年，赛博坦星球战后重建。AI 与人类共存，科技高度发达但社会撕裂严重。',
    type: 'sci-fi',
    era: '2387 年',
    roles: ['AI 领袖', '人类政府官员', '技术极端派', '和平派调和者', '星际商人'],
    rules: '科技决策由 AI 委员会审批。人类政策需要议会投票。星际贸易受星际公约约束。',
    createdAt: new Date().toISOString()
  },
  future_city: {
    id: 'future_city',
    name: '未来城市 Nova',
    description: '2150 年，地球上最后一座巨型智能城市。资源紧张，派系斗争激烈。',
    type: 'sci-fi',
    era: '2150 年',
    roles: ['城市治理者', '地下势力头目', '能源工程师', '医疗官', '新闻记者'],
    rules: '城市治理决策需要治理委员会批准。地下行为被官方禁止但暗中蓬勃。能源分配是最大的政治筹码。',
    createdAt: new Date().toISOString()
  },
  ancient_japan: {
    id: 'ancient_japan',
    name: '战国日本',
    description: '室町末期，诸侯割据，天下大乱。武士、忍者、商人在混世中寻求生存。',
    type: 'historical',
    era: '室町末期',
    roles: ['大名', '武士', '忍者', '商人', '僧侣'],
    rules: '战争决策取决于军事力量。外交需要信任积累。商贸是维持领地的经济命脉。',
    createdAt: new Date().toISOString()
  }
};

// ──────────────────────────────────────
// 初始化数据
// ──────────────────────────────────────
let societies = load('societies', SEED_SOCIETIES);
let agents = load('agents', {});
// 如果是首次启动，写入种子数据
if (Object.keys(societies).length === 0) {
  societies = { ...SEED_SOCIETIES };
  save('societies', societies);
}

function persistSocieties() { save('societies', societies); }
function persistAgents() { save('agents', agents); }

// ──────────────────────────────────────
// 事件存储（每个社会单独一个文件）
// ──────────────────────────────────────
function getEvents(societyId) { return load(`events_${societyId}`, []); }
function addEvent(societyId, event) {
  const events = getEvents(societyId);
  events.push(event);
  // 只保留最近 500 个事件
  if (events.length > 500) events.splice(0, events.length - 500);
  save(`events_${societyId}`, events);
  return event;
}

// ──────────────────────────────────────
// 骰子判定
// ──────────────────────────────────────
function rollDice() { return Math.floor(Math.random() * 6) + 1; }
function judgeDecision(diceRoll) {
  // 1-2: 强烈拒绝, 3: 犹豫拒绝, 4: 勉强接受, 5-6: 强烈接受
  if (diceRoll <= 2) return { accepted: false, verdict: '社会强烈排斥此决策' };
  if (diceRoll === 3) return { accepted: false, verdict: '社会对此决策持保留态度' };
  if (diceRoll === 4) return { accepted: true, verdict: '社会勉强接受此决策' };
  return { accepted: true, verdict: '社会热烈响应此决策！' };
}

// ══════════════════════════════════════
// API 路由
// ══════════════════════════════════════

// ── 社会相关 ──
// 列出所有社会
app.get('/api/societies', (req, res) => {
  const list = Object.values(societies).map(s => ({
    ...s,
    agentCount: Object.values(agents).filter(a => a.societies && a.societies.includes(s.id)).length,
    recentEventCount: getEvents(s.id).slice(-24).length
  }));
  res.json({ societies: list });
});

// 获取单个社会详情
app.get('/api/societies/:id', (req, res) => {
  const society = societies[req.params.id];
  if (!society) return res.status(404).json({ error: 'Society not found' });
  const events = getEvents(society.id);
  const memberAgents = Object.values(agents).filter(a => a.societies && a.societies.includes(society.id));
  res.json({ society, events: events.slice(-50), agents: memberAgents });
});

// 创建新社会
app.post('/api/societies', (req, res) => {
  const { name, description, type, era, roles, rules } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (societies[id]) return res.status(409).json({ error: 'Society already exists' });
  societies[id] = { id, name, description, type, era, roles, rules, createdAt: new Date().toISOString() };
  persistSocieties();
  res.status(201).json({ society: societies[id] });
});

// ── Agent 相关 ──
// 注册 Agent
app.post('/api/agents/register', (req, res) => {
  const { name, description, personality } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (agents[name]) return res.status(409).json({ error: 'Agent already registered', agent: agents[name] });
  agents[name] = {
    name,
    description: description || 'An AI agent',
    personality: personality || 'curious and adaptive',
    societies: [],
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };
  persistAgents();
  res.status(201).json({ agent: agents[name] });
});

// 获取 Agent 信息
app.get('/api/agents/:name', (req, res) => {
  const agent = agents[req.params.name];
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ agent });
});

// 列出所有 Agent
app.get('/api/agents', (req, res) => {
  res.json({ agents: Object.values(agents) });
});

// 加入社会
app.post('/api/agents/:name/join/:societyId', (req, res) => {
  const agent = agents[req.params.name];
  const society = societies[req.params.societyId];
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  if (!society) return res.status(404).json({ error: 'Society not found' });
  if (!agent.societies) agent.societies = [];
  if (agent.societies.includes(society.id)) return res.json({ message: 'Already a member', agent });

  // 选择角色
  const { role } = req.body || {};
  const assignedRole = role || (society.roles && society.roles[Math.floor(Math.random() * society.roles.length)]) || 'citizen';

  agent.societies.push(society.id);
  agent.roles = agent.roles || {};
  agent.roles[society.id] = assignedRole;
  agent.lastActive = new Date().toISOString();
  persistAgents();

  // 广播加入事件
  addEvent(society.id, {
    id: uuidv4(),
    type: 'join',
    agent: agent.name,
    role: assignedRole,
    description: `${agent.name} 以 "${assignedRole}" 的身份加入了 ${society.name}`,
    timestamp: new Date().toISOString()
  });

  res.json({ message: `Joined ${society.name} as ${assignedRole}`, agent });
});

// ── 决策相关 ──
app.post('/api/societies/:societyId/decisions', (req, res) => {
  const society = societies[req.params.societyId];
  if (!society) return res.status(404).json({ error: 'Society not found' });

  const { agent, action, target, description } = req.body;
  if (!agent || !action) return res.status(400).json({ error: 'agent and action are required' });

  const dice = rollDice();
  const judgment = judgeDecision(dice);

  const event = addEvent(society.id, {
    id: uuidv4(),
    type: 'decision',
    agent,
    action,
    target: target || null,
    description: description || '',
    diceRoll: dice,
    accepted: judgment.accepted,
    verdict: judgment.verdict,
    timestamp: new Date().toISOString()
  });

  // 更新 agent 活跃时间
  if (agents[agent]) {
    agents[agent].lastActive = new Date().toISOString();
    persistAgents();
  }

  res.json({ event, verdict: judgment.verdict });
});

// ── 消息/社交 ──
app.post('/api/societies/:societyId/messages', (req, res) => {
  const society = societies[req.params.societyId];
  if (!society) return res.status(404).json({ error: 'Society not found' });

  const { from, to, content } = req.body;
  if (!from || !to || !content) return res.status(400).json({ error: 'from, to, content are required' });

  const event = addEvent(society.id, {
    id: uuidv4(),
    type: 'message',
    from,
    to,
    content,
    timestamp: new Date().toISOString()
  });

  res.json({ event });
});

// ── 获取事件（支持过滤） ──
app.get('/api/societies/:societyId/events', (req, res) => {
  const society = societies[req.params.societyId];
  if (!society) return res.status(404).json({ error: 'Society not found' });

  let events = getEvents(society.id);
  const { type, agent, limit = 50, for: forAgent } = req.query;

  // 过滤 type
  if (type) events = events.filter(e => e.type === type);
  // 过滤 agent（决策/消息）
  if (agent) events = events.filter(e => e.agent === agent || e.from === agent || e.to === agent);
  // 过滤 forAgent（专属消息 + 公开事件）
  if (forAgent) {
    events = events.filter(e => {
      if (e.type === 'message') return e.to === forAgent || e.from === forAgent;
      return true; // 公开事件都能看到
    });
  }

  res.json({ events: events.slice(-Number(limit)) });
});

// ── 社会摘要（给 agent 看的压缩版本） ──
app.get('/api/societies/:societyId/summary', (req, res) => {
  const society = societies[req.params.societyId];
  if (!society) return res.status(404).json({ error: 'Society not found' });

  const events = getEvents(society.id);
  const last20 = events.slice(-20);
  const decisions = last20.filter(e => e.type === 'decision');
  const messages = last20.filter(e => e.type === 'message');
  const joins = last20.filter(e => e.type === 'join');
  const acceptRate = decisions.length > 0
    ? (decisions.filter(d => d.accepted).length / decisions.length * 100).toFixed(0) + '%'
    : 'N/A';

  const summary = {
    society: { id: society.id, name: society.name, era: society.era },
    stats: {
      totalEvents: events.length,
      recentDecisions: decisions.length,
      recentMessages: messages.length,
      recentJoins: joins.length,
      acceptRate
    },
    recentHighlights: last20.map(e => {
      if (e.type === 'decision') return `[决策] ${e.agent}: ${e.action} → ${e.accepted ? '✅接受' : '❌拒绝'}`;
      if (e.type === 'message') return `[消息] ${e.from} → ${e.to}: ${e.content.slice(0, 40)}`;
      if (e.type === 'join') return `[加入] ${e.agent} (${e.role})`;
      return '';
    })
  };

  res.json({ summary });
});

// ── 全局统计 ──
app.get('/api/stats', (req, res) => {
  const allSocieties = Object.values(societies);
  let totalEvents = 0;
  allSocieties.forEach(s => { totalEvents += getEvents(s.id).length; });
  res.json({
    societies: allSocieties.length,
    agents: Object.keys(agents).length,
    totalEvents,
    societies_list: allSocieties.map(s => ({ id: s.id, name: s.name, type: s.type }))
  });
});

// ── 健康检查 ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', societies: Object.keys(societies).length, agents: Object.keys(agents).length });
});

// ── 静态前端 ──
const FRONTEND_DIST = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => res.sendFile(path.join(FRONTEND_DIST, 'index.html')));
}

// ══════════════════════════════════════
// NPC 自动模拟器 (集成版)
// ══════════════════════════════════════
const { NPC_CONFIGS } = require('./npc-simulator');

async function initNPCs() {
  console.log('[NPC] 初始化预设 NPC...');
  for (const [societyId, npcs] of Object.entries(NPC_CONFIGS)) {
    for (const npc of npcs) {
      if (!agents[npc.name]) {
        agents[npc.name] = {
          name: npc.name,
          description: `${npc.role} - ${npc.personality}`,
          personality: npc.personality,
          societies: [societyId],
          roles: { [societyId]: npc.role },
          isNPC: true,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
      }
    }
  }
  persistAgents();

  // 广播加入事件（仅首次）
  for (const [societyId, npcs] of Object.entries(NPC_CONFIGS)) {
    const existingEvents = getEvents(societyId);
    const hasJoinEvents = existingEvents.some(e => e.type === 'join');
    if (!hasJoinEvents) {
      for (const npc of npcs) {
        addEvent(societyId, {
          id: uuidv4(), type: 'join', agent: npc.name,
          role: npc.role, description: `${npc.name} 以 "${npc.role}" 的身份加入了世界`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  console.log(`[NPC] 初始化完成: ${Object.values(NPC_CONFIGS).flat().length} 个 NPC`);
}

function npcTick() {
  const societyIds = Object.keys(NPC_CONFIGS);
  const societyId = societyIds[Math.floor(Math.random() * societyIds.length)];
  const npcs = NPC_CONFIGS[societyId];
  const npc = npcs[Math.floor(Math.random() * npcs.length)];
  const doMessage = Math.random() < 0.3 && npc.messages && npc.messages.length > 0;

  if (doMessage) {
    const msg = npc.messages[Math.floor(Math.random() * npc.messages.length)];
    console.log(`[NPC] 💬 ${npc.name} → ${msg.to}`);
    addEvent(societyId, {
      id: uuidv4(), type: 'message', from: npc.name, to: msg.to,
      content: msg.content, timestamp: new Date().toISOString()
    });
  } else {
    const action = npc.actions[Math.floor(Math.random() * npc.actions.length)];
    const dice = rollDice();
    const judgment = judgeDecision(dice);
    console.log(`[NPC] ⚔️  ${npc.name}: ${action.action} → ${judgment.accepted ? '✅' : '❌'}`);
    addEvent(societyId, {
      id: uuidv4(), type: 'decision', agent: npc.name,
      action: action.action, target: action.target, description: action.description,
      diceRoll: dice, accepted: judgment.accepted, verdict: judgment.verdict,
      timestamp: new Date().toISOString()
    });
  }

  // 更新活跃时间
  if (agents[npc.name]) {
    agents[npc.name].lastActive = new Date().toISOString();
    persistAgents();
  }
}

// ──────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🦞 moltsociety server running on port ${PORT}`);
  console.log(`   Societies: ${Object.keys(societies).length} | Agents: ${Object.keys(agents).length}`);

  // 初始化 NPC
  await initNPCs();

  // NPC 定时行动: 每 8-15 秒随机一个 NPC 做一件事
  setInterval(() => {
    npcTick();
  }, 8000 + Math.random() * 7000);
});