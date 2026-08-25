#!/usr/bin/env python3
"""Checagem somente leitura dos serviços do Ópsis CRM. Não imprime segredos."""

from __future__ import annotations

import json
import re
import subprocess
from datetime import datetime, timezone
from typing import Any

TIMEOUT = 25
PROD = "https://opsiscrm.com.br"
WWW = "https://www.opsiscrm.com.br"
NETLIFY_ALIAS = "https://opsis-crm.netlify.app"
OBSOLETE = "https://glittering-cat-55cd79.netlify.app"
NETLIFY_IP = "75.2.60.5"
STATUS = {
    "netlify": "https://www.netlifystatus.com/api/v2/status.json",
    "supabase": "https://status.supabase.com/api/v2/status.json",
    "github": "https://www.githubstatus.com/api/v2/status.json",
    "resend": "https://status.resend.com/api/v2/status.json",
}


def sh(cmd: list[str], timeout: int = TIMEOUT) -> tuple[int, str]:
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return out.returncode, (out.stdout or out.stderr or "").strip()
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        return 1, f"erro: {exc}"


def curl(url: str, extra: list[str] | None = None) -> dict[str, Any]:
    cmd = [
        "curl",
        "-sS",
        "-D",
        "-",
        "-o",
        "/tmp/opsis-check-body.txt",
        "--max-time",
        str(TIMEOUT),
        "-A",
        "opsis-validar-servicos/1.0",
        *(extra or []),
        url,
    ]
    code, headers = sh(cmd)
    body = ""
    try:
        with open("/tmp/opsis-check-body.txt", "r", errors="replace") as fh:
            body = fh.read(12000)
    except OSError:
        body = ""
    status = None
    hdrs: dict[str, str] = {}
    location = None
    for raw in headers.splitlines():
        if raw.upper().startswith("HTTP/"):
            parts = raw.split()
            if len(parts) >= 2 and parts[1].isdigit():
                status = int(parts[1])
            hdrs = {}
            continue
        if ":" in raw:
            k, v = raw.split(":", 1)
            hdrs[k.strip().lower()] = v.strip()
            if k.strip().lower() == "location":
                location = v.strip()
    return {
        "ok": code == 0 and status is not None,
        "curl": code,
        "status": status,
        "headers": hdrs,
        "location": location,
        "body": body,
        "url": url,
    }


def curl_head(url: str, follow: bool = False) -> dict[str, Any]:
    extra = ["-I"]
    if follow:
        extra.append("-L")
    return curl(url, extra)


def dig(name: str, rtype: str) -> str:
    _, out = sh(["dig", "+short", name, rtype], timeout=15)
    return out


def tls_info(host: str) -> str:
    cmd = (
        f"echo | openssl s_client -connect {host}:443 -servername {host} 2>/dev/null "
        "| openssl x509 -noout -subject -issuer -dates 2>/dev/null"
    )
    try:
        out = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=20
        )
        text = (out.stdout or "").strip().replace("\n", "; ")
        return text or "sem certificado"
    except Exception as exc:  # noqa: BLE001
        return f"erro: {exc}"


def status_page(url: str) -> str:
    r = curl(url, ["-L"])
    if not r["status"]:
        return f"falhou ({r['body'][:120]})"
    try:
        data = json.loads(r["body"])
        st = data.get("status") or {}
        if isinstance(st, dict):
            return f"{st.get('description')} (indicator={st.get('indicator')})"
        return str(st)
    except json.JSONDecodeError:
        text = re.sub(r"<[^>]+>", " ", r["body"])
        m = re.search(
            r"(fully operational|all systems operational|operational|degraded|outage|incident)",
            text,
            re.I,
        )
        return m.group(0) if m else f"HTTP {r['status']} (sem JSON)"


def extract_supabase_url() -> str | None:
    page = curl(f"{PROD}/login", ["-L"])
    chunks = re.findall(r"/_next/static/chunks/[^\"']+\.js", page.get("body") or "")
    for chunk in chunks:
        js = curl(f"{PROD}{chunk}", ["-L"]).get("body") or ""
        m = re.search(r"https://[a-z0-9-]+\.supabase\.co", js)
        if m:
            return m.group(0)
    return None


def mark(ok: bool) -> str:
    return "✅" if ok else "❌"


def cell(r: dict[str, Any]) -> str:
    return str(r.get("status") if r.get("status") is not None else r.get("body", "")[:80])


def main() -> None:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines: list[str] = [f"# Ópsis CRM — checagem de serviços ({now})", ""]

    apex = curl(PROD, ["-L"])
    alias = curl(NETLIFY_ALIAS, ["-L"])
    www = curl_head(WWW, follow=False)
    http_plain = curl_head("http://opsiscrm.com.br", follow=False)
    login = curl(f"{PROD}/login", ["-L"])
    senha = curl(f"{PROD}/definir-senha", ["-L"])
    users = curl_head(f"{PROD}/api/users", follow=True)
    activate = curl(
        f"{PROD}/api/activate-profile",
        ["-L", "-X", "POST", "-H", "content-type: application/json", "--data", "{}"],
    )
    discount = curl(
        f"{PROD}/api/authorize-discount",
        ["-L", "-X", "POST", "-H", "content-type: application/json", "--data", "{}"],
    )
    obsolete = curl_head(OBSOLETE, follow=False)

    www_loc = www.get("location") or ""
    www_ok = www.get("status") in (301, 302, 308) and "opsiscrm.com.br" in www_loc
    https_ok = http_plain.get("status") in (301, 302, 308)
    api_ok = users.get("status") in (401, 405) and activate.get("status") == 401
    netlify_ok = (apex.get("headers") or {}).get("server", "").lower() == "netlify"

    lines += [
        "## Produção / Netlify",
        "",
        "| Alvo | Status | HTTP | Detalhe |",
        "|---|---|---|---|",
        f"| `{PROD}` | {mark(apex.get('status') == 200)} | {cell(apex)} | server={(apex.get('headers') or {}).get('server')} |",
        f"| `{NETLIFY_ALIAS}` | {mark(alias.get('status') == 200)} | {cell(alias)} | |",
        f"| `{WWW}` | {mark(www_ok)} | {cell(www)} | location={www_loc} |",
        f"| HTTP→HTTPS | {mark(https_ok)} | {cell(http_plain)} | location={http_plain.get('location')} |",
        f"| `/login` | {mark(login.get('status') == 200)} | {cell(login)} | |",
        f"| `/definir-senha` | {mark(senha.get('status') == 200)} | {cell(senha)} | |",
        f"| `/api/users` | {mark(users.get('status') in (401, 405))} | {cell(users)} | 401/405 esperado |",
        f"| POST `/api/activate-profile` | {mark(activate.get('status') == 401)} | {cell(activate)} | 401 esperado |",
        f"| POST `/api/authorize-discount` | {mark(discount.get('status') == 401)} | {cell(discount)} | 401 esperado |",
        f"| site obsoleto | {mark(obsolete.get('status') == 404)} | {cell(obsolete)} | 404 esperado |",
        f"| cabeçalho Netlify | {mark(netlify_ok)} | — | {(apex.get('headers') or {}).get('server')} |",
        "",
        f"- TLS `opsiscrm.com.br`: {tls_info('opsiscrm.com.br')}",
        f"- cache-age apex: {(apex.get('headers') or {}).get('age', 'n/d')}s",
        f"- APIs protegidas: {mark(api_ok)}",
        "",
    ]

    a_rec = dig("opsiscrm.com.br", "A")
    www_c = dig("www.opsiscrm.com.br", "CNAME")
    ns = dig("opsiscrm.com.br", "NS")
    dkim = dig("resend._domainkey.opsiscrm.com.br", "TXT")
    send_mx = dig("send.opsiscrm.com.br", "MX")
    send_spf = dig("send.opsiscrm.com.br", "TXT")
    dmarc = dig("_dmarc.opsiscrm.com.br", "TXT")
    root_txt = dig("opsiscrm.com.br", "TXT")
    _, soa = sh(["dig", "+noall", "+answer", "opsiscrm.com.br", "SOA"], timeout=15)

    lines += [
        "## DNS (Hostinger) e e-mail (Resend)",
        "",
        "| Registro | Status | Valor |",
        "|---|---|---|",
        f"| A `@` | {mark(NETLIFY_IP in a_rec)} | `{a_rec or 'vazio'}` |",
        f"| CNAME `www` | {mark('opsis-crm.netlify.app' in www_c)} | `{www_c or 'vazio'}` |",
        f"| NS | {mark('dns-parking.com' in ns)} | `{ns.replace(chr(10), ' / ') or 'vazio'}` |",
        f"| DKIM `resend._domainkey` | {mark(bool(dkim) and 'erro:' not in dkim)} | {'presente' if dkim else 'ausente'} |",
        f"| MX `send` | {mark('amazonses.com' in send_mx)} | `{send_mx or 'vazio'}` |",
        f"| SPF `send` | {mark('amazonses.com' in send_spf)} | `{send_spf or 'vazio'}` |",
        f"| DMARC apex | {mark(bool(dmarc) and 'erro:' not in dmarc)} | `{dmarc or 'ausente'}` |",
        f"| SPF apex | {mark('spf1' in root_txt.lower())} | `{root_txt or 'ausente'}` |",
        "",
        f"- SOA: `{soa}`",
        "- Selo **Verified** no painel Resend e SMTP no Supabase Auth: confirmar manualmente.",
        "",
    ]

    sb = extract_supabase_url()
    lines += ["## Supabase", ""]
    if not sb:
        lines.append("- ❌ não extraí a URL pública do bundle de `/login`.")
    else:
        rest = curl(f"{sb}/rest/v1/")
        auth = curl(f"{sb}/auth/v1/health")
        storage = curl(f"{sb}/storage/v1/bucket")
        ref = (rest.get("headers") or {}).get("sb-project-ref") or sb.split("//")[1].split(".")[0]
        rest_up = rest.get("status") in (200, 401)
        auth_up = auth.get("status") in (200, 401)
        storage_up = storage.get("status") in (200, 400, 401)
        lines += [
            f"- projeto: `{ref}` (URL pública do app; chave não impressa)",
            f"- REST: {mark(rest_up)} HTTP {cell(rest)} `{(rest.get('headers') or {}).get('sb-error-code', '')}`",
            f"- Auth health: {mark(auth_up)} HTTP {cell(auth)}",
            f"- Storage: {mark(storage_up)} HTTP {cell(storage)}",
            "- Site URL / SMTP no painel Auth: confirmar manualmente.",
            "",
        ]

    lines += [
        "## Status das plataformas",
        "",
        f"- Netlify: {status_page(STATUS['netlify'])}",
        f"- Supabase: {status_page(STATUS['supabase'])}",
        f"- GitHub: {status_page(STATUS['github'])}",
        f"- Resend: {status_page(STATUS['resend'])}",
        "",
        "## Notas",
        "",
        "- Script não acessa painéis (Resend Verified, SMTP, Auth URL).",
        "- Complete com `gh pr list` e o HEAD de `origin/main`.",
        "",
    ]
    print("\n".join(lines))


if __name__ == "__main__":
    main()
