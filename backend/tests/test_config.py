import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_production_requires_explicit_jwt_secret():
    with pytest.raises(ValidationError, match="JWT_SECRET_KEY"):
        Settings(_env_file=None, APP_ENV="production", JWT_SECRET_KEY=None)


def test_development_generates_ephemeral_jwt_secret():
    settings = Settings(_env_file=None, APP_ENV="development", JWT_SECRET_KEY=None)

    assert settings.JWT_SECRET_KEY
    assert len(settings.JWT_SECRET_KEY) >= 32
