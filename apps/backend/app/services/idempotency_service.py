"""In-process idempotency guard for critical POST endpoints."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from threading import Lock
from typing import Any, Optional


@dataclass
class _IdempotencyRecord:
    request_hash: str
    status: str  # processing | completed
    status_code: Optional[int] = None
    response_body: Optional[Any] = None
    expires_at: Optional[datetime] = None


class IdempotencyService:
    _records: dict[str, _IdempotencyRecord] = {}
    _lock = Lock()
    _ttl_minutes = 10

    @classmethod
    def _make_key(cls, endpoint: str, user_id: str, idempotency_key: str) -> str:
        return f"{endpoint}:{user_id}:{idempotency_key}"

    @classmethod
    def _cleanup(cls) -> None:
        now = datetime.utcnow()
        expired = [k for k, v in cls._records.items() if v.expires_at and v.expires_at <= now]
        for k in expired:
            cls._records.pop(k, None)

    @classmethod
    def begin(
        cls,
        *,
        endpoint: str,
        user_id: str,
        idempotency_key: str,
        request_hash: str,
    ) -> tuple[str, Optional[_IdempotencyRecord]]:
        """
        Returns:
        - ("started", None): request can proceed
        - ("replay", record): return cached response
        - ("processing", None): same request in progress
        - ("conflict", None): same key used with different payload
        """
        key = cls._make_key(endpoint, user_id, idempotency_key)
        with cls._lock:
            cls._cleanup()
            record = cls._records.get(key)
            if not record:
                cls._records[key] = _IdempotencyRecord(
                    request_hash=request_hash,
                    status="processing",
                    expires_at=datetime.utcnow() + timedelta(minutes=cls._ttl_minutes),
                )
                return "started", None

            if record.request_hash != request_hash:
                return "conflict", None

            if record.status == "completed":
                return "replay", record

            return "processing", None

    @classmethod
    def complete(
        cls,
        *,
        endpoint: str,
        user_id: str,
        idempotency_key: str,
        request_hash: str,
        status_code: int,
        response_body: Any,
    ) -> None:
        key = cls._make_key(endpoint, user_id, idempotency_key)
        with cls._lock:
            cls._records[key] = _IdempotencyRecord(
                request_hash=request_hash,
                status="completed",
                status_code=status_code,
                response_body=response_body,
                expires_at=datetime.utcnow() + timedelta(minutes=cls._ttl_minutes),
            )

    @classmethod
    def abort(
        cls,
        *,
        endpoint: str,
        user_id: str,
        idempotency_key: str,
    ) -> None:
        key = cls._make_key(endpoint, user_id, idempotency_key)
        with cls._lock:
            cls._records.pop(key, None)
