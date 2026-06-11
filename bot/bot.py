"""
Jolu Telegram-бот (Фаза 1).

Сценарии MVP:
  • /start <token> — привязка аккаунта с сайта (deep link)
  • уведомления компаниям о новых заявках
  • уведомления туристам об изменении статуса брони

Запуск:  python bot.py
Стек:    Python 3.12 + aiogram 3.x
"""
import asyncio
import logging

import jwt
from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandObject, CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

import config
import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jolu-bot")

bot = Bot(config.BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()


# ── /start с deep link ──────────────────────────────────────
@dp.message(CommandStart(deep_link=True))
async def start_with_token(message: Message, command: CommandObject):
    token = command.args or ""
    user_id = None
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        user_id = None

    if user_id and db.bind_telegram(user_id, message.chat.id):
        await message.answer(
            "✅ <b>Telegram подключён!</b>\n\n"
            "Теперь вы будете получать здесь:\n"
            "• статусы ваших броней,\n"
            "• напоминания о турах за 3 дня и за 1 день."
        )
    else:
        await message.answer(
            "👋 Привет! Это бот <b>Jolu</b> — туры по Кыргызстану.\n\n"
            "Чтобы подключить аккаунт, нажмите «Подключить Telegram» в личном "
            f"кабинете на сайте: {config.SITE_URL}/account"
        )


@dp.message(CommandStart())
async def start_plain(message: Message):
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🔍 Открыть каталог", url=f"{config.SITE_URL}/tours")]
        ]
    )
    await message.answer(
        "👋 Добро пожаловать в <b>Jolu</b> — все туры по Кыргызстану в одном месте.\n\n"
        "Подключите аккаунт на сайте, чтобы получать уведомления о бронях.",
        reply_markup=kb,
    )


@dp.message(F.text == "/help")
async def help_cmd(message: Message):
    await message.answer(
        "<b>Команды:</b>\n"
        "/start — подключить аккаунт\n"
        "/help — помощь\n\n"
        f"Каталог туров: {config.SITE_URL}/tours"
    )


# ── Уведомления (вызываются из сайта/Edge Function) ─────────
async def notify_company_new_booking(
    chat_id: int, tour_title: str, contact_name: str, people: int, booking_id: str
):
    """Мгновенное уведомление компании о новой заявке (ТЗ 3.2)."""
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✅ Открыть в кабинете",
                    url=f"{config.SITE_URL}/dashboard",
                )
            ]
        ]
    )
    await bot.send_message(
        chat_id,
        f"🔔 <b>Новая заявка!</b>\n\n"
        f"Тур: <b>{tour_title}</b>\n"
        f"Турист: {contact_name}\n"
        f"Человек: {people}\n"
        f"Заявка #{booking_id}",
        reply_markup=kb,
    )


async def notify_tourist_status(chat_id: int, tour_title: str, status_label: str):
    """Уведомление туристу об изменении статуса брони (ТЗ 3.1)."""
    await bot.send_message(
        chat_id,
        f"📋 Статус вашей брони изменился\n\n"
        f"Тур: <b>{tour_title}</b>\n"
        f"Новый статус: <b>{status_label}</b>",
    )


async def main():
    mode = "Supabase" if config.SUPABASE_ENABLED else "ДЕМО (без БД)"
    logger.info("Запуск Jolu-бота. Режим: %s", mode)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
