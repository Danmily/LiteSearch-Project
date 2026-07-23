from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.gallery import store

router = APIRouter(prefix="/gallery")


class CreatePostBody(BaseModel):
    nickname: str
    caption: str = ""
    snapshot: dict


class LikeBody(BaseModel):
    nickname: str


class CommentBody(BaseModel):
    nickname: str
    body: str


@router.post("/posts")
def create_post(body: CreatePostBody) -> dict:
    post_id = store.create_post(body.nickname, body.caption, body.snapshot)
    return {"id": post_id}


@router.get("/posts")
def list_posts(sort: str = "new", limit: int = 30, viewer: str | None = None) -> dict:
    return {"posts": store.list_posts(sort=sort, limit=limit, viewer=viewer)}


@router.get("/posts/{post_id}")
def get_post(post_id: int, viewer: str | None = None) -> dict:
    post = store.get_post(post_id, viewer=viewer)
    if post is None:
        raise HTTPException(status_code=404, detail="post not found")
    return post


@router.post("/posts/{post_id}/like")
def like_post(post_id: int, body: LikeBody) -> dict:
    if store.get_post(post_id) is None:
        raise HTTPException(status_code=404, detail="post not found")
    liked = store.toggle_like(post_id, body.nickname)
    post = store.get_post(post_id)
    return {"liked": liked, "like_count": post["like_count"]}


@router.post("/posts/{post_id}/comments")
def add_comment(post_id: int, body: CommentBody) -> dict:
    if store.get_post(post_id) is None:
        raise HTTPException(status_code=404, detail="post not found")
    if not body.body.strip():
        raise HTTPException(status_code=400, detail="comment body is empty")
    return store.add_comment(post_id, body.nickname, body.body)
