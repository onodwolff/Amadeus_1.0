# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # .env читается из backend/, регистр в env-переменных не строгий
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # дефолты; имена env-переменных возьмутся автоматически: API_TOKEN, API_PORT, ...
    api_token: str = "changeme_token"
    api_port: int = 8100
    api_host: str = "0.0.0.0"
    log_level: str = "INFO"
    mode: str = "paper"      # backtest|paper|live
    exchange: str = "mock"   # mock|binance

settings = Settings()
