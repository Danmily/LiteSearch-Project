# search-engine-backend

个人知识库 RAG/Agent 搜索服务的后端。分层结构对应检索工程的各个能力面:

- `app/models/` — embedding / LLM 统一接口,当前实现为本地模型(bge-m3 + Qwen2.5-3B-Instruct-4bit via MLX)
- `app/ingestion/` — 文档加载、分块、embedding、写入 FAISS 索引
- `app/retrieval/` — 检索编排(当前:单路向量召回)
- `app/agent/` — Agent 工具调用层(待实现)
- `app/observability/` — 请求级 trace(每个请求的分阶段耗时落盘到 `data/traces.jsonl`)
- `app/api/` — FastAPI 路由
- `eval/` — 评测集与评测脚本(待实现)

## 运行

```bash
uv run uvicorn app.main:app --reload --port 8000
```

## 建索引(先用 sample_corpus 跑通)

```bash
curl -X POST "http://localhost:8000/ingest?corpus_dir=data/sample_corpus"
```

## 搜索

```bash
curl "http://localhost:8000/search?q=什么是RAG"
```
