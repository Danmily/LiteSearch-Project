import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[2] / "data" / "gallery.db"

NICKNAME_MAX = 24
CAPTION_MAX = 300
COMMENT_MAX = 500


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nickname TEXT NOT NULL,
                caption TEXT,
                snapshot TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS likes (
                post_id INTEGER NOT NULL REFERENCES posts(id),
                nickname TEXT NOT NULL,
                PRIMARY KEY (post_id, nickname)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL REFERENCES posts(id),
                nickname TEXT NOT NULL,
                body TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )


def _clip(text: str, limit: int) -> str:
    return text.strip()[:limit]


def _now() -> str:
    return datetime.now(UTC).isoformat()


def create_post(nickname: str, caption: str, snapshot: dict) -> int:
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO posts (nickname, caption, snapshot, created_at) VALUES (?, ?, ?, ?)",
            (_clip(nickname, NICKNAME_MAX), _clip(caption, CAPTION_MAX), json.dumps(snapshot), _now()),
        )
        return cur.lastrowid


def _row_to_post(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "nickname": row["nickname"],
        "caption": row["caption"],
        "snapshot": json.loads(row["snapshot"]),
        "created_at": row["created_at"],
        "like_count": row["like_count"],
        "comment_count": row["comment_count"],
    }


def list_posts(sort: str = "new", limit: int = 30, viewer: str | None = None) -> list[dict]:
    order = "like_count DESC, p.created_at DESC" if sort == "top" else "p.created_at DESC"
    query = f"""
        SELECT p.*,
               (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
               (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
        FROM posts p
        ORDER BY {order}
        LIMIT ?
    """
    viewer_clip = _clip(viewer, NICKNAME_MAX) if viewer else None
    with _connect() as conn:
        rows = conn.execute(query, (limit,)).fetchall()
        liked_ids: set[int] = set()
        if viewer_clip:
            liked_rows = conn.execute(
                "SELECT post_id FROM likes WHERE nickname = ?", (viewer_clip,)
            ).fetchall()
            liked_ids = {r["post_id"] for r in liked_rows}
    posts = [_row_to_post(r) for r in rows]
    for p in posts:
        p["liked_by_me"] = p["id"] in liked_ids
    return posts


def get_post(post_id: int, viewer: str | None = None) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT p.*,
                   (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
                   (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
            FROM posts p WHERE p.id = ?
            """,
            (post_id,),
        ).fetchone()
        if row is None:
            return None
        post = _row_to_post(row)
        comment_rows = conn.execute(
            "SELECT id, nickname, body, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC",
            (post_id,),
        ).fetchall()
        liked_by_me = False
        if viewer:
            liked_by_me = (
                conn.execute(
                    "SELECT 1 FROM likes WHERE post_id = ? AND nickname = ?",
                    (post_id, _clip(viewer, NICKNAME_MAX)),
                ).fetchone()
                is not None
            )
    post["comments"] = [dict(c) for c in comment_rows]
    post["liked_by_me"] = liked_by_me
    return post


def toggle_like(post_id: int, nickname: str) -> bool:
    nickname = _clip(nickname, NICKNAME_MAX)
    with _connect() as conn:
        existing = conn.execute(
            "SELECT 1 FROM likes WHERE post_id = ? AND nickname = ?", (post_id, nickname)
        ).fetchone()
        if existing:
            conn.execute("DELETE FROM likes WHERE post_id = ? AND nickname = ?", (post_id, nickname))
            return False
        conn.execute("INSERT INTO likes (post_id, nickname) VALUES (?, ?)", (post_id, nickname))
        return True


def add_comment(post_id: int, nickname: str, body: str) -> dict:
    created_at = _now()
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO comments (post_id, nickname, body, created_at) VALUES (?, ?, ?, ?)",
            (post_id, _clip(nickname, NICKNAME_MAX), _clip(body, COMMENT_MAX), created_at),
        )
        return {
            "id": cur.lastrowid,
            "nickname": _clip(nickname, NICKNAME_MAX),
            "body": _clip(body, COMMENT_MAX),
            "created_at": created_at,
        }
