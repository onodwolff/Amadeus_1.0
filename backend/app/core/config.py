from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    api_token: str = Field(default="changeme_token", alias="API_TOKEN")
    api_port: int = Field(default=8100, alias="API_PORT")
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    mode: str = Field(default="paper", alias="MODE")  # backtest|paper|live
    exchange: str = Field(default="mock", alias="EXCHANGE")  # mock|binance

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
