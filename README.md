# LiteSearch

领域无关的语义搜索 + RAG 服务 — 面向 AI 搜索工程能力建设的练手项目,覆盖检索请求编排、召回与排序、RAG/Agent 工具调用、数据处理与评测链路、日志监控与 Badcase 分析。

当前演示垂类是「花语集」:25 种花材语料(学名/科属/花语溯源/场景/搭配)+ 4 篇花艺理论(AIFD 十项/60-30-10 配色/花道流派/切花养护),支持语义搜索和 RAG 花束推荐(`/recommend`:双路召回花材与理论 → 本地 LLM 按"主花/配花/寄语"结构化输出)。引擎本身不绑定领域——换一份语料重新 `/ingest` 即是另一个垂类产品。数据源合规规划见 [docs/data-sources.md](docs/data-sources.md)。

## 结构

- `backend/` — Python + FastAPI,分层为 `models`(embedding/LLM 统一接口)、`ingestion`(文档处理+索引)、`retrieval`(检索编排)、`agent`(工具调用)、`observability`(请求级 trace)、`api`、`eval`(评测与 badcase)
- `frontend/` — React + Vite + TypeScript,搜索页已跑通端到端闭环
- `docs/` — 设计文档([Agent 层设计](docs/agent-design.md),含对 Aime 论文工程模式的取舍分析)

## 进展

Phase 0-1 已完成:本地 embedding(bge-m3)+ 本地 LLM(Qwen2.5-3B-Instruct-4bit, MLX)已接入,单路向量检索 + 请求级 trace 落盘 + 前后端闭环已跑通并验证。后续阶段:评测 baseline → 多路召回融合 → Agent 工具调用(设计见 [docs/agent-design.md](docs/agent-design.md))→ Badcase 自动归集。
