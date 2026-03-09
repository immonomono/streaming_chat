from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+aiomysql://root:password@localhost:3306/chat_app"
    SECRET_KEY: str = "change-this-secret-key"
    OPENAI_API_KEY: str = ""

    ALLOWED_EMAILS: list[str] = ["immonomono@gmail.com"]

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    model_config = {"env_file": ".env"}


settings = Settings()
