# Handoff — Landing Da'at Technologies

Documento para outra IA ou desenvolvedor assumir o site institucional sem depender do histórico do chat.

## Contexto

| Item | Valor |
|------|--------|
| Marca | Da'at Technologies |
| Repo | `DevCodebi/opsis_crm` |
| Pasta do site | `landing/` (raiz do monorepo) |
| App do CRM (separado) | `crm/` (Next.js — **não** misturar deploys) |
| Branch de trabalho | `cursor/landing-daat-technologies-4c02` (mesclada, remota ainda existe mas está obsoleta) |
| PR | #10 (mesclado em `main`, merge `fe77ade`) — reforma posterior (seção Soluções, screenshot real, remoção do "Sobre a Da'at" da home) feita direto em `main`, commits `ea36034`..`bf36d13` |

**Posicionamento:** quatro frentes — Landing Pages, Automações, Análise de Dados e Webapps sob medida (dados, automação e desenvolvimento de software).  
**Produto em destaque:** Ópsis CRM (gestão de óticas), com screenshot real do dashboard em produção.  
**CTA de contato:** `mailto:contato@devcodebi.com`, com `subject` específico por card/página (não é mais um único CTA genérico repetido).

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
| `/` | `src/pages/HomePage.tsx` | Home institucional: Hero → Soluções (4 cards) → Ópsis CRM → Contato |
| `/opsis` | `src/pages/OpsisPage.tsx` | Galeria de telas do Ópsis CRM |
| `/sobre` | `src/pages/SobrePage.tsx` | Sobre nós + seção "Como trabalhamos" (4 passos) |

Nav (`SiteShell.tsx`): **Da'at** · **Sobre nós** · **Fale Conosco**  
“Ver produto” na home aponta para `/opsis` (não para o domínio do CRM).

### Estrutura da home (`HomePage.tsx`)

1. **Hero** — marca, headline, lede, CTAs (`Conversar com a Da'at` / `Ver produto`).
2. **Soluções** (`#solucoes`) — grid de 4 cards, cada um com dor (`pain`), exemplo visual ilustrativo opcional e CTA de e-mail com `subject` próprio:
   - `Landing Pages` → exemplo visual `EcommerceMock.tsx` (mockup de e-commerce com 3 lojas ilustrativas: Moda, Autopeças, Esportes).
   - `Automações` → exemplo visual `AutomationLoop.tsx` (animação SVG: planilha → processo → e-mail).
   - `Análise de Dados` → exemplo visual `DataDashboards.tsx` (3 mini-dashboards por aba: Vendas, Logística, Saúde — cada aba com uma visualização estruturalmente diferente, não o mesmo componente repintado).
   - `Webapps para Empresas` → sem visual próprio; linka direto para `/opsis` como "exemplo real" (o Ópsis CRM).
3. **Ópsis CRM** (`#produto`) — painel com **screenshot real** (`public/screens/dashboard.png`) do dashboard em produção, não mais um mock CSS.
4. **Contato** (`#contato`) — CTA final único.

A antiga seção "Sobre a Da'at" (pillars Dados/Automações/Softwares) foi **removida** da home por redundância com a nova seção Soluções; o conteúdo institucional equivalente vive em `/sobre`.

Copy de toda a home, `/sobre` e `/opsis` foi revisada pelo `ux-writer-agent` (`.claude/agents/ux-writer-agent.md`) para um tom menos genérico/acusatório nas dores descritas.

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
│   └── screens/
│       ├── login.webp         # screenshot real do login do CRM (galeria /opsis)
│       └── dashboard.png      # screenshot real do dashboard do CRM (seção Ópsis na home)
├── src/
│   ├── App.tsx                # definição das rotas
│   ├── main.tsx
│   ├── index.css              # design system / layout
│   ├── components/
│   │   ├── SiteShell.tsx      # header, footer, atmosphere
│   │   ├── NeuralField.tsx    # rede neural animada
│   │   ├── CrmMock.tsx        # mockups das telas do CRM (galeria /opsis)
│   │   ├── DataDashboards.tsx # mini-dashboards ilustrativos (card Análise de Dados)
│   │   ├── AutomationLoop.tsx # animação SVG planilha→processo→e-mail (card Automações)
│   │   ├── EcommerceMock.tsx  # mockup e-commerce (card Landing Pages)
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
- Paleta de cada área do `DataDashboards.tsx` é escopada via `[data-area]` em `index.css` — única exceção intencional à paleta oliva da marca, restrita a esse mockup
- `<title>` e meta description (`index.html`) citam as 4 frentes de serviço: Landing Pages, Automações, Dados e Webapps

## O que não fazer

- Não publicar a landing no mesmo site Netlify do CRM (`opsis-crm`)
- Não apontar “Ver produto” direto para o login do CRM se o fluxo desejado for a galeria `/opsis`
- Não remover `_redirects` / regra SPA — quebra `/sobre` e `/opsis` em reload direto

## Próximos passos sugeridos

1. ~~Merge do PR #10 em `main` e Production branch = `main` no Netlify da landing~~ — feito: PR #10 mesclado (merge `fe77ade`), Netlify do projeto `daattechnologies` já reconfigurado para production branch `main` e deploy confirmado no ar.
2. ~~Apontar o domínio próprio `daattechnologies.com.br`~~ — feito: DNS propagado e domínio no ar com HTTPS.
3. ~~Trocar mockups do Ópsis por screenshots reais das telas logadas~~ — feito parcialmente: dashboard real (`public/screens/dashboard.png`) já substitui o mock CSS na seção Ópsis CRM da home; a galeria `/opsis` (`CrmMock.tsx`) ainda usa mockups ilustrativos além do `login.webp`.
4. ~~Confirmar e-mail de contato oficial~~ — confirmado: `contato@devcodebi.com`

## Contato no código

Buscar por `contato@devcodebi.com` e `mailto:` em:

- `src/components/SiteShell.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/SobrePage.tsx`
- `src/pages/OpsisPage.tsx`
