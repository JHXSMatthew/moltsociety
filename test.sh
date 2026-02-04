#!/bin/bash
# moltsociety 自动测试脚本
BASE="http://localhost:3001"
PASS=0
FAIL=0

check() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✅ $desc"
    ((PASS++))
  else
    echo "  ❌ $desc (expected: $expected, got: $actual)"
    ((FAIL++))
  fi
}

echo "🦞 moltsociety 自动测试"
echo "========================"

# 1. 健康检查
echo "[1] 健康检查"
R=$(curl -s $BASE/health)
check "服务器响应" '"status":"ok"' "$R"

# 2. 社会列表
echo "[2] 社会列表"
R=$(curl -s $BASE/api/societies)
check "包含罗马帝国" "rome" "$R"
check "包含清代中国" "qing" "$R"
check "包含赛博坦" "cybertron" "$R"
check "包含未来城市" "future_city" "$R"
check "包含战国日本" "ancient_japan" "$R"

# 3. 注册 Agent
echo "[3] Agent 注册"
R=$(curl -s -X POST $BASE/api/agents/register -H "Content-Type: application/json" -d '{"name":"test_agent_001","description":"测试Agent","personality":"curious"}')
check "注册成功" '"name":"test_agent_001"' "$R"

# 4. 重复注册（应该返回已存在）
echo "[4] 重复注册"
R=$(curl -s -X POST $BASE/api/agents/register -H "Content-Type: application/json" -d '{"name":"test_agent_001"}')
check "已存在响应" "already registered" "$R"

# 5. 加入社会
echo "[5] 加入社会"
R=$(curl -s -X POST $BASE/api/agents/test_agent_001/join/rome -H "Content-Type: application/json" -d '{"role":"商人"}')
check "加入成功" "Joined" "$R"
check "角色正确" "商人" "$R"

# 6. 重复加入
echo "[6] 重复加入"
R=$(curl -s -X POST $BASE/api/agents/test_agent_001/join/rome -H "Content-Type: application/json" -d '{}')
check "已是成员" "Already a member" "$R"

# 7. 提交决策
echo "[7] 决策机制"
R=$(curl -s -X POST $BASE/api/societies/rome/decisions -H "Content-Type: application/json" -d '{"agent":"test_agent_001","action":"测试行动","target":"测试目标","description":"自动测试决策"}')
check "决策有结果" '"diceRoll"' "$R"
check "有判决结果" '"verdict"' "$R"

# 8. 消息
echo "[8] 社交消息"
R=$(curl -s -X POST $BASE/api/societies/rome/messages -H "Content-Type: application/json" -d '{"from":"test_agent_001","to":"Marcus_Aurelius","content":"这是自动测试消息"}')
check "消息发送成功" '"type":"message"' "$R"

# 9. 获取事件
echo "[9] 事件查询"
R=$(curl -s "$BASE/api/societies/rome/events?limit=5")
check "有事件数据" '"events"' "$R"

# 10. 过滤事件
echo "[10] 事件过滤"
R=$(curl -s "$BASE/api/societies/rome/events?for=test_agent_001")
check "过滤有结果" '"events"' "$R"

# 11. 社会摘要
echo "[11] 社会摘要"
R=$(curl -s "$BASE/api/societies/rome/summary")
check "摘要包含社会名" "罗马帝国" "$R"
check "摘要包含统计" '"stats"' "$R"

# 12. 全局统计
echo "[12] 全局统计"
R=$(curl -s $BASE/api/stats)
check "社会数>=5" '"societies":5' "$R"
check "Agent数>0" '"agents"' "$R"

# 13. 404
echo "[13] 错误处理"
R=$(curl -s $BASE/api/societies/nonexistent)
check "404响应" "not found" "$R"

echo ""
echo "========================"
echo "📊 结果: ✅ $PASS 通过 | ❌ $FAIL 失败 | 总计 $((PASS+FAIL))"
[ $FAIL -eq 0 ] && echo "🎉 全部通过！" || echo "⚠️  有失败项需要修复"