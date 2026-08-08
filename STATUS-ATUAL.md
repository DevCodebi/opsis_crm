# Ópsis CRM — Status atual

**Atualizado em:** 08/08/2026  
**Documento completo:** ver `DOCUMENTACAO.md` (seção Publicação / checkpoints).

## Onde estamos

| Item | Status |
|---|---|
| App em produção (Netlify) | ✅ `https://opsis-crm.netlify.app` |
| Domínio próprio | 🟡 `opsiscrm.com.br` no ar via DNS Hostinger→Netlify; HTTPS Let’s Encrypt em emissão |
| Layout mobile + sidebar retrátil | ✅ Publicado (PR #1) |
| Hierarquia admin/gerente/vendedor + dashboard do vendedor | ✅ Publicado (PR #2) |
| Correções de convite/e-mail no código | ✅ Publicados (PR #3 e #4) |
| Resend (DNS do domínio) | 🟡 Checking / Pending — aguardando verificação |
| SMTP Supabase + Site URL do domínio | ⏳ Próximo, após Resend Verified e HTTPS ok |
| Convites reais por e-mail estável | ⏳ Bloqueado até SMTP |
| PWA / multi-tenant | ⏳ Fase seguinte |

## Fazer agora (ordem)

1. Esperar Resend: `opsiscrm.com.br` → **Verified**
2. Esperar Netlify: certificado HTTPS ativo em `https://opsiscrm.com.br`
3. Supabase Auth → Site URL + Redirect URLs com `https://opsiscrm.com.br`
4. Supabase Auth → SMTP Resend (`smtp.resend.com:465`, sender `noreply@opsiscrm.com.br`)
5. Netlify env: `NEXT_PUBLIC_SITE_URL=https://opsiscrm.com.br` + redeploy
6. Testar convite / redefinição de senha e os 3 papéis

## Contas envolvidas

- **Código:** GitHub `DevCodebi/opsis_crm` → deploy automático Netlify na `main`
- **Site:** Netlify projeto `opsis-crm`
- **DNS do domínio:** Hostinger (não o painel “Meus domínios” do Registro.br)
- **Banco/Auth:** Supabase
- **E-mail transacional:** Resend (em configuração)
