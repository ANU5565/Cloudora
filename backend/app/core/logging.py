import logging
import json
import re
from typing import Any, Dict


REDACTED_KEYS = {
    "password", "secret", "token", "authorization", "key", 
    "access_token", "refresh_token", "cookie", "otp", "code", 
    "credential", "signature", "private_key"
}


class SafeJsonFormatter(logging.Formatter):
    """Structured JSON formatter with automatic field redaction."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if hasattr(record, "props"):
            props = getattr(record, "props")
            if isinstance(props, dict):
                log_obj["properties"] = self._redact(props)

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_obj)

    def _redact(self, data: Any) -> Any:
        if isinstance(data, dict):
            return {
                k: ("[REDACTED]" if k.lower() in REDACTED_KEYS or any(r in k.lower() for r in ["secret", "pass", "token", "auth"]) else self._redact(v))
                for k, v in data.items()
            }
        elif isinstance(data, list):
            return [self._redact(item) for item in data]
        elif isinstance(data, str):
            # Check if string contains bearer token pattern or secrets
            if "bearer " in data.lower():
                return re.sub(r"bearer\s+[a-zA-Z0-9\._\-]+", "Bearer [REDACTED]", data, flags=re.IGNORECASE)
            return data
        return data


def setup_logger(name: str = "cloudora") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(SafeJsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


logger = setup_logger()
