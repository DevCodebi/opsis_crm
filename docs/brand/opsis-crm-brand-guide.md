# Ópsis CRM — Guia de Marca (Logo & Favicon)

Este documento descreve os arquivos entregues, onde usar cada um e como implementar no webapp.

---

## 1. Paleta de cores

| Uso | Cor | Hex |
|---|---|---|
| Fundo (dark) | Gradiente slate | `#0b1120` → `#131c2e` |
| Acento (ícone / destaque) | Gradiente azul | `#6d9bff` → `#4f7fe0` |
| Texto principal | Off-white | `#f2f5fa` |
| Texto secundário (tagline) | Slate claro | `#7d8bab` |
| Divisor | Slate escuro | `#2a3550` |

Essa paleta foi extraída do dashboard existente do CRM, para manter consistência visual entre marca e produto.

---

## 2. Arquivos entregues

| Arquivo | Formato | Dimensão | Fundo | Uso recomendado |
|---|---|---|---|---|
| `opsis-crm-logo.svg` | Vetor | 1200×400 | Escuro (sólido) | Fonte de verdade da logo completa (ícone + wordmark + tagline). Editar aqui, não nos PNGs. |
| `opsis-crm-logo@2x.png` | Raster | 2400×800 | Escuro (sólido) | Topo de página, tela de login, assinatura de e-mail, apresentações. |
| `opsis-icon.svg` | Vetor | 512×512 | Escuro (sólido, cantos arredondados) | Fonte de verdade do ícone isolado (estilo "app icon"). |
| `opsis-icon-1024.png` | Raster | 1024×1024 | Escuro (sólido) | App icon para PWA, ícone de app mobile, avatar em redes sociais. |
| `opsis-icon-transparent.svg` | Vetor | 512×320 | Transparente | Fonte de verdade do ícone sem caixa de fundo. |
| `opsis-icon-transparent.png` | Raster | 1024×~640 | Transparente | Sidebar/header do próprio webapp, onde você já controla a cor de fundo. |
| `favicon.ico` | Ícone multi-resolução (16/32/48px) | — | Escuro (sólido) | Favicon clássico, funciona na maioria dos navegadores automaticamente. |
| `favicon-16.png` | Raster | 16×16 | Escuro (sólido) | Fallback de favicon para navegadores/dispositivos que não leem `.ico`. |
| `favicon-32.png` | Raster | 32×32 | Escuro (sólido) | Idem acima — resolução padrão de aba de navegador. |
| `favicon-192.png` | Raster | 192×192 | Escuro (sólido) | Ícone de PWA / Android (manifest.json). |
| `favicon-512.png` | Raster | 512×512 | Escuro (sólido) | Apple touch icon / splash screen PWA. |

---

## 3. Implementação no webapp

### 3.1 Favicon (`<head>` do HTML)

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/favicon-512.png">
```

Coloque os arquivos na raiz pública do projeto (ex: `/public/` em apps React/Next, ou `wwwroot/` em .NET).

### 3.2 PWA manifest (`manifest.json`), se aplicável

```json
{
  "icons": [
    { "src": "/favicon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/favicon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 3.3 Sidebar / header do CRM

Use `opsis-icon-transparent.svg` (ou `.png`) — sem fundo próprio, para que ele herde a cor de fundo do header/sidebar já existente no app, evitando uma "caixa" visível ao redor do ícone.

### 3.4 Logo completa (login, e-mails, docs)

Use `opsis-crm-logo.svg` (web) ou `opsis-crm-logo@2x.png` (e-mail, Word, PDF — ambientes que não renderizam SVG de forma confiável).

---

## 4. Regras de manutenção

- **O `.svg` é sempre a fonte de verdade.** Qualquer alteração de cor, proporção ou texto deve ser feita nos arquivos `.svg`, nunca diretamente nos `.png`/`.ico` — eles são apenas exportações e ficam desatualizados se editados isoladamente.
- Para regenerar os rasters após editar um `.svg`, use `rsvg-convert` (ou ferramenta equivalente):
  ```bash
  rsvg-convert -w 512 -h 512 opsis-icon.svg -o favicon-512.png
  ```
- Ao criar novos tamanhos de ícone no futuro, sempre a partir de `opsis-icon.svg` (com fundo) ou `opsis-icon-transparent.svg` (sem fundo) — nunca reamostrando um PNG já existente, para não perder nitidez.
- Não usar o ícone geométrico (`opsis-icon`) junto com a paleta antiga (fundo azul claro da primeira versão) — isso quebra a consistência com o dashboard.

---

## 5. Itens em aberto (para decidir depois, se necessário)

- Versão da logo em **fundo claro**, para documentos impressos ou contextos onde o fundo escuro não é viável.
- Ajuste do estilo do ícone (mais geométrico/retangular vs. mais arredondado/retrô) — depende do posicionamento de marca da Ópsis (tech vs. óptica tradicional).
