"""Bound the password-hashing work accepted by public registration."""

from __future__ import annotations

import time
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass, field

from octop.infra.errors import ErrorCode, OctopError


@dataclass
class RegistrationLimiter:
    """Single-process limits: five attempts/client/minute, thirty overall/minute."""

    now: Callable[[], float] = time.monotonic
    _attempts: deque[tuple[float, str]] = field(default_factory=deque)

    def check(self, client: str) -> None:
        now = self.now()
        while self._attempts and self._attempts[0][0] <= now - 60:
            self._attempts.popleft()
        if len(self._attempts) >= 30 or sum(key == client for _, key in self._attempts) >= 5:
            raise OctopError(ErrorCode.REGISTRATION_RATE_LIMITED, "too many registration attempts")
        self._attempts.append((now, client))
