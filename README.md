# LiteSearch

个人知识库 RAG/Agent 搜索服务 — 面向 AI 搜索工程能力建设的练手项目,覆盖检索请求编排、召回与排序、RAG/Agent 工具调用、数据处理与评测链路、日志监控与 Badcase 分析。

## 结构

- `backend/` — Python + FastAPI,分层为 `models`(embedding/LLM 统一接口)、`ingestion`(文档处理+索引)、`retrieval`(检索编排)、`agent`(工具调用)、`observability`(请求级 trace)、`api`、`eval`(评测与 badcase)
- `frontend/` — React + Vite + TypeScript,搜索页已跑通端到端闭环
- `docs/` — 设计文档([Agent 层设计](docs/agent-design.md),含对 Aime 论文工程模式的取舍分析)

## 进展

Phase 0-1 已完成:本地 embedding(bge-m3)+ 本地 LLM(Qwen2.5-3B-Instruct-4bit, MLX)已接入,单路向量检索 + 请求级 trace 落盘 + 前后端闭环已跑通并验证。后续阶段:评测 baseline → 多路召回融合 → Agent 工具调用(设计见 [docs/agent-design.md](docs/agent-design.md))→ Badcase 自动归集。
