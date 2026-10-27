"""Brazilian Portuguese preserves all keys and interpolation markers."""

import json
import re
from collections import Counter
from pathlib import Path

import pytest

from octop.i18n import all_keys_for_locale, tr
from octop.infra.utils.locale import normalize_locale

ROOT = Path(__file__).resolve().parents[3]
MARKERS = re.compile(r"\{\{[^{}]*\}\}|\{[^{}]*\}|</?\d+>")


def flatten(value, prefix=""):
    if isinstance(value, dict):
        return {
            key: text
            for name, child in value.items()
            for key, text in flatten(child, prefix + name + ".").items()
        }
    if isinstance(value, list):
        return {
            key: text
            for index, child in enumerate(value)
            for key, text in flatten(child, prefix + str(index) + ".").items()
        }
    return {prefix: value}


@pytest.mark.parametrize("folder", ["dashboard/src/locales", "src/octop/i18n"])
def test_ptbr_preserves_keys_and_placeholders(folder):
    en = flatten(json.loads((ROOT / folder / "en.json").read_text()))
    pt = flatten(json.loads((ROOT / folder / "pt-BR.json").read_text()))
    assert en.keys() == pt.keys()
    for key, text in en.items():
        if isinstance(text, str):
            assert isinstance(pt[key], str) and pt[key].strip(), key
            assert Counter(MARKERS.findall(text)) == Counter(MARKERS.findall(pt[key])), key
            assert "▁" not in pt[key] and "<unk>" not in pt[key], key


def test_ptbr_backend_and_dashboard_share_server_labels():
    front = json.loads((ROOT / "dashboard/src/locales/pt-BR.json").read_text())
    back = json.loads((ROOT / "src/octop/i18n/pt-BR.json").read_text())
    assert front["tools"] == back["tools"]
    assert front["apiErrors"] == {
        key: re.sub(r"\{([^{}]+)\}", r"{{\1}}", text) for key, text in back["errors"].items()
    }
    assert front["login"]["registration"]["open"] == "Criar conta"
    assert all_keys_for_locale("pt-BR") == all_keys_for_locale("en")
    en = json.loads((ROOT / "dashboard/src/locales/en.json").read_text())
    assert front["login"]["forgotPasswordCommand"] == en["login"]["forgotPasswordCommand"]


def test_ptbr_normalization_and_server_interpolation():
    assert normalize_locale("pt_BR") == "pt-BR"
    assert normalize_locale("pt-PT") == "pt-BR"
    assert normalize_locale("en-US") == "en"
    assert "/example" in tr("slash.error.unknown_command", "pt-BR", name="example")


def test_ptbr_uses_original_english_subagent_templates():
    from octop.infra.agents.subagents.catalog import SubagentDefinition, SubagentSummary

    definition = SubagentDefinition(
        summary=SubagentSummary(
            slug="example", division="test", name="Example", description="Example"
        ),
        contents={"en": "Original English instructions"},
        names={"en": "Example"},
    )
    assert definition.content_for("pt-BR") == "Original English instructions"
    assert definition.name_for("pt-BR") == "Example"


def test_older_resources_fall_back_to_english(tmp_path, monkeypatch):
    from octop.i18n import loader

    for locale in ("en", "zh"):
        (tmp_path / f"{locale}.json").write_text(json.dumps({"example": "English fallback"}))
    monkeypatch.setattr(loader.resources, "files", lambda _: tmp_path)
    loader._load_all.cache_clear()
    try:
        assert loader.tr("example", "pt-BR") == "English fallback"
    finally:
        loader._load_all.cache_clear()
