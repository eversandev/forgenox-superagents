"""Composio project-key sessions exposed through a first-party MCP endpoint."""

from __future__ import annotations

from typing import Any
from urllib.parse import urlsplit

import httpx

from octop.infra.utils.ssrf_guard import safe_request
from octop.infra.utils.ulid import new_ulid

_SESSION_API = "https://backend.composio.dev/api/v3.1/tool_router/session"
_MCP_HOSTS = frozenset({"backend.composio.dev", "app.composio.dev"})


def validate_project_mcp_url(value: str) -> str:
    parsed = urlsplit(value)
    if (
        parsed.scheme != "https"
        or parsed.hostname not in _MCP_HOSTS
        or parsed.port not in (None, 443)
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
        or not parsed.path.rstrip("/").endswith("/mcp")
    ):
        raise ValueError("Composio returned an unsupported MCP endpoint")
    return value


def normalize_project_credentials(credentials: dict[str, Any]) -> dict[str, str]:
    key = str(credentials.get("api_key") or "").strip()
    if not key or "\n" in key or "\r" in key:
        raise ValueError("A Composio project API key is required")
    user_id = str(credentials.get("user_id") or "").strip() or f"forgenox-{new_ulid()}"
    if len(user_id) > 256:
        raise ValueError("Composio user ID must be at most 256 characters")
    result = {"api_key": key, "user_id": user_id}
    if credentials.get("mcp_url"):
        result["mcp_url"] = validate_project_mcp_url(str(credentials["mcp_url"]))
    if credentials.get("session_id"):
        result["session_id"] = str(credentials["session_id"])
    return result


async def prepare_project_credentials(credentials: dict[str, Any]) -> dict[str, str]:
    """Create a session on save; never return upstream error bodies or API keys in errors."""
    result = normalize_project_credentials(credentials)
    try:
        response = await safe_request(
            "POST",
            _SESSION_API,
            headers={"x-api-key": result["api_key"]},
            json={"user_id": result["user_id"]},
            timeout=30,
        )
    except httpx.HTTPError as exc:
        raise ValueError("Unable to reach Composio; try again later") from exc
    if response.status_code not in (200, 201):
        raise ValueError(f"Composio session creation failed (HTTP {response.status_code})")
    try:
        data = response.json()
        url = validate_project_mcp_url(str(data["mcp"]["url"]))
        session_id = str(data["session_id"]).strip()
        if not session_id:
            raise ValueError("empty session ID")
    except (ValueError, KeyError, TypeError) as exc:
        raise ValueError("Composio returned an invalid session response") from exc
    result.update(mcp_url=url, session_id=session_id)
    return result


def project_http_client(
    headers: dict[str, str] | None = None, timeout: Any = None, auth: Any = None
) -> httpx.AsyncClient:
    """Keep the project key on the configured origin, including during redirects."""
    return httpx.AsyncClient(
        headers=headers, timeout=timeout, auth=auth, follow_redirects=False, trust_env=False
    )
