# Landing — Da'at Technologies

Site institucional (React + Vite + Framer Motion) com três rotas: `/` (home), `/opsis` (galeria do Ópsis CRM) e `/sobre`.

## Estrutura da home

Hero → **Soluções** (4 cards: Landing Pages, Automações, Análise de Dados, Webapps para Empresas — cada um com dor, CTA de e-mail com `subject` próprio e, em três deles, um exemplo visual ilustrativo: `EcommerceMock.tsx`, `AutomationLoop.tsx`, `DataDashboards.tsx`) → **Ópsis CRM** (screenshot real do dashboard em produção, `public/screens/dashboard.png`) → **Contato**.

A página `/sobre` tem a apresentação institucional e a seção "Como trabalhamos" (Entender/Propor/Construir/Acompanhar).

Ver `HANDOFF.md` para detalhes de arquitetura, componentes e histórico de decisões.

## Desenvolvimento

```bash
cd landing
npm install
npm run dev
```

## Build

```bash
cd landing
npm run build
npm run preview
```

## Publicação gratuita (Netlify)

Site **separado** do CRM (`opsis-crm`). Domínio próprio da Da'at pode ser ligado depois.

### Deploy permanente (recomendado)

1. Gere um Personal Access Token em Netlify → User settings → Applications.
2. `NETLIFY_AUTH_TOKEN=<token> npx netlify-cli sites:create --name daat-technologies --manual`
3. Com o `site_id` criado:
   ```bash
   cd landing
   npm run build
   NETLIFY_AUTH_TOKEN=<token> npx netlify-cli deploy --dir=dist --prod --site=<site_id>
   ```
4. Ou conecte o repositório no Netlify com **Base directory** `landing`, build `npm run build`, publish `dist`.

### Deploy rápido de teste (Drop)

```bash
cd landing && npm run build
# Arraste landing/dist em https://app.netlify.com/drop
```

Drops não reclamados expiram (~1h) e podem exigir a senha temporária `My-Drop-Site`.

## Contato

CTA **Fale Conosco** → `mailto:contato@devcodebi.com`
