import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth_routes import router as auth_router
from app.api.gallery_routes import router as gallery_router
from app.api.routes import router
from app.auth.store import init_db as init_auth_db
from app.gallery.store import init_db
from app.ingestion.pipeline import DEFAULT_INDEX_PATH, build_index
from app.models.local_embedding import get_embedding_model
from app.observability.tracing import start_trace

app = FastAPI(title="AI Search Engine")
init_db()
init_auth_db()

if not (DEFAULT_INDEX_PATH / "vectors.faiss").exists():
    # First boot on a fresh deployment: the corpus is committed but the
    # built FAISS index is gitignored, so build it once from scratch.
    build_index(DEFAULT_INDEX_PATH.parent / "corpus")
else:
    # build_index() above already loads the embedding model as a side
    # effect; when the index already exists we still want that load to
    # happen now (paying the cold-start cost at boot) rather than on
    # whichever live request happens to arrive first.
    get_embedding_model()

_extra_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", *_extra_origins],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def tracing_middleware(request: Request, call_next):
    if request.url.path in {"/health", "/docs", "/openapi.json", "/plan"}:
        # /plan manages its own trace lifecycle inside run_pipeline() because it
        # streams: call_next() returns once the StreamingResponse is constructed,
        # before the body generator has actually run — a finally-block finish()
        # here would cut off every stage recorded during the later agent turns.
        return await call_next(request)

    trace = start_trace(
        route=request.url.path,
        query=request.query_params.get("q", ""),
    )
    status = "ok"
    try:
        response = await call_next(request)
        if response.status_code >= 400:
            status = "error"
        return response
    except Exception:
        status = "error"
        raise
    finally:
        trace.finish(status=status)


app.include_router(router)
app.include_router(gallery_router)
app.include_router(auth_router)
