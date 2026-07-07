# Home Ótica CRM — Estratégia de Produto, Escala e Multi-tenant

Documento de arquitetura e produto: diagnóstico do estado atual, plano para virar SaaS multi-loja, e o que fazer primeiro.

---

## 1. Testes de usuários e permissões

**Criar usuários de teste sem mexer no banco na mão:** use o próprio fluxo de convite que já existe no app (tela Usuários → Convidar usuário). Para não gastar e-mails de verdade, use o truque do "plus addressing" do Gmail: `seuemail+admin@gmail.com`, `seuemail+vendedor@gmail.com`, `seuemail+gerente@gmail.com` — todos chegam na sua caixa de entrada normal, mas o Supabase Auth trata como e-mails diferentes, então você consegue ter um usuário de teste por papel sem precisar de contas de e-mail novas.

**Atribuir papéis diferentes:** ao convidar, escolha o papel (`admin`/`gerente`/`vendedor`) na própria tela — isso já cai direto na coluna `role` de `profiles`.

**Simular usuários diferentes ao mesmo tempo:** abra uma janela normal do navegador para um perfil e uma janela anônima/privada (ou outro navegador, ex. Chrome + Firefox) para outro — cada uma mantém sua própria sessão do Supabase Auth, então você navega como "admin" numa janela e como "vendedor" na outra, lado a lado, sem logout/login toda hora.

**Validar se o RLS está funcionando de verdade** (não só confiando na UI escondida): abra o DevTools (F12) → Console, logado como o papel mais restrito (vendedor), e tente uma ação que a política deveria recusar direto pela API, contornando a interface — por exemplo:
```js
await window.supabase.from('clients').delete().eq('id', 'algum-id')
```
Se o RLS estiver certo, isso retorna um erro de permissão (não passa só porque o botão está escondido). Esse é o teste que realmente prova que a segurança está no banco, não só no front-end.

**Ferramentas/boas práticas:**
- Supabase Studio tem um inspetor de políticas em **Authentication → Policies**, onde dá pra ver e testar cada política por tabela.
- Para testes repetíveis, vale montar uma planilha simples: linhas = ações (criar cliente, editar produto, excluir venda...), colunas = papéis, células = "deveria funcionar?" — e ir marcando ✅/❌ conforme testa.
- Quando o produto crescer, o próximo passo natural é automatizar isso com um script Node usando `@supabase/supabase-js`, logando como cada papel de teste e validando as respostas — ou testes end-to-end com Playwright.

---

## 2. Compatibilidade com celular e tablet

**Diagnóstico:** o projeto já usa Tailwind com breakpoints responsivos nos formulários (`grid-cols-1 sm:grid-cols-2`, modais com `max-w` e padding adaptável) — os formulários funcionam razoavelmente bem no celular. O ponto fraco é a **navegação**: a `Sidebar` é fixa, sempre visível, pensada para tela larga (não tem menu hambúrguer nem colapsa em telas pequenas). As tabelas (Clientes, Produtos, Vendas) têm `overflow-x-auto`, o que evita quebrar o layout, mas numa tela de celular o usuário fica arrastando a tabela para os lados — funcional, mas não é uma boa experiência.

**Ajustes recomendados, em ordem de impacto:**
1. Sidebar virar um menu retrátil (hambúrguer) abaixo de `md`, com overlay — é o maior ganho de usabilidade em celular.
2. Listagens (Clientes, Produtos, Vendas) ganharem uma versão em "cards" empilhados para telas pequenas, escondendo a tabela tradicional nesse breakpoint — padrão comum em CRMs mobile-friendly.
3. Botões de ação (editar/excluir) com área de toque maior nas listagens, já que hoje são ícones pequenos pensados para mouse.

**PWA — recomendo sim.** Para uma ótica que vai usar isso no balcão em tablet ou celular, o ganho de "instalar como app" (ícone na tela inicial, tela cheia sem barra do navegador, abre mais rápido) é real e o custo de implementar é baixo. Passos:
1. Adicionar `crm/public/manifest.json` com nome, ícones (192px e 512px) e `"display": "standalone"`.
2. Adicionar um service worker — mais simples usando o pacote `next-pwa`, que integra com o Next.js e cuida do cache dos arquivos estáticos.
3. Referenciar o manifest e as meta tags de tema no `layout.tsx`.
4. Gerar os ícones (pode ser feito a partir do logo já usado na Sidebar).
5. Testar "Adicionar à tela inicial" no Android (funciona bem) e no iOS Safari (funciona, mas com mais limitações — sem notificações push, por exemplo).

Isso é trabalho de próxima fase, não bloqueia o uso imediato na sua loja — o site já abre e funciona no celular pelo navegador normalmente.

---

## 3. Hospedagem e publicação

**Frontend → Vercel.** É quem faz o Next.js, suporte nativo, deploy a cada push no Git, deploy sem downtime (a versão nova só recebe tráfego depois de compilada e saudável — troca atômica), domínio próprio com HTTPS automático (certificado Let's Encrypt renovado sozinho).

**Banco de dados → Supabase**, que você já está usando (Postgres + Auth + Storage gerenciados, com backup automático a partir do plano Pro).

**Domínio:** compre num registrador (Registro.br para `.com.br`, ou Namecheap/Cloudflare/GoDaddy para `.com`) e aponte o DNS para a Vercel seguindo as instruções que ela mesma mostra ao adicionar o domínio no projeto (geralmente um registro CNAME ou A). A Vercel emite o certificado HTTPS automaticamente assim que o DNS propaga — não precisa configurar nada manualmente.

**Deploy sem interromper o uso:** ao usar Vercel + Git, cada push gera um "preview deployment" isolado (URL própria) — você testa ali antes de promover para produção. Quando promove (merge na branch principal), a troca de versão é atômica: os usuários que já estão logados não são derrubados no meio de uma ação, e a próxima requisição já pega a versão nova.

**Custos aproximados (hoje):**

| Item | Plano | Custo |
|---|---|---|
| Vercel | Hobby (grátis, mas **não permite uso comercial**) | R$ 0 |
| Vercel | Pro (necessário para uso comercial) | US$ 20/mês por usuário da equipe |
| Supabase | Free (só para testar — projeto pausa após 7 dias sem uso, sem backup) | R$ 0 |
| Supabase | Pro (recomendado para produção: sem pausa, backups, mais e-mails de convite) | US$ 25/mês por projeto |
| Domínio | `.com.br` ou `.com` | ~R$ 40–100/ano |

Ou seja, para colocar isso no ar "de verdade" para sua loja, o custo recorrente gira em torno de **US$ 45/mês (Vercel Pro + Supabase Pro)** mais o domínio — dá pra começar só no Supabase Free enquanto ainda está testando internamente, sem gastar nada, e migrar para os planos pagos quando for abrir para uso real da equipe.

**Arquitetura de produção recomendada:**

```
[Navegador / PWA no celular]
        │  HTTPS
        ▼
   [Vercel — Next.js: páginas + API routes]
        │  usa anon key (RLS protege tudo)
        │  API routes usam service_role só no servidor
        ▼
   [Supabase: Postgres + Auth + Storage]
```

Simples de propósito — sem servidor próprio para administrar, sem Docker, sem Kubernetes. Para o tamanho desse produto (uma ótica, depois algumas dezenas/centenas), essa é a arquitetura de menor custo operacional e manutenção que ainda é "de verdade" profissional.

---

## 4 e 5. Multi-tenant (múltiplas óticas) e identificação da loja

**Recomendação: banco único, esquema compartilhado, separação lógica por `tenant_id`** (vou chamar de `storeId`, mais falante) — **não** bancos separados por cliente.

Por quê: bancos separados por cliente multiplicam o trabalho operacional por N (migração de schema, monitoramento, backup, custo de infraestrutura de cada instância) e só compensam quando os clientes são grandes o bastante para justificar isolamento físico total (ex: exigência de compliance, dado de saúde regulado). Para um SaaS de dezenas/centenas de óticas pequenas e médias, o padrão da indústria — e o que o RLS do Postgres/Supabase foi desenhado para resolver bem — é exatamente o modelo de uma base só, com toda tabela carregando a coluna que diz "de qual loja é esse registro", e o banco (não o código do front-end) garantindo que ninguém vê dado de loja errada.

**Estrutura de dados:**

```
stores (nova tabela)
  id, name, plan, createdAt...

profiles
  ...+ storeId uuid references stores(id)   -- loja "principal" do usuário

store_members (nova tabela, só necessária se um usuário puder
               acessar mais de uma loja — ex: dono de rede)
  userId, storeId, role

clients / products / prescriptions / sales
  ...+ storeId uuid references stores(id) not null
```

**Identificação da loja do usuário:**
- Caso simples (a grande maioria): 1 usuário = 1 loja → guarda direto em `profiles.storeId`, preenchido automaticamente quando o admin daquela loja convida o funcionário (o convite herda o `storeId` de quem está convidando).
- Caso de rede/franquia (1 usuário administra várias lojas): usa a tabela `store_members` em vez de uma coluna única, e a UI ganha um "seletor de loja" (o mesmo padrão do seletor de workspace do Slack) — a loja escolhida fica guardada como "loja ativa" na sessão, e todas as telas filtram por ela.

**Integração com RLS:** toda política das tabelas de negócio passa a incluir a checagem de loja, por exemplo:
```sql
create policy "clients_select_same_store" on public.clients
  for select using (
    "storeId" = public.current_store_id()
    and public.is_active_user()
  );
```
onde `current_store_id()` é uma função auxiliar (no mesmo espírito de `is_active_user()`/`has_role()` já usadas hoje) que descobre a loja ativa do usuário logado — lendo de `profiles.storeId` no caso simples, ou de `store_members` + a "loja selecionada" no caso de rede. Esse é o ponto central: o isolamento entre lojas passa a ser garantido pelo banco de dados, não pela aplicação — mesmo um bug no front-end não consegue vazar dado de uma loja pra outra.

**O que muda no projeto atual:** adicionar a tabela `stores` e a coluna `storeId` nas tabelas existentes; ajustar as políticas de RLS (mesmo padrão que já existe hoje, só acrescentando a checagem de loja); ajustar `store.tsx` e a rota `/api/users` para preencherem `storeId` automaticamente ao criar registros (o usuário não escolhe isso manualmente, o sistema já sabe pela sessão); e adicionar o seletor de loja na UI só se/quando existir o caso de rede. É uma evolução, não uma reescrita — o modelo de dados atual já está bem desenhado para receber essa coluna extra em cada tabela.

---

## 6. Nome do CRM

| Nome | Conceito | Potencial de marca/domínio |
|---|---|---|
| **Óptiflow** | "Óptica" + "flow" (fluxo) — sugere processo fluindo, moderno, soa bem tanto pra uma loja quanto pra plataforma | Bom — nome composto, memorável, `.com`/`.app` prováveis de conseguir com pequena variação |
| **Lentis** | Curto, som "tech" (sufixo -is lembra nomes de SaaS como Sentry, Linus), remete a "lente" sem ser literal demais | Muito bom — curto, fácil de pronunciar em qualquer idioma, bom pra virar marca ampla |
| **VisioGest** ou apenas **Visio** | "Visio" (visão, em latim) + "Gest" (gestão) — soa internacional, direto ao ponto do que o sistema faz | Bom, mas "Visio" sozinho colide de nome com o Microsoft Visio (produto de diagramas) — usar com sufixo evita confusão |
| **ÓticaOS** | Sufixo "OS" (sistema operacional) é tendência atual em nomes de SaaS verticais — passa a ideia de "o sistema que roda o negócio todo" | Bom, mas nicho no nome ("Ótica") limita expansão pra outros segmentos se um dia quiser sair do nicho óptico |
| **NovaVisão** | "Nova" (moderno) + "Visão" (o produto do negócio, literal) — calorosa, fácil de falar, soa nacional/brasileira | Boa pro mercado BR, `.com.br` bem plausível; menos "global" que as opções em inglês/latim |
| **Prisma Gestão** | "Prisma" remete à óptica (luz decomposta) e a organização/clareza | Atenção: "Prisma" já é nome de um ORM bem conhecido no mundo dev (Prisma ORM) — não é conflito direto de mercado, mas pode gerar confusão em buscas |

Se eu tivesse que escolher uma para começar, ficaria entre **Óptiflow** (mais "SaaS de verdade", soa bem em pitch para outras óticas) e **Lentis** (mais curto e versátil como marca, funciona até se você expandir para outros nichos do varejo no futuro).

---

## Diagnóstico da arquitetura atual

Pontos fortes: dados já saíram do localStorage para um banco de verdade (Supabase), autenticação real via Supabase Auth com convite por e-mail (sem senha em texto), RLS já habilitado com políticas por papel, API de administração de usuários protegida por validação de sessão + papel, modelo de dados limpo e com FKs corretas. Isso é uma base sólida — bem mais madura do que a maioria dos MVPs nesse estágio.

Pontos que precisam evoluir para virar SaaS: hoje o sistema é single-tenant (uma loja só, implícito — não existe conceito de "loja" no banco); a navegação não é otimizada pra mobile; não há PWA; não há ambiente de produção publicado ainda (só rodando localmente); não há testes automatizados.

## Melhor estratégia para escalar

Shared-schema multi-tenant com `storeId` + RLS (detalhado na seção 4/5) é a rota certa — é o que Supabase e a maioria dos SaaS modernos usam, é barato de operar (uma única instância de banco atende todo mundo) e o RLS já é a ferramenta certa pra isso, porque o projeto já usa RLS pesadamente hoje.

## Plano de evolução para produto SaaS

1. **Fase 0 — usar na sua loja (agora):** publicar em produção (Vercel + Supabase Pro), sem multi-tenant ainda — é só a sua loja mesmo.
2. **Fase 1 — polimento:** navegação mobile, PWA, testes de RLS por papel documentados.
3. **Fase 2 — multi-tenant:** tabela `stores`, coluna `storeId`, RLS por loja, seletor de loja.
4. **Fase 3 — comercial:** cobrança recorrente (Stripe), onboarding self-service (uma ótica nova se cadastra sozinha), página de marketing/landing, nome/marca definidos.

## Próximos passos recomendados (ordem de prioridade)

1. Publicar em produção para a sua loja usar de verdade (Vercel + domínio + Supabase Pro).
2. Testar os três papéis (admin/gerente/vendedor) em produção seguindo o roteiro da seção 1.
3. Ajustes de navegação mobile (o item de maior impacto no dia a dia do balcão).
4. PWA.
5. Multi-tenant, só quando já tiver validado o produto na sua própria loja por um tempo — não vale a pena construir isso antes de o produto estar redondo pra um usuário só.

## Riscos técnicos e como mitigar

- **Depender do plano gratuito do Supabase em produção:** o projeto pausa após 7 dias de inatividade — mitigar migrando para o Pro antes de qualquer uso real com o cliente.
- **Limite de envio de e-mail do Supabase Auth (convites/redefinição de senha):** baixo no plano padrão — mitigar configurando SMTP próprio assim que houver mais de um punhado de funcionários sendo convidados.
- **Multi-tenant mal implementado vaza dado entre lojas:** o maior risco de um SaaS B2B. Mitigar testando exaustivamente o RLS por loja (mesmo roteiro da seção 1, mas com duas lojas de teste) antes de abrir para o segundo cliente de verdade.
- **Ausência de testes automatizados:** cada mudança futura arrisca quebrar algo sem ninguém perceber. Mitigar introduzindo aos poucos testes de RLS via script, depois testes de UI com Playwright, à medida que o projeto cresce.

---

Sources: [Vercel Pricing](https://vercel.com/pricing), [Vercel Pricing Explained 2026](https://kuberns.com/blogs/vercel-pricing/), [Supabase Pricing](https://supabase.com/pricing), [Supabase Pricing 2026](https://uibakery.io/blog/supabase-pricing)
