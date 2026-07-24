from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.auth_routes import optional_user, require_user
from app.gallery import store

router = APIRouter(prefix="/gallery")


class CreatePostBody(BaseModel):
    caption: str = ""
    snapshot: dict


class CommentBody(BaseModel):
    body: str


@router.post("/posts")
def create_post(body: CreatePostBody, user: dict = Depends(require_user)) -> dict:
    post_id = store.create_post(user["nickname"], body.caption, body.snapshot)
    return {"id": post_id}


@router.get("/posts")
def list_posts(sort: str = "new", limit: int = 30, user: dict | None = Depends(optional_user)) -> dict:
    viewer = user["nickname"] if user else None
    return {"posts": store.list_posts(sort=sort, limit=limit, viewer=viewer)}


@router.get("/posts/{post_id}")
def get_post(post_id: int, user: dict | None = Depends(optional_user)) -> dict:
    viewer = user["nickname"] if user else None
    post = store.get_post(post_id, viewer=viewer)
    if post is None:
        raise HTTPException(status_code=404, detail="post not found")
    return post


@router.post("/posts/{post_id}/like")
def like_post(post_id: int, user: dict = Depends(require_user)) -> dict:
    if store.get_post(post_id) is None:
        raise HTTPException(status_code=404, detail="post not found")
    liked = store.toggle_like(post_id, user["nickname"])
    post = store.get_post(post_id)
    return {"liked": liked, "like_count": post["like_count"]}


@router.post("/posts/{post_id}/comments")
def add_comment(post_id: int, body: CommentBody, user: dict = Depends(require_user)) -> dict:
    if store.get_post(post_id) is None:
        raise HTTPException(status_code=404, detail="post not found")
    if not body.body.strip():
        raise HTTPException(status_code=400, detail="comment body is empty")
    return store.add_comment(post_id, user["nickname"], body.body)
