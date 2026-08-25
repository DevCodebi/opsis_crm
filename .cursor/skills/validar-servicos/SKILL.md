---
name: validar-servicos
description: Valida o status ao vivo do Ópsis CRM (Netlify, domínio, Supabase, Resend/DNS, GitHub e URLs de produção). Use when the user asks to check services, status de produção, Netlify, Supabase, Resend, DNS, se o site está no ar, ou diz validar serviços / status dos serviços.
---

# Validar serviços — Ópsis CRM

Checagem operacional **somente leitura**. Não alterar código, não abrir PR, não commitar, não editar `STATUS-ATUAL.md` a menos que o usuário peça explicitamente.

Responda sempre em **português**, com tabela pass/fail e o que falta fazer.

## Quando disparar

- Usuário digita `/validar-servicos`
- Pede status de Netlify, Supabase, Resend, domínio, produção
- Pergunta “o site está no ar?” ou “onde estamos com os serviços?”

## Passo 1 — Rodar o script

Na raiz do repositório:

```bash
python3 .cursor/skills/validar-servicos/scripts/check-services.py
```

O script imprime um relatório em Markdown. Use-o como base e complete o que o script não cobre (PRs no GitHub, incidentes nas status pages, comparação com `STATUS-ATUAL.md`).

Se `python3` ou `dig`/`curl` falhar, faça as mesmas checagens com as ferramentas disponíveis (`gh`, `WebFetch`, `Shell`).

## Passo 2 — Completar o que o script não vê

| Item | Como |
|---|---|
| GitHub `main` vs último deploy | `gh repo view` / `gh pr list` / `git log origin/main -5` |
| Status pages | Netlify, Supabase, Resend, GitHub (URLs abaixo) |
| Painel Resend **Verified** | Não dá para ver de fora; reporte DNS presente vs selo no painel |
| SMTP + Site URL no Supabase Auth | Não dá para ver de fora; deixe como 🟡 se não confirmado pelo usuário |
| PR #10 landing Da'at | `gh pr list --state open` |

Status pages:

- https://www.netlifystatus.com/api/v2/status.json
- https://status.supabase.com/api/v2/status.json
- https://status.supabase.com/api/v2/summary.json
- https://status.resend.com/ (ou `/api/v2/status.json`)
- https://www.githubstatus.com/api/v2/status.json

## Inventário fixo do projeto

- Repo: `DevCodebi/opsis_crm`
- Produção: https://opsiscrm.com.br
- www: https://www.opsiscrm.com.br → deve 301 para o apex
- Alias Netlify: https://opsis-crm.netlify.app
- Obsoleto (404 esperado): `glittering-cat-55cd79.netlify.app`
- DNS: Hostinger (`artemis.dns-parking.com` / `hermes.dns-parking.com`)
  - A `@` → `75.2.60.5` (Netlify)
  - CNAME `www` → `opsis-crm.netlify.app`
- Rotas a pingar: `/login`, `/definir-senha`, `/api/users`, `POST /api/activate-profile`, `POST /api/authorize-discount`
- APIs autenticadas devem responder **401** sem token (isso é sucesso)
- Docs de referência: `STATUS-ATUAL.md`, `DOCUMENTACAO.md` (seção Publicação)

## Regras

- Não imprimir chaves (anon, service_role, publishable).
- Não tentar login com senha real.
- Não mudar código “de passagem”.
- Comparar o resultado com `STATUS-ATUAL.md` e apontar drift (ex.: docs dizem 09/08 e o deploy ainda é esse).
- Fechar com: o que está ok, o que está 🟡, o que o usuário precisa confirmar no painel.

## Formato da resposta

1. Uma frase: produção no ar ou não.
2. Tabela de serviços (status + evidência).
3. GitHub / último deploy.
4. Fila “fazer agora” (Resend Verified, SMTP, Site URL, teste de convite, papéis).
5. O que não foi possível confirmar sem painel.

Prompt para colar numa Cursor Automation: [references/prompt-automacao.md](references/prompt-automacao.md)
