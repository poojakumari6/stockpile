from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Credentials are never hardcoded. In local development these come from the
    .env file / docker-compose; in production they come from the host platform's
    environment variable configuration (Render / Railway / Fly.io).
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Either provide a full DATABASE_URL, or the individual POSTGRES_* parts.
    DATABASE_URL: str | None = None

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "inventory"

    # Comma separated list of origins allowed to call the API.
    CORS_ORIGINS: str = "*"

    @property
    def sqlalchemy_database_uri(self) -> str:
        if self.DATABASE_URL:
            # Render/Railway sometimes hand out postgres:// which SQLAlchemy
            # no longer accepts; normalise it.
            return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
