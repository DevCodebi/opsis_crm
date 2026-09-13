# Ópsis CRM — Status atual

**Atualizado em:** 13/09/2026  
**Documento completo:** ver `DOCUMENTACAO.md` (seção Publicação / checkpoints).

## Onde estamos

| Item | Status |
|---|---|
| App em produção (Netlify) | ✅ `https://opsis-crm.netlify.app` e `https://opsiscrm.com.br` — testado ponta a ponta em produção nesta sessão |
| Domínio próprio + HTTPS | ✅ Certificado Let’s Encrypt ativo |
| Layout mobile + sidebar retrátil | ✅ Publicado (PR #1) |
| Hierarquia admin/gerente/vendedor + dashboard do vendedor | ✅ Publicado (PR #2) |
| Correções de convite/e-mail no código | ✅ Publicados (PR #3 e #4) |
| Ativar convidado após definir senha | ✅ Publicado (PR #6) + migration `migration-activate-convidado.sql` aplicada |
| Vendedor cadastra clientes/receituário; pagamento combinado; desconto com senha | ✅ Publicado (PR #8) + migration `migration-vendedor-cadastro-pagamento.sql` aplicada |
| Preenchimento automático de endereço por CEP | ✅ Publicado (PR #12) — ViaCEP + BrasilAPI |
| Reset de senha em produção | ✅ Corrigido — faltavam os domínios de produção em Supabase Auth → URL Configuration (ajustado manualmente pelo usuário no painel) |
| Bug: data um dia a menos em telas de cliente/venda/receituário + colunas do PDF de venda sobrepostas | ✅ Corrigido e publicado (PR #14, commit `37a910b`, merge `6e54f72`) |
| Identidade visual: logo da loja no Sidebar, logo do Ópsis CRM no login/definir-senha, favicons e `manifest.ts` (PWA), `lib/branding.ts` centralizando os caminhos de logo | ✅ Publicado (PR #15, commit `ed6de3c`, merge `67a8a0f`) |
| Sidebar: handle flutuante na borda p/ recolher/expandir (substitui botão duplicado no Header), logo maior (74px) quando expandida, legenda "By Ópsis CRM" removida | ✅ Publicado (PR #16, commits `09ad3be`/`a50f0f6`/`bc08d37`, merge `dc68079`) |
| Landing institucional Da'at Technologies (`landing/`, Vite+React+TS) | ✅ Mesclada em `main` (PR #10, merge `fe77ade`) — e-mail de contato corrigido para `contato@devcodebi.com` em todo o código (commit `b233bce`) |
| Reforma da home da landing: nova seção "Soluções" (4 cards — Landing Pages, Automações, Análise de Dados, Webapps — cada um com exemplo visual ilustrativo: `EcommerceMock.tsx`, `AutomationLoop.tsx`, `DataDashboards.tsx`), screenshot real do dashboard do Ópsis substituindo mock CSS, remoção da seção redundante "Sobre a Da'at" da home, seção "Como trabalhamos" (4 passos) em `/sobre`, CTAs contextuais por card com `subject` de e-mail próprio, copy revisado pelo `ux-writer-agent` (novo), `<title>`/meta description atualizados | ✅ Publicado em `main` (commits `ea36034`..`bf36d13`), no ar em `daattechnologies.com.br` |
| Netlify do site `daattechnologies` | ✅ Reconfigurado para production branch `main`; deploy no ar confirmado (`daattechnologies.netlify.app` responde 200) — configuração feita no painel Netlify, não verificável via repo |
| Domínio próprio `daattechnologies.com.br` | ✅ Propagação concluída nesta sessão (13/09/2026), bem mais rápido que as 24h avisadas pela Hostinger — domínio raiz e `www` acessíveis pelo navegador com HTTPS válido, servindo a landing da Da'at Technologies pelo Netlify |
| Agentes de projeto versionados em `.claude/agents/` | ✅ 10 agentes: 4 originais nunca commitados antes — `deploy-release-agent`, `frontend-ux-agent`, `rls-security-tester`, `schema-guardian` (commit `dfeb658`) — + 6 novos — `monitoring-agent`, `docs-consistency-agent`, `infra-watchdog-agent`, `multi-tenant-migration-agent` (dormente), `rls-test-automation-agent`, `branding-agent` (commit `8fa6f1c`) |
| Material de marca do Ópsis CRM versionado (`docs/brand/`) | ✅ Trazido para o repo nesta sessão (antes só existia no OneDrive do usuário) — guia de marca + ativos (commit `8fa6f1c`) |
| Rotina de status diário automatizada (`trig_012KARmKgXYbe3Tdf3XS8oTG`) | 🔴 Pausada (`enabled:false`) — sandbox de rotinas agendadas bloqueia egress de rede por política de plataforma (não é a mesma coisa que a tela Configurações → Capacidades, que só afeta sessões interativas); e-mail/push funcionam, checagem de Netlify/Supabase não |
| Acesso remoto (Remote Control) para acompanhar sessões pelo celular | ✅ Configurado pelo usuário |
| Deploy automático na `main` | ✅ Netlify redeploya a cada merge/push (CRM e landing, cada um no seu próprio site Netlify) |
| Resend + SMTP no Supabase | ✅ Confirmado ao vivo: domínio `opsiscrm.com.br` com status "Verified" no Resend (resend.com/domains); Supabase Authentication → Emails → SMTP Settings (projeto `home_otica`) com "Enable custom SMTP" ativo, host `smtp.resend.com`, porta 465, remetente `noreply@opsiscrm.com.br`, nome "Ópsis CRM" |
| PWA / multi-tenant | ⏳ Fase seguinte — `multi-tenant-migration-agent` já existe como definição, mas dormente até ativação explícita |
| Automação de testes de RLS (`crm/scripts/test-rls.mjs` + CI) | ⏳ `rls-test-automation-agent` criado só como definição/escopo — script e workflow de CI ainda não existem de fato |

## Fazer agora (ordem)

1. Revisar/decidir sobre a rotina de status diário pausada: esperar a Anthropic liberar allowlist de rede para rotinas, ou configurar um serviço de uptime externo (ex.: UptimeRobot, que monitora de fora e não sofre essa limitação) e ajustar a rotina para só reportar o repo.
2. Implementar de verdade `crm/scripts/test-rls.mjs` e o workflow de CI (`.github/workflows/`) descritos em `rls-test-automation-agent` — hoje é só intenção/escopo.
3. Fase 2 (multi-tenant) segue não iniciada — `multi-tenant-migration-agent` está pronto mas dormente, só ativa com pedido explícito do usuário.

## Contas envolvidas

- **Código:** GitHub `DevCodebi/opsis_crm` → deploy automático Netlify na `main`
- **Site CRM:** Netlify projeto `opsis-crm` (`opsiscrm.com.br` / `opsis-crm.netlify.app`)
- **Site institucional:** Netlify projeto `daattechnologies` (`daattechnologies.netlify.app`), production branch `main`
- **DNS do domínio:** Hostinger (não o painel “Meus domínios” do Registro.br)
- **Banco/Auth:** Supabase
- **E-mail transacional:** Resend (em configuração / validação)
