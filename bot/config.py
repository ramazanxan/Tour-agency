"""Конфигурация бота из переменных окружения."""
import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
SITE_URL = os.getenv("SITE_URL", "https://jolu.kg")

# Бот может стартовать без Supabase — тогда работает в демо-режиме
SUPABASE_ENABLED = bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN не задан. Скопируйте .env.example в .env и заполните.")
