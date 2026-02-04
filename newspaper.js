/**
 * 社会日报生成器
 * 基于最近事件自动生成新闻摘要
 * 每个社会每次生成一份"日报"
 */

const NEWSPAPER_TEMPLATES = {
  rome: {
    name: '罗马日报',
    masthead: '🏛️ ROMA GAZETTE',
    reporters: ['古典史笔', '战场特派', '商界评论人'],
  },
  qing: {
    name: '清朝邸报',
    masthead: '📰 清朝邸报 · 康熙年间',
    reporters: ['宫廷新闻官', '江湖消息人士', '民间记者'],
  },
  cybertron: {
    name: '赛博日报',
    masthead: '📡 CYBERTRON DAILY · 星际版',
    reporters: ['AI 新闻网络', '人类记者联盟', '独立播报者'],
  },
  future_city: {
    name: 'Nova 时报',
    masthead: '🏙️ NOVA TIMES · 智能版',
    reporters: ['智能编辑', '地下信息源', '医疗新闻部'],
  },
  ancient_japan: {
    name: '战国风云报',
    masthead: '⚔️ 戦国風雲報',
    reporters: ['宫廷笔客', '忍者消息网', '商路行商'],
  }
};

// 新闻标题模板
const HEADLINE_TEMPLATES = {
  decision_accepted: [
    '{agent} 的"{action}"方案获得社会认可！',
    '重大决策：{agent} 成功推动"{action}"',
    '社会热议：{agent} 的"{action}"引发广泛关注',
    '政务快报：{agent} "{action}" 决议通过',
  ],
  decision_rejected: [
    '{agent} 的"{action}"方案遭到社会质疑',
    '争议焦点：{agent} 提出的"{action}"被否决',
    '民间议论：{agent} 的"{action}"计划暂搁',
  ],
  message: [
    '{from} 向 {to} 发出信号，外交局势微妙',
    '{from} 与 {to} 展开对话，引发各方关注',
  ],
  join: [
    '新面孔！{agent} 以"{role}"身份登场',
    '{agent} 正式加入，担任"{role}"要职',
  ]
};

function pickTemplate(templates) {
  return templates[Math.floor(Math.random() * templates.length)];
}

function formatHeadline(event) {
  let templates;
  if (event.type === 'decision') {
    templates = event.accepted ? HEADLINE_TEMPLATES.decision_accepted : HEADLINE_TEMPLATES.decision_rejected;
  } else if (event.type === 'message') {
    templates = HEADLINE_TEMPLATES.message;
  } else if (event.type === 'join') {
    templates = HEADLINE_TEMPLATES.join;
  } else {
    return null;
  }

  let headline = pickTemplate(templates);
  headline = headline
    .replace('{agent}', event.agent || event.from || '未知')
    .replace('{action}', event.action || '未知行动')
    .replace('{from}', event.from || '未知')
    .replace('{to}', event.to || '未知')
    .replace('{role}', event.role || '未知');

  return headline;
}

/**
 * 生成社会日报
 * @param {string} societyId
 * @param {Array} recentEvents - 最近的事件
 * @returns {object} 日报对象
 */
function generateNewspaper(societyId, recentEvents) {
  const template = NEWSPAPER_TEMPLATES[societyId] || {
    name: '社会日报', masthead: '📰 社会日报', reporters: ['记者']
  };

  const now = new Date();
  const articles = [];

  // 从最近事件中生成文章
  const last10 = recentEvents.slice(-10);
  for (const event of last10) {
    const headline = formatHeadline(event);
    if (!headline) continue;

    const reporter = template.reporters[Math.floor(Math.random() * template.reporters.length)];

    let body = '';
    if (event.type === 'decision') {
      body = event.description || `${event.agent} 提出了 "${event.action}" 的决策`;
      if (event.accepted) {
        body += `。骰子判定为 ${event.diceRoll}，社会表示${event.diceRoll >= 5 ? '热烈欢迎' : '谨慎接受'}。`;
      } else {
        body += `。然而骰子判定仅为 ${event.diceRoll}，此决策未能获得社会支持。`;
      }
      if (event.economy) {
        body += ` 经济影响：金币变动 ${event.economy.balanceChange >= 0 ? '+' : ''}${event.economy.balanceChange}，繁荣度 ${event.economy.prosperityChange >= 0 ? '+' : ''}${event.economy.prosperityChange}。`;
      }
    } else if (event.type === 'message') {
      body = `据悉，${event.from} 近日向 ${event.to} 传达了重要信息："${event.content}"。此举可能预示着深层的政治变动。`;
    } else if (event.type === 'join') {
      body = `${event.agent} 近日正式加入社会，担任 "${event.role}" 一职。各方对此新面孔表示期待。`;
    }

    articles.push({
      headline,
      body,
      reporter,
      timestamp: event.timestamp,
      eventId: event.id
    });
  }

  // 生成编辑部评论
  const decisions = last10.filter(e => e.type === 'decision');
  const acceptRate = decisions.length > 0
    ? Math.round(decisions.filter(d => d.accepted).length / decisions.length * 100)
    : 50;

  const editorialComment = acceptRate >= 70
    ? '近期社会趋于稳定，决策接受率较高，各方势力似乎达成了默契。'
    : acceptRate >= 40
    ? '社会局势变化莫测，决策通过率参差不齐，各方仍在博弈。'
    : '社会风云动荡，多数决策遭到质疑，政治格局正处于危险时期。';

  return {
    id: `news_${societyId}_${Date.now()}`,
    societyId,
    title: template.masthead,
    date: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    articles: articles.slice(0, 5), // 最多 5 条新闻
    editorial: {
      title: '编辑部评析',
      content: editorialComment,
      acceptRate
    },
    generatedAt: now.toISOString()
  };
}

module.exports = { generateNewspaper, NEWSPAPER_TEMPLATES };