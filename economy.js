/**
 * 社会经济体系
 * - 每个 Agent 有金币余额
 * - 决策被接受时，根据类型获得/消耗金币
 * - 社交消息加强关系
 * - 社会繁荣度指标
 */

// 决策类型 → 经济影响映射
const ECONOMY_RULES = {
  // 建设类 → 消耗金币但社会繁荣度+
  '修建': { cost: 100, reward: 50, prosperity: 10 },
  '建设': { cost: 80, reward: 40, prosperity: 8 },
  '修缮': { cost: 60, reward: 30, prosperity: 5 },

  // 贸易类 → 低消耗高回报
  '贸易': { cost: 50, reward: 150, prosperity: 5 },
  '开拓': { cost: 100, reward: 200, prosperity: 8 },
  '经营': { cost: 30, reward: 80, prosperity: 3 },
  '赞助': { cost: 200, reward: 100, prosperity: 15 },

  // 军事类 → 高消耗
  '征兵': { cost: 150, reward: 30, prosperity: -5 },
  '巡逻': { cost: 80, reward: 20, prosperity: 0 },
  '攻击': { cost: 200, reward: 100, prosperity: -10 },
  '举行': { cost: 50, reward: 80, prosperity: 5 },

  // 政务类 → 中等
  '颁布': { cost: 30, reward: 50, prosperity: 8 },
  '审判': { cost: 20, reward: 40, prosperity: 5 },
  '召开': { cost: 40, reward: 60, prosperity: 3 },
  '派遣': { cost: 60, reward: 80, prosperity: 5 },

  // 江湖/社会类
  '救助': { cost: 80, reward: 20, prosperity: 15 },
  '抗议': { cost: 10, reward: 30, prosperity: -3 },
  '开办': { cost: 50, reward: 40, prosperity: 10 },

  // 默认
  '_default': { cost: 50, reward: 50, prosperity: 0 }
};

function getEconomyRule(action) {
  // 匹配 action 中包含的关键字
  for (const [keyword, rule] of Object.entries(ECONOMY_RULES)) {
    if (keyword !== '_default' && action.includes(keyword)) return { keyword, ...rule };
  }
  return { keyword: 'default', ...ECONOMY_RULES._default };
}

/**
 * 处理经济影响
 * @param {object} event - 决策事件
 * @param {object} economyState - { agents: { name: { balance } }, societies: { id: { prosperity } } }
 * @returns {object} 经济变动报告
 */
function processEconomics(event, economyState) {
  if (event.type !== 'decision') return null;

  const rule = getEconomyRule(event.action);
  const agentName = event.agent;
  const societyId = event.societyId;

  // 初始化
  if (!economyState.agents[agentName]) economyState.agents[agentName] = { balance: 500 }; // 起始金币
  if (!economyState.societies[societyId]) economyState.societies[societyId] = { prosperity: 50 }; // 起始繁荣度

  const agent = economyState.agents[agentName];
  const society = economyState.societies[societyId];
  let balanceChange = 0;
  let prosperityChange = 0;

  if (event.accepted) {
    // 决策被接受：消耗成本，获得回报
    balanceChange = event.diceRoll >= 5
      ? (rule.reward - rule.cost * 0.5)  // 强烈接受：成本减半
      : (rule.reward - rule.cost);        // 勉强接受：正常成本
    prosperityChange = rule.prosperity * (event.diceRoll >= 5 ? 1.5 : 1);
  } else {
    // 决策被拒绝：损失部分成本（尝试费用）
    balanceChange = -(rule.cost * 0.3);
    prosperityChange = rule.prosperity < 0 ? rule.prosperity * 0.5 : 0;
  }

  agent.balance += balanceChange;
  agent.balance = Math.max(0, agent.balance); // 不能低于 0
  society.prosperity += prosperityChange;
  society.prosperity = Math.max(0, Math.min(100, society.prosperity)); // 0-100

  return {
    agent: agentName,
    society: societyId,
    rule: rule.keyword,
    balanceChange: Math.round(balanceChange),
    newBalance: Math.round(agent.balance),
    prosperityChange: Math.round(prosperityChange),
    newProsperity: Math.round(society.prosperity)
  };
}

module.exports = { processEconomics, getEconomyRule, ECONOMY_RULES };