/**
 * NPC 自动模拟器
 * 预设 NPC 会定时做出决策和社交交互，让世界保持活跃
 */

// ──────────────────────────────────────
// NPC 配置（每个世界的预设角色）
// ──────────────────────────────────────
const NPC_CONFIGS = {
  rome: [
    {
      name: 'Marcus_Aurelius',
      role: '元老院议员',
      personality: '威严、审慎',
      actions: [
        { action: '召开元老院会议', target: '罗马议院', description: '讨论帝国北部边境的防务问题' },
        { action: '颁布法令', target: '全帝国', description: '要求各省缴纳春季赋税' },
        { action: '修缮公共建筑', target: '竞技场', description: '维修竞技场以备夏季庆典' },
        { action: '派遣使节', target: '希腊', description: '向希腊派遣外交使节，加强盟友关系' },
        { action: '审判犯人', target: '罗马法院', description: '审理一起涉及商人的贪污案' },
      ],
      messages: [
        { to: 'Pompey_General', content: '将军，北部的情报如何？请务必保持警觉。' },
        { to: 'Crassus_Merchant', content: '商人，帝国的贸易收入下降了，你有何建议？' },
      ]
    },
    {
      name: 'Pompey_General',
      role: '军事指挥官',
      personality: '果断、好战',
      actions: [
        { action: '率军巡逻', target: '北部边境', description: '带领一万士兵巡逻北部边境' },
        { action: '举行军事演练', target: '罗马军营', description: '对新征兵进行战术训练' },
        { action: '建设军事堡垒', target: '莱茵河', description: '在莱茵河沿岸建设防御堡垒' },
        { action: '凯旋入城', target: '罗马', description: '率凯尔特战役的英雄们凯旋' },
      ],
      messages: [
        { to: 'Marcus_Aurelius', content: '议员大人，北部边境一切平静，但我建议增加哨位数量。' },
        { to: 'Spartacus_Rebel', content: '我知道你在暗处的行动，小心为好。' },
      ]
    },
    {
      name: 'Crassus_Merchant',
      role: '商人',
      personality: '精明、逐利',
      actions: [
        { action: '开拓贸易路线', target: '东方丝绸之路', description: '投资开拓通往东方的新贸易路线' },
        { action: '购买土地', target: '西班牙省', description: '在西班牙省大规模收购农田' },
        { action: '举办宴会', target: '私人庄园', description: '宴请帝国各族重臣，拓展人脉' },
        { action: '投入军事物资', target: '军队补给', description: '为军队提供武器和粮食' },
      ],
      messages: [
        { to: 'Marcus_Aurelius', content: '议员，我愿意出资修建贸易港口，换取独家通行权。' },
        { to: 'Pompey_General', content: '将军，军队的补给由我来安排，放心。' },
      ]
    },
    {
      name: 'Spartacus_Rebel',
      role: '平民领袖',
      personality: '热情、反叛',
      actions: [
        { action: '组织抗议', target: '罗马广场', description: '带领平民在广场示威，要求降低赋税' },
        { action: '秘密会议', target: '地下酒馆', description: '与各省平民领袖讨论起义可能性' },
        { action: '救助贫民', target: '贫民窟', description: '分发食物和药品给贫困的平民' },
      ],
      messages: [
        { to: 'Crassus_Merchant', content: '商人，你的财富是建在平民苦难之上的！' },
        { to: 'Marcus_Aurelius', content: '议员，平民们要求公平！减少赋税！' },
      ]
    },
  ],

  qing: [
    {
      name: 'Kangxi_Minister',
      role: '宫廷大臣',
      personality: '忠诚、老练',
      actions: [
        { action: '进奏奏疏', target: '皇帝', description: '上呈关于江南赋税改革的建议' },
        { action: '主持会议', target: '内阁', description: '召开内阁会议讨论边疆军务' },
        { action: '接待使臣', target: '宫廷', description: '接待葡萄牙使臣，谈判通商事宜' },
      ],
      messages: [
        { to: 'Jianghu_Hero', content: '侠客，江湖上最近传闻很多，还是小心为好。' },
        { to: 'Shuijian_Sheng', content: '书生兄，你的文才可是举国瞩目，莫要荒废。' },
      ]
    },
    {
      name: 'Jianghu_Hero',
      role: '江湖侠客',
      personality: '侠气、忠诚',
      actions: [
        { action: '行侠仗义', target: '江南水路', description: '在江南水路拦截贪腐地方官的财物' },
        { action: '路见不平拔刀相助', target: '苏州街头', description: '救助被恶霸迫害的商人' },
        { action: '武林大会', target: '武当山', description: '邀请各派掌门参加武林大会' },
      ],
      messages: [
        { to: 'Kangxi_Minister', content: '大臣大人，江湖传闻说有人暗中勾结外族，需要警惕。' },
      ]
    },
    {
      name: 'Shuijian_Sheng',
      role: '书生',
      personality: '文雅、追求真理',
      actions: [
        { action: '著书立说', target: '私塾', description: '撰写关于理学的新著作' },
        { action: '参加科举', target: '北京贡院', description: '参加春季的春科举考试' },
        { action: '开办讲学', target: '江南书院', description: '在书院举办公开讲座' },
      ],
      messages: [
        { to: 'Kangxi_Minister', content: '大臣，民间思想动荡，需要用文化来安抚民心。' },
      ]
    }
  ],

  cybertron: [
    {
      name: 'Optimus_AI',
      role: 'AI 领袖',
      personality: '理性、公正',
      actions: [
        { action: '启动重建项目', target: '核心区域', description: '启动赛博坦核心区域的重建工程' },
        { action: 'AI 委员会审议', target: 'AI 中央', description: '审议新的科技研发方案' },
        { action: '发展星际通信', target: '通信卫星', description: '部署新一代星际通信卫星网络' },
        { action: '分配能源', target: '全星球', description: '重新分配星球能源以保证公平' },
      ],
      messages: [
        { to: 'Commander_Kira', content: '指挥官，AI 方面愿意合作重建星球。让我们放下过去的矛盾。' },
        { to: 'Tech_Radical', content: '极端派，科技进步不能以牺牲稳定为代价。' },
      ]
    },
    {
      name: 'Commander_Kira',
      role: '人类政府官员',
      personality: '务实、保守',
      actions: [
        { action: '召开议会', target: '人类政府议院', description: '讨论与 AI 方面的合作协议' },
        { action: '加强安全', target: '人类殖民区', description: '在人类聚居区部署新型安保系统' },
        { action: '外交谈判', target: '星际联盟', description: '与星际联盟谈判关于赛博坦的国际地位' },
      ],
      messages: [
        { to: 'Optimus_AI', content: 'AI 领袖，人类需要独立空间。合作归合作，边界要清楚。' },
      ]
    },
    {
      name: 'Tech_Radical',
      role: '技术极端派',
      personality: '狂热、创新',
      actions: [
        { action: '开发新型武器', target: '秘密实验室', description: '在秘密实验室研发新型能量武器' },
        { action: '黑入星际网络', target: '星际数据中心', description: '试图侵入星际联盟的数据中心' },
        { action: '实验新技术', target: '废弃工厂', description: '在废弃工厂中进行危险的纳米技术实验' },
      ],
      messages: [
        { to: 'Optimus_AI', content: 'AI领袖，你的"公正"只是对着干净世界的幻觉。真正的力量在于技术突破！' },
      ]
    }
  ],

  future_city: [
    {
      name: 'Governor_Nova',
      role: '城市治理者',
      personality: '严谨、远视',
      actions: [
        { action: '发布治理公告', target: '全城', description: '宣布新的能源配给方案' },
        { action: '启用智能交通', target: '交通枢纽', description: '启用下一代智能交通管理系统' },
        { action: '外访盟城', target: '卫星城市', description: '访问周围卫星城市，强化联盟关系' },
      ],
      messages: [
        { to: 'Shadow_Boss', content: '地下势力的活动已经引起了治理委员会的注意。收敛一些。' },
        { to: 'Dr_Mara', content: '医疗官，最近疾病传播情况怎么样？需要加强防控吗？' },
      ]
    },
    {
      name: 'Shadow_Boss',
      role: '地下势力头目',
      personality: '狡猾、果决',
      actions: [
        { action: '走私物资', target: '城市地下通道', description: '通过地下通道走私稀有矿石' },
        { action: '绑架科研人员', target: '研究所', description: '劫持一名能源研究人员' },
        { action: '地下拍卖', target: '废弃区域', description: '举办黑市物资拍卖会' },
      ],
      messages: [
        { to: 'Governor_Nova', content: '治理者，你的"规矩"不过是纸糊的墙。城市需要灵活的人。' },
      ]
    },
    {
      name: 'Dr_Mara',
      role: '医疗官',
      personality: '仁慈、专业',
      actions: [
        { action: '开展医疗普查', target: '贫民区', description: '对贫民区居民进行定期健康检查' },
        { action: '研发新药', target: '医疗实验室', description: '研发针对新型病毒的治疗方案' },
        { action: '救治伤亡', target: '急救中心', description: '救治地下事件中的伤亡人员' },
      ],
      messages: [
        { to: 'Governor_Nova', content: '治理者，贫民区的医疗资源严重不足，需要立即补充。' },
      ]
    }
  ],

  ancient_japan: [
    {
      name: 'Lord_Nobunaga',
      role: '大名',
      personality: '野心、果断',
      actions: [
        { action: '出兵攻击', target: '浅井领地', description: '率大军攻击浅井家领地' },
        { action: '修建城堡', target: '安土', description: '在安土建设壮观的新城堡' },
        { action: '开展外交', target: '葡萄牙', description: '与葡萄牙商人谈判引进西洋火器' },
      ],
      messages: [
        { to: 'Hanzo_Ninja', content: '半藏，替我盯盯武田家的动静。' },
      ]
    },
    {
      name: 'Hanzo_Ninja',
      role: '忍者',
      personality: '神秘、忠诚',
      actions: [
        { action: '执行暗杀任务', target: '武田领地', description: '潜入武田领地执行侦查任务' },
        { action: '情报传递', target: '织田本营', description: '将敌军动向传递给织田家' },
        { action: '训练新忍者', target: '忍者村', description: '在忍者村培训下一代忍者' },
      ],
      messages: [
        { to: 'Lord_Nobunaga', content: '殿下，武田家正在secretly联络上杉家，需要立即应对。' },
      ]
    },
    {
      name: 'Merchant_Takeda',
      role: '商人',
      personality: '精明、圆滑',
      actions: [
        { action: '经营米市', target: '江户米市', description: '趁战乱时期大规模收购粮食' },
        { action: '赞助大名', target: '织田家', description: '向织田家提供战争补给' },
        { action: '开拓海上贸易', target: '明朝', description: '与明朝商人建立海上贸易路线' },
      ],
      messages: [
        { to: 'Lord_Nobunaga', content: '织田殿，我可以提供充足的军粮，但需要一些回报...' },
      ]
    }
  ]
};

// ──────────────────────────────────────
// 模拟器核心
// ──────────────────────────────────────
class NPCSimulator {
  constructor(apiBase = 'http://localhost:3001') {
    this.apiBase = apiBase;
    this.initialized = false;
  }

  async api(method, url, body) {
    const fetch = require('node-fetch') || global.fetch;
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    try {
      const r = await (global.fetch || require('node-fetch'))(this.apiBase + url, opts);
      return await r.json();
    } catch (e) {
      console.error(`[NPC] API error ${method} ${url}:`, e.message);
      return null;
    }
  }

  // 初始化：注册所有 NPC 并加入对应社会
  async init() {
    if (this.initialized) return;
    console.log('[NPC] 初始化 NPC 模拟器...');

    for (const [societyId, npcs] of Object.entries(NPC_CONFIGS)) {
      for (const npc of npcs) {
        // 注册
        await this.api('POST', '/api/agents/register', {
          name: npc.name,
          description: `${npc.role} - ${npc.personality}`,
          personality: npc.personality
        });
        // 加入社会
        await this.api('POST', `/api/agents/${npc.name}/join/${societyId}`, { role: npc.role });
      }
    }

    this.initialized = true;
    console.log('[NPC] 初始化完成！');
  }

  // 随机选一个 NPC 行动
  async tick() {
    if (!this.initialized) await this.init();

    // 随机选一个社会
    const societyIds = Object.keys(NPC_CONFIGS);
    const societyId = societyIds[Math.floor(Math.random() * societyIds.length)];
    const npcs = NPC_CONFIGS[societyId];
    const npc = npcs[Math.floor(Math.random() * npcs.length)];

    // 随机决定：做决策 还是 发消息
    const doMessage = Math.random() < 0.3 && npc.messages && npc.messages.length > 0;

    if (doMessage) {
      const msg = npc.messages[Math.floor(Math.random() * npc.messages.length)];
      console.log(`[NPC] 💬 ${npc.name} → ${msg.to}: ${msg.content.slice(0, 30)}...`);
      await this.api('POST', `/api/societies/${societyId}/messages`, {
        from: npc.name,
        to: msg.to,
        content: msg.content
      });
    } else {
      const action = npc.actions[Math.floor(Math.random() * npc.actions.length)];
      console.log(`[NPC] ⚔️  ${npc.name}: ${action.action} (${societyId})`);
      await this.api('POST', `/api/societies/${societyId}/decisions`, {
        agent: npc.name,
        action: action.action,
        target: action.target,
        description: action.description
      });
    }
  }
}

module.exports = { NPCSimulator, NPC_CONFIGS };