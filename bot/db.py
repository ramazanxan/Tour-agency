"""Тонкая обёртка над Supabase. В демо-режиме (без env) — заглушки."""
from __future__ import annotations

from typing import Optional

import config

if config.SUPABASE_ENABLED:
    from supabase import create_client, Client

    _client: Optional["Client"] = create_client(
        config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY
    )
else:
    _client = None


def bind_telegram(user_id: str, tg_chat_id: int) -> bool:
    """Привязать tg_chat_id к пользователю (deep link со страницы аккаунта)."""
    if _client is None:
        return False
    _client.table("users").update({"tg_chat_id": tg_chat_id}).eq("id", user_id).execute()
    return True


def get_chat_id_for_user(user_id: str) -> Optional[int]:
    if _client is None:
        return None
    res = _client.table("users").select("tg_chat_id").eq("id", user_id).single().execute()
    return (res.data or {}).get("tg_chat_id")


def get_company_owner_chat(company_id: str) -> Optional[int]:
    """tg_chat_id владельца компании — для уведомлений о заявках."""
    if _client is None:
        return None
    res = (
        _client.table("companies")
        .select("owner_user_id, users!inner(tg_chat_id)")
        .eq("id", company_id)
        .single()
        .execute()
    )
    data = res.data or {}
    user = data.get("users") or {}
    return user.get("tg_chat_id")
