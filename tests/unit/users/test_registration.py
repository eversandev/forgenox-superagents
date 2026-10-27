import pytest

from octop.config import load_config
from octop.infra.errors import OctopError
from octop.infra.users.registration import RegistrationLimiter


def test_global_limit_and_expiration():
    clock = [100.0]
    limiter = RegistrationLimiter(now=lambda: clock[0])
    for index in range(30):
        limiter.check(str(index))
    with pytest.raises(OctopError) as exc:
        limiter.check("different-client")
    assert exc.value.status == 429
    clock[0] += 60
    limiter.check("different-client")
    assert len(limiter._attempts) == 1


def test_registration_env_is_opt_in(tmp_path, monkeypatch):
    monkeypatch.delenv("OCTOP_PUBLIC_REGISTRATION", raising=False)
    path = tmp_path / "config.json"
    assert load_config(path).public_registration is False
    monkeypatch.setenv("OCTOP_PUBLIC_REGISTRATION", "true")
    assert load_config(path).public_registration is True
    monkeypatch.setenv("OCTOP_PUBLIC_REGISTRATION", "false")
    assert load_config(path).public_registration is False
