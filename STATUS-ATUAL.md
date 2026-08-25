# Ópsis CRM — Status atual

**Atualizado em:** 09/08/2026  
**Documento completo:** ver `DOCUMENTACAO.md` (seção Publicação / checkpoints).

## Onde estamos

| Item | Status |
|---|---|
| App em produção (Netlify) | ✅ `https://opsis-crm.netlify.app` e `https://opsiscrm.com.br` |
| Domínio próprio + HTTPS | ✅ Certificado Let’s Encrypt ativo |
| Layout mobile + sidebar retrátil | ✅ Publicado (PR #1) |
| Hierarquia admin/gerente/vendedor + dashboard do vendedor | ✅ Publicado (PR #2) |
| Correções de convite/e-mail no código | ✅ Publicados (PR #3 e #4) |
| Ativar convidado após definir senha | ✅ Publicado (PR #6) + migration `migration-activate-convidado.sql` aplicada |
| Vendedor cadastra clientes/receituário; pagamento combinado; desconto com senha | ✅ Publicado (PR #8) + migration `migration-vendedor-cadastro-pagamento.sql` aplicada |
| Preenchimento automático de endereço por CEP | ✅ Publicado (PR #12) — ViaCEP + BrasilAPI |
| Deploy automático na `main` | ✅ Netlify redeploya a cada merge/push |
| Resend + SMTP no Supabase | 🟡 Confirmar Verified + SMTP se ainda não estiver |
| PWA / multi-tenant | ⏳ Fase seguinte |

## Fazer agora (ordem)

1. Confirmar Resend domínio **Verified** + SMTP no Supabase (se ainda faltar)
2. Confirmar Auth URL Configuration com `https://opsiscrm.com.br`
3. Testar um **novo** convite ponta a ponta (convite → e-mail → definir senha → status Ativo → login)
4. Validar os 3 papéis em produção, com foco no vendedor:
   - cadastrar/editar cliente e receituário (sem excluir)
   - venda com pagamento combinado (ex.: dinheiro + cartão)
   - desconto até 5% com senha do vendedor; acima disso com gerente/admin

## Contas envolvidas

- **Código:** GitHub `DevCodebi/opsis_crm` → deploy automático Netlify na `main`
- **Site:** Netlify projeto `opsis-crm`
- **DNS do domínio:** Hostinger (não o painel “Meus domínios” do Registro.br)
- **Banco/Auth:** Supabase
- **E-mail transacional:** Resend (em configuração / validação)
