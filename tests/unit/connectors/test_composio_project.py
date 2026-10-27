from unittest.mock import AsyncMock

import httpx
import pytest

from octop.config import OctopConfig
from octop.infra.connectors import composio_project
from octop.infra.connectors.builder import build_http_mcp_spec
from octop.infra.connectors.catalog import catalog_entry_to_dict, get_catalog_entry


@pytest.mark.asyncio
async def test_project_key_creates_session_and_builds_scoped_mcp(monkeypatch):
    request = AsyncMock(
        return_value=httpx.Response(
            201,
            json={
                "session_id": "trs_test",
                "mcp": {"url": "https://backend.composio.dev/tool_router/v3/trs_test/mcp"},
            },
        )
    )
    monkeypatch.setattr(composio_project, "safe_request", request)
    creds = await composio_project.prepare_project_credentials(
        {"api_key": "project-secret", "user_id": "customer-1"}
    )
    assert request.call_args.args == (
        "POST",
        "https://backend.composio.dev/api/v3.1/tool_router/session",
    )
    assert request.call_args.kwargs["headers"] == {"x-api-key": "project-secret"}
    assert request.call_args.kwargs["json"] == {"user_id": "customer-1"}
    entry = get_catalog_entry("composio-api")
    assert entry is not None
    spec = build_http_mcp_spec(entry=entry, instance_id="own", creds=creds, config=OctopConfig())
    assert spec["headers"]["x-api-key"] == "project-secret"
    assert spec["url"] == creds["mcp_url"]
    assert spec["httpx_client_factory"] is composio_project.project_http_client
    assert "project-secret" not in str(catalog_entry_to_dict(entry, locale="pt-BR"))


def test_blank_user_identity_is_created_once_and_preserved():
    first = composio_project.normalize_project_credentials({"api_key": "key"})
    second = composio_project.normalize_project_credentials(first)
    assert first["user_id"].startswith("forgenox-")
    assert first == second
    assert (
        composio_project.normalize_project_credentials({"api_key": "other"})["user_id"]
        != first["user_id"]
    )


@pytest.mark.parametrize(
    "url",
    [
        "https://evil.example/mcp",
        "https://backend.composio.dev.evil.example/mcp",
        "http://backend.composio.dev/mcp",
        "https://backend.composio.dev:444/mcp",
        "https://key@backend.composio.dev/mcp",
        "https://backend.composio.dev/mcp?key=secret",
        "https://backend.composio.dev/mcp#fragment",
        "https://127.0.0.1/mcp",
    ],
)
def test_project_key_cannot_be_sent_to_other_destinations(url):
    with pytest.raises(ValueError):
        composio_project.validate_project_mcp_url(url)


@pytest.mark.asyncio
@pytest.mark.parametrize("status", [301, 401, 403, 429, 500])
async def test_provider_errors_do_not_expose_keys(monkeypatch, status):
    monkeypatch.setattr(
        composio_project,
        "safe_request",
        AsyncMock(return_value=httpx.Response(status, json={"error": "project-secret"})),
    )
    with pytest.raises(ValueError) as error:
        await composio_project.prepare_project_credentials({"api_key": "project-secret"})
    assert "project-secret" not in str(error.value)
    assert str(status) in str(error.value)


@pytest.mark.asyncio
async def test_project_client_does_not_forward_key_through_redirect():
    async with composio_project.project_http_client(headers={"x-api-key": "private"}) as client:
        assert client.follow_redirects is False
        assert client.headers["x-api-key"] == "private"


@pytest.mark.asyncio
async def test_api_preview_never_returns_project_key(monkeypatch):
    from octop.api.routers.connectors import _credentials_preview, _prepare_credentials

    prepared = {
        "api_key": "project-secret",
        "user_id": "customer",
        "mcp_url": "https://app.composio.dev/tool_router/v3/trs_test/mcp",
        "session_id": "trs_test",
    }
    monkeypatch.setattr(
        composio_project, "prepare_project_credentials", AsyncMock(return_value=prepared)
    )
    assert (
        await _prepare_credentials("composio-api", {"api_key": "project-secret"}, None) == prepared
    )
    preview = _credentials_preview("composio-api", prepared)
    assert preview["api_key_configured"] is True
    assert preview["user_id"] == "customer"
    assert "project-secret" not in str(preview)
    assert "mcp_url" not in preview


@pytest.mark.asyncio
async def test_project_probe_uses_non_redirecting_client(monkeypatch):
    from contextlib import asynccontextmanager
    from types import SimpleNamespace

    import mcp
    import mcp.client.streamable_http

    from octop.infra.connectors.probe import probe_streamable_http_mcp

    captured = {}

    @asynccontextmanager
    async def transport(url, **kwargs):
        captured.update(kwargs)
        yield None, None, None

    @asynccontextmanager
    async def session(*args):
        yield SimpleNamespace(
            initialize=AsyncMock(), list_tools=AsyncMock(return_value=SimpleNamespace(tools=[]))
        )

    monkeypatch.setattr(mcp.client.streamable_http, "streamablehttp_client", transport)
    monkeypatch.setattr(mcp, "ClientSession", session)
    result = await probe_streamable_http_mcp(
        "https://app.composio.dev/tool_router/v3/trs_test/mcp",
        {"x-api-key": "private"},
        kind="composio-api",
    )
    assert result["ok"] is True
    assert captured["httpx_client_factory"] is composio_project.project_http_client
