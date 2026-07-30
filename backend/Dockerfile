FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Dependencies first so this layer only rebuilds when they actually change.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

COPY app ./app
COPY data/corpus ./data/corpus

# mlx-lm is marked `sys_platform == 'darwin'` in pyproject.toml, so `uv sync`
# skips it here on Linux — DEEPSEEK_API_KEY must be set at runtime or the
# generation model has nothing to fall back to.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
