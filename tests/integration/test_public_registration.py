"""Public signup never grants administrative access or replaces initial setup."""

from dataclasses import replace
from unittest.mock import AsyncMock

import pytest

from octop.api.routers import auth
from octop.infra.errors import ErrorCode, OctopError
from octop.infra.users.registration import RegistrationLimiter

BODY = {"username": "new_user", "password": "NewUserPass42", "locale": "en"}


@pytest.fixture
def limiter(monkeypatch):
    value = RegistrationLimiter()
    monkeypatch.setattr(auth, "_registration_limiter", value)
    return value


def enable(server):
    object.__setattr__(
        server.services, "config", replace(server.services.config, public_registration=True)
    )


async def test_signup_stays_locked_before_admin(app_client, limiter):
    client, server, _ = app_client
    enable(server)
    response = await client.post("/api/auth/register", json=BODY)
    assert response.status_code == 503
    assert server.user_manager.count() == 0


async def test_signup_defaults_disabled(env, limiter):
    client, server, _ = env
    assert (await client.get("/api/auth/registration")).json() == {"enabled": False}
    response = await client.post("/api/auth/register", json=BODY)
    assert response.status_code == 403
    assert server.user_manager.get(BODY["username"]) is None


async def test_signup_then_login_with_restricted_account(env, limiter):
    client, server, _ = env
    enable(server)
    response = await client.post("/api/auth/register", json=BODY)
    assert response.status_code == 201, response.text
    assert response.json() == {"username": BODY["username"]}
    row = server.services.user_repo.get_by_username(BODY["username"])
    assert row.password_hash != BODY["password"]
    assert row.role == "user"
    assert set(row.permissions) == {"experts", "token_usage"}
    policies = server.services.user_policy_repo.enabled_values(row.id)
    assert policies["max_agents"] == "1"
    login = await client.post("/api/auth/login", json=BODY)
    assert login.status_code == 200
    headers = {"Authorization": "Bearer " + login.json()["access_token"]}
    assert (await client.get("/api/users", headers=headers)).status_code == 403
    assert (await client.get("/api/auth/me", headers=headers)).json()["role"] == "user"


@pytest.mark.parametrize(
    "extra", [{"role": "admin"}, {"permissions": ["users"]}, {"max_agents": 99}]
)
async def test_signup_cannot_choose_privileges(env, limiter, extra):
    client, server, _ = env
    enable(server)
    assert (await client.post("/api/auth/register", json={**BODY, **extra})).status_code == 422
    assert server.user_manager.get(BODY["username"]) is None


@pytest.mark.parametrize("password", ["password1", "abcdefgh", "12345678"])
async def test_signup_password_policy(env, limiter, password):
    client, server, _ = env
    enable(server)
    response = await client.post("/api/auth/register", json={**BODY, "password": password})
    assert response.status_code == 400
    assert server.user_manager.get(BODY["username"]) is None


async def test_duplicate_does_not_replace_existing_account(env, limiter):
    client, server, _ = env
    enable(server)
    assert (await client.post("/api/auth/register", json=BODY)).status_code == 201
    response = await client.post("/api/auth/register", json={**BODY, "password": "DifferentPass42"})
    assert response.status_code == 409
    assert (await client.post("/api/auth/login", json=BODY)).status_code == 200


async def test_signup_limits_attempts_before_creating_account(env, limiter):
    client, server, _ = env
    enable(server)
    for _ in range(5):
        assert (
            await client.post("/api/auth/register", json={**BODY, "password": "password1"})
        ).status_code == 400
    response = await client.post("/api/auth/register", json=BODY)
    assert response.status_code == 429
    assert server.user_manager.get(BODY["username"]) is None


async def test_signup_checks_configured_captcha(env, limiter, monkeypatch):
    client, server, _ = env
    enable(server)
    check = AsyncMock(side_effect=OctopError(ErrorCode.CAPTCHA_REQUIRED, "captcha required"))
    monkeypatch.setattr(auth, "ensure_captcha", check)
    response = await client.post("/api/auth/register", json=BODY)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "CAPTCHA_REQUIRED"
    assert server.user_manager.get(BODY["username"]) is None
    check.assert_awaited_once()
