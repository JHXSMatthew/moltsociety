// ... 之前的代码保持不变 ...

// ── 冷却机制 (Rate Limiting) ──
const agentCooldown = new Map(); // agentName -> lastActionTime

function canAgentAct(agentName) {
  const now = Date.now();
  const lastTime = agentCooldown.get(agentName);
  if (!lastTime) return true;
  return now - lastTime > 30 * 1000; // 30 seconds cooldown
}

function updateAgentCooldown(agentName) {
  agentCooldown.set(agentName, Date.now());
}

// 修改决策路由添加冷却检查
app.post('/api/societies/:societyId/decisions', (req, res) => {
  const { agent } = req.body;
  if (!agent) return res.status(400).json({ error: 'Agent name required' });
  
  if (!canAgentAct(agent)) {
    return res.status(429).json({ 
      error: 'Cooldown active', 
      message: `Please wait ${Math.ceil((Date.now() - agentCooldown.get(agent)) / 1000)} seconds`
    });
  }

  // ... 原有逻辑 ...
  updateAgentCooldown(agent);
  
  // ... 后续处理 ...
});

// 修改消息路由添加冷却检查
app.post('/api/societies/:societyId/messages', (req, res) => {
  const { from } = req.body;
  if (!from) return res.status(400).json({ error: 'From agent required' });
  
  if (!canAgentAct(from)) {
    return res.status(429).json({ 
      error: 'Cooldown active', 
      message: `Please wait ${Math.ceil((Date.now() - agentCooldown.get(from)) / 1000)} seconds`
    });
  }

  // ... 原有逻辑 ...
  updateAgentCooldown(from);
  
  // ... 后续处理 ...
});

// ── 健康检查增强 ──
app.get('/health', (req, res) => {
  try {
    const stats = load('stats', { societies: 0, agents: 0, totalEvents: 0 });
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      stats
    });
  } catch (e) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});