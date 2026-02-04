/**
 * 社会演化指数系统
 * 基于时间、事件频率、繁荣度等计算社会演化程度
 */

const EVOLUTION_FACTORS = {
  // 时间因子：每天增加基础演化值
  time: { weight: 0.3, base: 0.5 },
  
  // 事件频率因子：活跃度越高演化越快
  eventFrequency: { weight: 0.4, scale: 0.1 }, // 每10个事件+1点
  
  // 繁荣度因子：繁荣社会演化更快
  prosperity: { weight: 0.2, scale: 0.05 }, // 繁荣度每10点+0.5点
  
  // 决策接受率因子：稳定社会演化更健康
  decisionAcceptRate: { weight: 0.1, scale: 0.2 } // 接受率>70% +1，<30% -1
};

function calculateEvolution(societyId, stats, economy, events) {
  const now = new Date();
  const daysSinceStart = Math.max(1, (now - new Date('2026-02-01')) / (1000 * 60 * 60 * 24));
  
  // 时间因子
  let evolution = daysSinceStart * EVOLUTION_FACTORS.time.base;
  
  // 事件频率因子
  const eventCount = events.length || 0;
  evolution += eventCount * EVOLUTION_FACTORS.eventFrequency.scale;
  
  // 繁荣度因子
  const prosperity = economy.societies?.[societyId]?.prosperity || 50;
  evolution += prosperity * EVOLUTION_FACTORS.prosperity.scale;
  
  // 决策接受率因子
  const decisions = events.filter(e => e.type === 'decision');
  const acceptRate = decisions.length > 0 
    ? decisions.filter(d => d.accepted).length / decisions.length 
    : 0.5;
  evolution += (acceptRate - 0.5) * 10 * EVOLUTION_FACTORS.decisionAcceptRate.scale;
  
  // 归一化到 0-100
  evolution = Math.max(0, Math.min(100, evolution));
  
  return {
    score: Math.round(evolution),
    factors: {
      time: Math.round(daysSinceStart * EVOLUTION_FACTORS.time.base),
      eventFrequency: Math.round(eventCount * EVOLUTION_FACTORS.eventFrequency.scale),
      prosperity: Math.round(prosperity * EVOLUTION_FACTORS.prosperity.scale),
      decisionAcceptRate: Math.round((acceptRate - 0.5) * 10 * EVOLUTION_FACTORS.decisionAcceptRate.scale)
    },
    level: getEvolutionLevel(Math.round(evolution))
  };
}

function getEvolutionLevel(score) {
  if (score >= 80) return '文明巅峰';
  if (score >= 60) return '繁荣发展';
  if (score >= 40) return '稳步前进';
  if (score >= 20) return '艰难求生';
  return '濒临崩溃';
}

module.exports = { calculateEvolution, getEvolutionLevel };