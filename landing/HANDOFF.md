# Handoff — Landing Da'at Technologies

Documento para outra IA ou desenvolvedor assumir o site institucional sem depender do histórico do chat.

## Contexto

| Item | Valor |
|------|--------|
| Marca | Da'at Technologies |
| Repo | `DevCodebi/opsis_crm` |
| Pasta do site | `landing/` (raiz do monorepo) |
| App do CRM (separado) | `crm/` (Next.js — **não** misturar deploys) |
| Branch de trabalho | `cursor/landing-daat-technologies-4c02` |
| PR | #10 |

**Posicionamento:** soluções em dados, automação e desenvolvimento de software.  
**Produto em destaque:** Ópsis CRM (gestão de óticas).  
**CTA de contato:** `mailto:contato@devcodebi.com`

## Stack

- React 19 + TypeScript
- Vite 8
- React Router DOM
- Framer Motion
- CSS próprio (`src/index.css`) — dark mode verde-oliva
- Fundo animado (canvas): `src/components/NeuralField.tsx`

## Como rodar

```bash
cd landing
npm install
npm run dev
```

```bash
npm run build    # gera landing/dist
npm run preview
```

## Rotas

| Rota | Arquivo | Função |
|------|---------|--------|
| `/` | `src/pages/HomePage.tsx` | Home institucional |
| `/opsis` | `src/pages/OpsisPage.tsx` | Galeria de telas do Ópsis CRM |
| `/sobre` | `src/pages/SobrePage.tsx` | Sobre nós |

Nav (`SiteShell.tsx`): **Da'at** · **Sobre nós** · **Fale Conosco**  
“Ver produto” na home aponta para `/opsis` (não para o domínio do CRM).

## Estrutura de arquivos

```
landing/
├── index.html
├── package.json
├── vite.config.ts
├── netlify.toml
├── README.md
├── HANDOFF.md                 ← este arquivo
├── public/
│   ├── _redirects             # SPA: /* → /index.html (200)
│   ├── favicon.svg
│   └── screens/login.webp     # screenshot real do login do CRM
├── src/
│   ├── App.tsx                # definição das rotas
│   ├── main.tsx
│   ├── index.css              # design system / layout
│   ├── components/
│   │   ├── SiteShell.tsx      # header, footer, atmosphere
│   │   ├── NeuralField.tsx    # rede neural animada
│   │   ├── CrmMock.tsx        # mockups das telas do CRM
│   │   └── ScrollToTop.tsx
│   ├── data/
│   │   └── opsisScreens.ts    # metadados da galeria Ópsis
│   └── pages/
│       ├── HomePage.tsx
│       ├── OpsisPage.tsx
│       └── SobrePage.tsx
└── dist/                      # build (não versionar se estiver no .gitignore)
```

## Deploy Netlify

Site **novo e separado** do projeto `opsis-crm` (`opsiscrm.com.br`).

### Settings recomendados

| Setting | Valor |
|---------|--------|
| Base directory | `landing` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Production branch | `main` (após merge) ou a branch da feature |

SPA: `public/_redirects` e `netlify.toml` já redirecionam `/*` → `/index.html` com status 200.

### Drop (teste rápido)

```bash
cd landing && npm run build
# Arrastar landing/dist em https://app.netlify.com/drop
```

Drops não reclamados expiram (~1h) e podem pedir senha temporária (`My-Drop-Site`).

## Design (resumo)

- Dark mode com paleta oliva (`--olive`, `--olive-bright`, fundo quase preto)
- Tipografia: Syne (display) + DM Sans (corpo) — ver `index.html` / CSS
- Hero: marca em destaque, headline, lede, CTAs
- Evitar layout “dashboard” no primeiro viewport
- Responsivo: tipografia fluida, marca em duas linhas no mobile, nav compacta

## O que não fazer

- Não publicar a landing no mesmo site Netlify do CRM (`opsis-crm`)
- Não apontar “Ver produto” direto para o login do CRM se o fluxo desejado for a galeria `/opsis`
- Não remover `_redirects` / regra SPA — quebra `/sobre` e `/opsis` em reload direto

## Próximos passos sugeridos

1. Merge do PR #10 em `main` e Production branch = `main` no Netlify da landing
2. Domínio próprio da Da'at (opcional) no site da landing
3. Trocar mockups do Ópsis por screenshots reais das telas logadas, se disponíveis
4. ~~Confirmar e-mail de contato oficial~~ — confirmado: `contato@devcodebi.com`

## Contato no código

Buscar por `contato@devcodebi.com` e `mailto:` em:

- `src/components/SiteShell.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/SobrePage.tsx`
- `src/pages/OpsisPage.tsx`
