# Ópsis CRM — Status atual

**Atualizado em:** 08/08/2026  
**Documento completo:** ver `DOCUMENTACAO.md` (seção Publicação / checkpoints).

## Onde estamos

| Item | Status |
|---|---|
| App em produção (Netlify) | ✅ `https://opsis-crm.netlify.app` e `https://opsiscrm.com.br` |
| Domínio próprio + HTTPS | ✅ Certificado Let’s Encrypt ativo |
| Layout mobile + sidebar retrátil | ✅ Publicado (PR #1) |
| Hierarquia admin/gerente/vendedor + dashboard do vendedor | ✅ Publicado (PR #2) |
| Correções de convite/e-mail no código | ✅ Publicados (PR #3 e #4) |
| Resend + SMTP + SITE_URL | 🟡 Em configuração / teste |
| Bug: convidado não ativava após definir senha | 🔧 Correção em andamento (`/api/activate-profile` + RLS select own) |
| PWA / multi-tenant | ⏳ Fase seguinte |

## Fazer agora (ordem)

1. Rodar no Supabase SQL Editor o arquivo `crm/supabase/migration-activate-convidado.sql`
2. Admin: editar o vendedor preso e mudar status para **Ativo** (desbloqueio imediato)
3. Publicar a correção de ativação (PR) e testar um novo convite ponta a ponta
4. Confirmar Resend **Verified** + SMTP no Supabase se ainda não estiver
5. Testar os 3 papéis

## Contas envolvidas

- **Código:** GitHub `DevCodebi/opsis_crm` → deploy automático Netlify na `main`
- **Site:** Netlify projeto `opsis-crm`
- **DNS do domínio:** Hostinger (não o painel “Meus domínios” do Registro.br)
- **Banco/Auth:** Supabase
- **E-mail transacional:** Resend (em configuração)
