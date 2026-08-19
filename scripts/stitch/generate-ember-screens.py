#!/usr/bin/env python3
"""Generate Ember UI screens via Google Stitch MCP API."""
from __future__ import annotations

import json
import sys
import time
import urllib.request
from pathlib import Path

PROJECT_ID = "15784786617089755283"
DESIGN_SYSTEM = "assets/535898145767744444"
MCP_URL = "https://stitch.googleapis.com/mcp"
OUT_DIR = Path(__file__).resolve().parents[2] / "docs" / "stitch" / "screens"

SCREENS = [
    {
        "slug": "login",
        "device": "MOBILE",
        "prompt": (
            "Mobile login screen for Ember app (Portuguese). Warm editorial ritual aesthetic. "
            "Cream page #f4efe7, paper card #fbf8f3, ink #20211f, rust #aa4f36. "
            "Fixed floating nav pill with blur: wheel logo (circle + two rust dots) + Ember + PT EN toggles. "
            "Georgia serif title 'Entrar com email'. One elevated card with email input and black pill CTA 'Enviar código'. "
            "Large whitespace, subtle orbit ring decoration off-canvas. Premium magazine feel, not generic SaaS."
        ),
    },
    {
        "slug": "presence",
        "device": "MOBILE",
        "prompt": (
            "Mobile 'Declarar presença' screen for Ember. Same Ember design system. "
            "Eyebrow pill 'RODADA ABERTA'. Serif title. Paper cards: (1) time slot chips Mon/Wed/Sat multi-select with rust selected state, "
            "(2) three intention radio cards with titles Surprise/Frontier/Ease. Bottom rust pill button 'Confirmar presença'. Portuguese."
        ),
    },
    {
        "slug": "circle-invite",
        "device": "MOBILE",
        "prompt": (
            "Mobile circle invitation screen for Ember. Community eyebrow GSA. Large serif question as hero. "
            "When/time metadata. Participants list with initials only (no photos). "
            "Actions: primary black 'Entrar no Jitsi', outline '.ics', sage 'Confirmar presença'. Warm cream editorial layout."
        ),
    },
    {
        "slug": "facilitator",
        "device": "DESKTOP",
        "prompt": (
            "Desktop facilitator dashboard for Ember matching rounds. Two-column layout on wide screen. "
            "Left: create round form (question textarea, 5 slot chips). Right: declarations table with masked emails. "
            "Below: trio preview cards with scores. Ember editorial tokens, generous padding, not dense admin UI."
        ),
    },
]


def load_api_key() -> str:
    mcp_path = Path.home() / ".cursor" / "mcp.json"
    data = json.loads(mcp_path.read_text())
    return data["mcpServers"]["stitch"]["headers"]["X-Goog-Api-Key"]


def mcp_call(api_key: str, tool: str, arguments: dict) -> dict:
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": tool, "arguments": arguments},
    }
    req = urllib.request.Request(
        MCP_URL,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        body = json.loads(resp.read().decode())
    if "error" in body:
        raise RuntimeError(body["error"])
    result = body["result"]
    if result.get("isError"):
        raise RuntimeError(result["content"][0]["text"])
    text = result["content"][0]["text"]
    return json.loads(text) if text.startswith("{") or text.startswith("[") else {"raw": text}


def list_screen_names(api_key: str) -> set[str]:
    data = mcp_call(api_key, "list_screens", {"projectId": PROJECT_ID})
    return {s["name"] for s in data.get("screens", [])}


def generate_screen(api_key: str, spec: dict) -> None:
    print(f"Generating {spec['slug']}...", flush=True)
    mcp_call(
        api_key,
        "generate_screen_from_text",
        {
            "projectId": PROJECT_ID,
            "deviceType": spec["device"],
            "modelId": "GEMINI_3_FLASH",
            "designSystem": DESIGN_SYSTEM,
            "prompt": spec["prompt"],
        },
    )


def wait_for_new_screen(api_key: str, before: set[str], timeout_s: int = 180) -> dict:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        data = mcp_call(api_key, "list_screens", {"projectId": PROJECT_ID})
        for screen in data.get("screens", []):
            if screen["name"] not in before and screen.get("title") != "DESIGN.md":
                return screen
        time.sleep(8)
    raise TimeoutError("Screen generation timed out")


def download_screen(api_key: str, screen: dict, slug: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    name = screen["name"]
    detail = mcp_call(
        api_key,
        "get_screen",
        {"name": name, "projectId": PROJECT_ID, "screenId": name.split("/")[-1]},
    )
    html = detail.get("htmlCode", {})
    url = html.get("downloadUrl")
    if not url:
        (OUT_DIR / f"{slug}.json").write_text(json.dumps(detail, indent=2), encoding="utf-8")
        print(f"  saved metadata -> {slug}.json (no html yet)")
        return
    with urllib.request.urlopen(url, timeout=120) as resp:
        content = resp.read()
    ext = "html" if "html" in html.get("mimeType", "") else "txt"
    out = OUT_DIR / f"{slug}.{ext}"
    out.write_bytes(content)
    print(f"  saved {out}")


def main() -> int:
    api_key = load_api_key()
    for spec in SCREENS:
        before = list_screen_names(api_key)
        try:
            generate_screen(api_key, spec)
            screen = wait_for_new_screen(api_key, before)
            print(f"  ready: {screen.get('title', screen['name'])}")
            download_screen(api_key, screen, spec["slug"])
        except Exception as exc:  # noqa: BLE001
            print(f"  ERROR {spec['slug']}: {exc}", file=sys.stderr)
            return 1
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
