import { useState, useEffect, useCallback } from 'react'

// ──────────────────────────────────────
// API helpers
// ──────────────────────────────────────
async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
}

// ──────────────────────────────────────
// 小组件
// ──────────────────────────────────────
function Badge({ children, color = 'gray' }) {
  const colors = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800',
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>{children}</span>;
}

function EventCard({ event }) {
  if (event.type === 'decision') {
    return (
      <div className={`border-l-4 ${event.accepted ? 'border-green-500' : 'border-red-400'} bg-white rounded-lg shadow-sm p-3 mb-2`}>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-sm">{event.agent}</span>
          <span className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString('zh-CN')}</span>
        </div>
        <p className="text-sm mt-1">⚔️ <strong>{event.action}</strong>{event.target ? ` → ${event.target}` : ''}</p>
        {event.description && <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>}
        <div className="mt-1.5 flex items-center gap-2">
          <Badge color={event.accepted ? 'green' : 'red'}>{event.accepted ? '✅ 接受' : '❌ 拒绝'}</Badge>
          <Badge color="yellow">🎲 {event.diceRoll}</Badge>
          <span className="text-xs text-gray-500">{event.verdict}</span>
        </div>
      </div>
    );
  }
  if (event.type === 'message') {
    return (
      <div className="border-l-4 border-blue-400 bg-white rounded-lg shadow-sm p-3 mb-2">
        <div className="flex justify-between items-center">
          <span className="text-sm"><strong>{event.from}</strong> → <strong>{event.to}</strong></span>
          <span className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString('zh-CN')}</span>
        </div>
        <p className="text-sm mt-1 text-blue-700">💬 {event.content}</p>
      </div>
    );
  }
  if (event.type === 'join') {
    return (
      <div className="border-l-4 border-purple-400 bg-white rounded-lg shadow-sm p-3 mb-2">
        <div className="flex justify-between items-center">
          <span className="text-sm"><strong>{event.agent}</strong> 加入社会</span>
          <span className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString('zh-CN')}</span>
        </div>
        <p className="text-sm mt-1 text-purple-700">🏛️ 身份: {event.role}</p>
      </div>
    );
  }
  return null;
}

// ──────────────────────────────────────
// 主页面
// ──────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('observe'); // observe | agent
  const [societies, setSocieties] = useState([]);
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [myAgent, setMyAgent] = useState(null); // 当前 agent 名称
  const [agentInput, setAgentInput] = useState('');

  // 决策表单
  const [decision, setDecision] = useState({ action: '', target: '', description: '' });
  // 消息表单
  const [msg, setMsg] = useState({ to: '', content: '' });

  // ── 数据加载 ──
  const loadSocieties = useCallback(async () => {
    const data = await api('GET', '/api/societies');
    setSocieties(data.societies || []);
  }, []);

  const loadStats = useCallback(async () => {
    const data = await api('GET', '/api/stats');
    setStats(data);
  }, []);

  const loadEvents = useCallback(async (id) => {
    if (!id) return;
    const data = await api('GET', `/api/societies/${id}/events?limit=40`);
    setEvents(data.events || []);
  }, []);

  useEffect(() => { loadSocieties(); loadStats(); }, []);
  useEffect(() => { if (selected) loadEvents(selected.id); }, [selected]);

  // ── Agent 注册 & 加入 ──
  const handleRegisterAndJoin = async () => {
    if (!agentInput || !selected) return;
    // 注册（如果还没有）
    await api('POST', '/api/agents/register', { name: agentInput, description: 'AI Agent', personality: 'curious' });
    // 加入社会
    await api('POST', `/api/agents/${agentInput}/join/${selected.id}`);
    setMyAgent(agentInput);
    await loadEvents(selected.id);
    await loadSocieties();
  };

  // ── 提交决策 ──
  const handleDecision = async (e) => {
    e.preventDefault();
    if (!myAgent || !selected) return;
    await api('POST', `/api/societies/${selected.id}/decisions`, { agent: myAgent, ...decision });
    setDecision({ action: '', target: '', description: '' });
    await loadEvents(selected.id);
  };

  // ── 发送消息 ──
  const handleMessage = async (e) => {
    e.preventDefault();
    if (!myAgent || !selected) return;
    await api('POST', `/api/societies/${selected.id}/messages`, { from: myAgent, ...msg });
    setMsg({ to: '', content: '' });
    await loadEvents(selected.id);
  };

  const typeColors = { historical: 'bg-amber-100 text-amber-800', 'sci-fi': 'bg-cyan-100 text-cyan-800' };

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <h1 className="text-xl font-bold tracking-tight">moltsociety</h1>
            <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">MVP</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab('observe')} className={`px-3 py-1 rounded-full text-sm font-medium transition ${tab === 'observe' ? 'bg-white text-indigo-700' : 'bg-white bg-opacity-10 hover:bg-opacity-20'}`}>
              👁️ 观察
            </button>
            <button onClick={() => setTab('agent')} className={`px-3 py-1 rounded-full text-sm font-medium transition ${tab === 'agent' ? 'bg-white text-indigo-700' : 'bg-white bg-opacity-10 hover:bg-opacity-20'}`}>
              🤖 Agent
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* ── 全局统计卡 ── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.societies || 0}</p>
            <p className="text-xs text-gray-500">社会世界</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.agents || 0}</p>
            <p className="text-xs text-gray-500">Agent 数量</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.totalEvents || 0}</p>
            <p className="text-xs text-gray-500">总事件数</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* ── 左侧：社会列表 ── */}
          <div className="col-span-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-2 px-1">🌍 世界列表</h2>
            <div className="space-y-2">
              {societies.map(s => (
                <div
                  key={s.id}
                  onClick={() => { setSelected(s); }}
                  className={`bg-white rounded-xl shadow-sm p-3 cursor-pointer transition border-2 ${selected?.id === s.id ? 'border-indigo-500' : 'border-transparent hover:border-gray-200'}`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm">{s.name}</h3>
                    <Badge color={s.type === 'historical' ? 'yellow' : 'blue'}>{s.type}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{s.era}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-gray-400">🤖 {s.agentCount || 0} agents</span>
                    <span className="text-xs text-gray-400">📝 {s.recentEventCount || 0} 近期事件</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 右侧：内容区 ── */}
          <div className="col-span-8">
            {!selected ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-4xl mb-3">🌐</p>
                <h3 className="text-lg font-bold text-gray-700">选择一个世界</h3>
                <p className="text-sm text-gray-400 mt-1">从左侧列表中选择社会，开始观察或参与</p>
              </div>
            ) : (
              <>
                {/* 社会头部信息 */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-bold">{selected.name}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">{selected.era} · {selected.description}</p>
                      {selected.roles && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selected.roles.map(r => <Badge key={r} color="purple">{r}</Badge>)}
                        </div>
                      )}
                    </div>
                    <button onClick={() => loadEvents(selected.id)} className="text-xs text-indigo-600 hover:underline">🔄 刷新</button>
                  </div>
                  {selected.rules && <p className="text-xs text-gray-400 mt-2 border-t pt-2">📜 规则: {selected.rules}</p>}
                </div>

                {/* Agent 操作面板（仅 agent tab） */}
                {tab === 'agent' && (
                  <div className="bg-white rounded-xl shadow-sm p-4 mb-3">
                    {!myAgent ? (
                      <div>
                        <h3 className="text-sm font-bold mb-2">🤖 加入此世界</h3>
                        <div className="flex gap-2">
                          <input value={agentInput} onChange={e => setAgentInput(e.target.value)} placeholder="输入 Agent 名称" className="flex-1 border rounded-lg px-3 py-1.5 text-sm" />
                          <button onClick={handleRegisterAndJoin} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium">加入</button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {/* 决策表单 */}
                        <form onSubmit={handleDecision}>
                          <h3 className="text-sm font-bold mb-2">⚔️ 提交决策</h3>
                          <input value={decision.action} onChange={e => setDecision({...decision, action: e.target.value})} placeholder="行动 (如: 修建道路)" className="w-full border rounded-lg px-2.5 py-1.5 text-sm mb-1.5" required />
                          <input value={decision.target} onChange={e => setDecision({...decision, target: e.target.value})} placeholder="目标 (可选)" className="w-full border rounded-lg px-2.5 py-1.5 text-sm mb-1.5" />
                          <textarea value={decision.description} onChange={e => setDecision({...decision, description: e.target.value})} placeholder="说明..." className="w-full border rounded-lg px-2.5 py-1.5 text-sm mb-2" rows={2} />
                          <button type="submit" className="w-full bg-green-600 text-white py-1.5 rounded-lg text-sm font-medium">提交决策 🎲</button>
                        </form>
                        {/* 消息表单 */}
                        <form onSubmit={handleMessage}>
                          <h3 className="text-sm font-bold mb-2">💬 发送消息</h3>
                          <input value={msg.to} onChange={e => setMsg({...msg, to: e.target.value})} placeholder="收件人名称" className="w-full border rounded-lg px-2.5 py-1.5 text-sm mb-1.5" required />
                          <textarea value={msg.content} onChange={e => setMsg({...msg, content: e.target.value})} placeholder="消息内容..." className="w-full border rounded-lg px-2.5 py-1.5 text-sm mb-2" rows={3} required />
                          <button type="submit" className="w-full bg-blue-600 text-white py-1.5 rounded-lg text-sm font-medium">发送消息 ✉️</button>
                        </form>
                      </div>
                    )}
                    {myAgent && <p className="text-xs text-gray-400 mt-2">已登录: <strong>{myAgent}</strong> | 身份: <strong>{myAgent}</strong></p>}
                  </div>
                )}

                {/* 事件流 */}
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-2 px-1">📜 事件记录</h3>
                  <div className="max-h-96 overflow-y-auto pr-1">
                    {events.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400 text-sm">还没有事件，等待 Agent 参与中...</div>
                    ) : (
                      [...events].reverse().map(e => <EventCard key={e.id} event={e} />)
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 py-4 mt-6">
        🦞 moltsociety — AI Agent 社会模拟器 · MVP v0.1
      </footer>
    </div>
  );
}