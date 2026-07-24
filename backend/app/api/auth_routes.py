import re

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.auth import store
from app.auth.security import hash_password, verify_password

router = APIRouter(prefix="/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PASSWORD_MIN = 8


class RegisterBody(BaseModel):
    email: str
    password: str
    nickname: str


class LoginBody(BaseModel):
    email: str
    password: str


def _user_payload(user: dict, token: str) -> dict:
    return {"token": token, "email": user["email"], "nickname": user["nickname"]}


@router.post("/register")
def register(body: RegisterBody) -> dict:
    email = body.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="邮箱格式不对")
    if len(body.password) < PASSWORD_MIN:
        raise HTTPException(status_code=400, detail=f"密码至少 {PASSWORD_MIN} 位")
    if not body.nickname.strip():
        raise HTTPException(status_code=400, detail="昵称不能为空")
    if store.get_user_by_email(email) is not None:
        raise HTTPException(status_code=409, detail="这个邮箱已经注册过了")

    user = store.create_user(email, hash_password(body.password), body.nickname)
    token = store.create_session(user["id"])
    return _user_payload(user, token)


@router.post("/login")
def login(body: LoginBody) -> dict:
    email = body.email.strip().lower()
    user = store.get_user_by_email(email)
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="邮箱或密码不对")
    token = store.create_session(user["id"])
    return _user_payload(user, token)


@router.post("/logout")
def logout(authorization: str | None = Header(None)) -> dict:
    token = _extract_token(authorization)
    if token:
        store.delete_session(token)
    return {"ok": True}


@router.get("/me")
def me(authorization: str | None = Header(None)) -> dict:
    token = _extract_token(authorization)
    user = store.get_user_by_token(token) if token else None
    if user is None:
        raise HTTPException(status_code=401, detail="未登录")
    return {"email": user["email"], "nickname": user["nickname"]}


def _extract_token(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization.removeprefix("Bearer ").strip() or None


def require_user(authorization: str | None = Header(None)) -> dict:
    token = _extract_token(authorization)
    user = store.get_user_by_token(token) if token else None
    if user is None:
        raise HTTPException(status_code=401, detail="请先登录")
    return user


def optional_user(authorization: str | None = Header(None)) -> dict | None:
    token = _extract_token(authorization)
    return store.get_user_by_token(token) if token else None
