# Landing — Da'at Technologies

One-page institucional (React + Vite + Framer Motion).

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

CTA **Fale Conosco** → `mailto:contato@devcode.com`
