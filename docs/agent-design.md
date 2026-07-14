# Agent 层设计(Phase 4)

## 定位

单 Agent + ReAct 循环,面向个人知识库问答。不做多智能体:LiteSearch 是单一领域、本地 3B 模型驱动的场景,多智能体编排(planner/executor 分工、动态角色)解决的是长程复杂任务的协作问题,在这里属于过度设计。

设计上参考了 Aime(arXiv:2507.11988, ByteDance)中与单 Agent 场景相通的四个工程模式,并说明取舍。

## 借鉴的四个模式

### 1. Prompt 模块化组装

Aime 把 actor 的 system prompt 拆成 Persona + 工具描述 + 知识 + 环境 + 输出格式五个模块动态拼装(论文式 3)。本项目的 agent prompt 同样按模块组合,不硬编码一整块字符串:

- **Persona**:固定(知识库问答助手);
- **工具描述**:由注册的工具对象自动生成,新增工具不改 prompt 模板;
- **知识**:检索结果注入(这就是 RAG 上下文,对应论文的 κ);
- **输出格式**:严格的 JSON 结构约定(见下)。

对应 JD:"抽象通用开发框架与基础组件"。

### 2. 严格结构化输出 + 解析失败处理

论文强调输出必须按 schema 约束才能被可靠解析(式 3 的 Γ)。本项目用的 Qwen2.5-3B 格式遵循能力弱于大模型,ReAct 循环里 Action 解析失败预计是主要故障来源,因此:

- Agent 每轮输出约定为 JSON(`thought` / `action` / `action_input` / `final_answer`);
- 解析失败自动重试(带纠错提示),超过阈值则降级为直接检索;
- 每次解析失败记入 trace,作为 Phase 5 badcase 的一类固定来源。

### 3. 小工具集,精描述

论文的 Actor Factory 用工具 bundle 而非平铺全量工具,理由是全量工具会导致 LLM 选择低效或出错。3B 模型上该问题被放大,因此 v1 只提供 2-3 个工具:

- `search_notes`(必选):调用检索层;
- `calc_date`(辅助):日期计算。

每个工具带精确的一句话描述与参数 schema。

### 4. 执行过程实时进 trace

Aime 的 actor 通过 `Update_Progress` 在执行中途主动上报里程碑,而不是结束才汇报。映射到单 Agent:每轮 Thought/Action/Observation 都用现有的 `traced_stage()` 实时写入请求 trace,一次多轮工具调用的请求可以事后逐步复盘。

对应 JD:"日志、监控、故障定位"。

## 明确不做(v1)

- **Dynamic Planner(大步调整计划/小步派发)**:多跳问题分解("对比笔记里 A 和 B 方案")留作 stretch。当前场景绝大多数 query 单跳检索即可回答,先用评测集验证单跳质量,再考虑分解。
- **Actor Factory / 动态实例化**:只有一种 actor,没有按任务组装的需求。
