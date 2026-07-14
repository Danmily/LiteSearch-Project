# LiteSearch

个人知识库 RAG/Agent 搜索服务 — 面向 AI 搜索工程能力建设的练手项目,覆盖检索请求编排、召回与排序、RAG/Agent 工具调用、数据处理与评测链路、日志监控与 Badcase 分析。

## 结构

- `backend/` — Python + FastAPI,分层为 `models`(embedding/LLM 统一接口)、`ingestion`(文档处理+索引)、`retrieval`(检索编排)、`agent`(工具调用)、`observability`(请求级 trace)、`api`、`eval`(评测与 badcase)
- `frontend/` — React + Vite + TypeScript(搭建中)

## 进展

当前处于 Phase 1:本地 embedding(bge-m3)+ 本地 LLM(Qwen2.5-3B-Instruct-4bit, MLX)已接入,单路向量检索 + 请求级 trace 落盘已跑通。后续阶段见项目内部规划:评测 baseline → 多路召回融合 → Agent 工具调用 → Badcase 自动归集。
