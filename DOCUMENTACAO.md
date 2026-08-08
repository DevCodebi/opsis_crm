# Home Ótica — CRM

Documentação técnica do sistema de gestão e vendas da Home Ótica.

## Visão geral

Sistema web para gestão de uma ótica: cadastro de clientes (e-mail opcional), produtos (armações, lentes, acessórios), receituário médico (graus OD/OS), vendas (incluindo parcelamento via boleto, data prevista de entrega e comprovante em impressão/PDF) e controle de usuários por convite. Inclui um dashboard com indicadores de faturamento, vendas, produtos mais vendidos, aniversariantes do mês e alertas de estoque mínimo.

A aplicação é um app Next.js único (pasta `crm/`) com todos os dados armazenados no Supabase (Postgres + Auth), substituindo a versão inicial que guardava tudo no localStorage do navegador.

## Tecnologias

- **Next.js 14** (App Router) + **React** + **TypeScript**
- **Supabase**: banco Postgres, autenticação e API REST automática (PostgREST)
- **Tailwind CSS** para estilo
- **Recharts** para os gráficos do dashboard
- **date-fns** para datas em pt-BR
- **lucide-react** para ícones
- **xlsx** para exportação de relatórios em Excel
- **jsPDF** para exportação de comprovantes de venda em PDF

## Estrutura do projeto

```
App Home Ótica/
├── package.json          # atalhos (dev/build/start) que chamam a pasta crm
├── DOCUMENTACAO.md       # documentação técnica completa
├── STATUS-ATUAL.md       # resumo operacional (o que falta agora)
├── ESTRATEGIA-SAAS.md    # roadmap multi-tenant / PWA
└── crm/                  # aplicação Next.js propriamente dita
    ├── .env.local         # chaves do Supabase (não versionar)
    ├── netlify.toml       # build Netlify (plugin Next.js)
    ├── supabase/
    │   ├── schema.sql                         # tabelas + RLS (idempotente)
    │   └── migration-activate-convidado.sql   # policy SELECT do próprio perfil
    └── src/
        ├── app/
        │   ├── login/page.tsx                 # tela de login (+ "esqueci minha senha")
        │   ├── definir-senha/page.tsx         # 1º acesso (convite) e recuperação de senha
        │   ├── api/users/route.ts             # convidar/editar/excluir funcionários (admin)
        │   ├── api/activate-profile/route.ts  # ativa perfil após definir senha (próprio usuário)
        │   └── (main)/                        # área logada
        │       ├── layout.tsx                 # guarda de rota (redireciona pra /login se não autenticado)
        │       ├── page.tsx                   # dashboard
        │       ├── clientes/page.tsx
        │       ├── produtos/page.tsx
        │       ├── receituario/page.tsx
        │       ├── vendas/page.tsx
        │       └── usuarios/page.tsx
        ├── components/    # Sidebar, Header, Modal, RequireRole, PrescriptionSummary…
        ├── lib/
        │   ├── access.ts          # papéis e permissões da UI
        │   ├── store.tsx          # contexto React (CRUD + auth)
        │   ├── supabaseClient.ts  # cliente Supabase do navegador (anon key)
        │   ├── supabaseAdmin.ts   # cliente Supabase server-only (service_role key)
        │   └── salePrint.ts       # impressão + PDF do comprovante de venda
        └── types/index.ts
```

## Como rodar localmente

> **Importante:** mantenha o projeto fora de pastas sincronizadas por OneDrive/Google Drive/Dropbox. A sincronização em nuvem trava e corrompe os arquivos de cache que o Next.js gera durante o desenvolvimento (pasta `.next`), causando erros como `ChunkLoadError` ou timeouts ao carregar a página.

```bash
cd crm
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Configuração do Supabase

O app depende de três variáveis em `crm/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`: públicas, usadas pelo navegador para ler/gravar dados (clientes, produtos, receituários, vendas) respeitando as regras de RLS.
- `SUPABASE_SERVICE_ROLE_KEY`: secreta, usada **somente** nas rotas de API do servidor (`src/app/api/users/route.ts` e `src/app/api/activate-profile/route.ts`) — nunca no navegador nem com prefixo `NEXT_PUBLIC_`.

### Setup inicial do banco (uma vez só)

1. No painel do Supabase, abra **SQL Editor** e rode o conteúdo de `crm/supabase/schema.sql`. Isso cria as tabelas `profiles`, `clients`, `products`, `prescriptions`, `sales` e as políticas de RLS por papel (ver seção **Segurança (RLS)** abaixo). O arquivo é seguro de rodar de novo inteiro a qualquer momento (todos os comandos são idempotentes — `if not exists`, `drop policy if exists`, etc.); se preferir, rode só a seção **MIGRAÇÃO INCREMENTAL** no final.
2. Em **Authentication > Users > Add user**, crie o primeiro usuário admin (marque "Auto Confirm User" e defina uma senha — esse é o único usuário que nasce com senha definida manualmente, pois é o "ovo" que destrava o resto do sistema).
3. Copie o UUID desse usuário e rode no SQL Editor:
   ```sql
   insert into public.profiles (id, name, email, role, status)
   values ('UUID-DO-USUARIO', 'Administrador', 'email-usado-no-passo-2', 'admin', 'ativo');
   ```
4. Pronto — esse usuário já consegue logar em `/login` e, a partir da tela **Usuários**, convidar os demais funcionários por e-mail direto pelo app (sem precisar voltar ao painel do Supabase).

### E-mail transacional (convites e recuperação de senha)

O Supabase Auth já envia esses e-mails automaticamente (convite, redefinição de senha) usando um servidor de e-mail compartilhado, mas com um limite baixo de envios por hora — suficiente para testar, mas não recomendado para o uso diário da ótica. Para produção, configure um SMTP próprio em **Project Settings > Auth > SMTP Settings** (qualquer provedor: Gmail, SendGrid, Resend, etc.), assim os e-mails saem de forma confiável e sem limite de fila.

Se a variável `NEXT_PUBLIC_SITE_URL` não estiver definida em `.env.local`, a API usa automaticamente o domínio de onde a requisição partiu para montar o link de convite/redefinição — funciona tanto em `localhost` quanto em produção sem configuração extra. Só defina essa variável manualmente se quiser fixar um domínio específico.

## Modelo de dados

| Tabela | Descrição |
|---|---|
| `profiles` | Funcionários do sistema (nome, e-mail, papel, status). Ligada 1:1 ao usuário do Supabase Auth — a senha fica no Auth, nunca em texto na tabela. |
| `clients` | Clientes da ótica: dados pessoais, contato e endereço. |
| `products` | Armações, lentes e acessórios: preço, custo, estoque, fornecedor. |
| `prescriptions` | Receituário médico por cliente: graus OD/OS (SPH, CYL, AXIS, ADD), distância pupilar (PD), médico responsável. |
| `sales` | Vendas: itens, forma de pagamento, status, data prevista de entrega (`expectedDeliveryDate`), parcelas de boleto (com multa/juros por atraso calculados no front-end). |

Todas as colunas usam nomes em camelCase (entre aspas no SQL) para bater 1:1 com os tipos TypeScript em `src/types/index.ts`.

## Papéis de acesso (roles)

| Papel | Acesso |
|---|---|
| `admin` | Tudo, incluindo a tela de Usuários |
| `gerente` | Dashboard completo, Clientes, Produtos, Receituário, Vendas (todas) |
| `vendedor` | Dashboard **somente** com o total das próprias vendas; Vendas só as que ele registrou |

Regras centralizadas em `crm/src/lib/access.ts`. O menu usa essas regras em `Sidebar.tsx`. Páginas sensíveis são protegidas por `RequireRole` (bloqueia URL direta): Clientes/Produtos/Receituário → `admin`/`gerente`; Usuários → só `admin`. Na tela de Vendas, o vendedor tem o campo vendedor travado nele e não exclui vendas. **O mesmo controle existe no banco via RLS** (ver seção abaixo).

## Segurança (Row Level Security)

Todas as tabelas (`profiles`, `clients`, `products`, `prescriptions`, `sales`) têm RLS habilitado com políticas por papel, seguindo o princípio do menor privilégio. Duas funções SQL auxiliares evitam repetir a mesma checagem em cada política:

- `is_active_user()`: verdadeiro se o usuário logado existe em `profiles` com `status = 'ativo'`. Bloqueia quem está com convite pendente (`convidado`) ou foi desativado (`inativo`) — mesmo que o token de sessão dele ainda não tenha expirado.
- `has_role(roles[])`: verdadeiro se o usuário está ativo **e** tem um dos papéis informados (ex: `has_role(array['admin','gerente'])`).

Ambas são `security definer` (rodam com privilégio elevado só para essa leitura pontual em `profiles`), o que evita recursão entre a política de `profiles` e a própria função que a consulta.

| Tabela | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| `profiles` | (1) Qualquer usuário ativo (listar nomes na UI); (2) o próprio registro (`auth.uid() = id`), mesmo com status `convidado` — policy `profiles_select_own` | Nenhuma política de UPDATE/DELETE para o navegador — convite/edição/exclusão passam por `/api/users` (admin + `service_role`); ativação após senha passa por `/api/activate-profile` (JWT do próprio usuário + `service_role`) |
| `clients` | Qualquer usuário ativo (vendedor precisa consultar clientes para montar uma venda) | Só `admin`/`gerente` |
| `products` | Qualquer usuário ativo (vendedor precisa ver produto/preço na venda) | Só `admin`/`gerente` |
| `prescriptions` | Qualquer usuário ativo (vendedor precisa ver o receituário ao vincular numa venda) | Só `admin`/`gerente` |
| `sales` | `admin`/`gerente` veem todas; `vendedor` só as vendas em que ele é o vendedor (`sellerId = auth.uid()`) | INSERT: qualquer ativo. UPDATE: `admin`/`gerente` em qualquer venda, `vendedor` só nas próprias. DELETE: só `admin`/`gerente` |

Essa última regra muda um comportamento visível: antes, qualquer papel via e podia excluir qualquer venda na tela de Vendas; agora um `vendedor` só vê e só pode alterar as próprias vendas, e o botão de excluir some da interface pra esse papel (`canDeleteSale` em `vendas/page.tsx`) — reflexo direto da política do banco, pra UI nunca oferecer uma ação que o banco vai recusar.

## Receituário na venda: associação cliente ↔ receita

O relacionamento é `prescriptions.clientId → clients.id` e `sales.clientId → clients.id`/`sales.prescriptionId → prescriptions.id`, todos com chave estrangeira e índice. O formulário de venda já filtra os receituários disponíveis pelo cliente selecionado (`prescriptions.filter(p => p.clientId === form.clientId)`), então cada opção do seletor já pertence exatamente ao cliente da venda — o texto de cada opção agora mostra o nome do cliente em destaque (antes mostrava só a data e o médico, o que gerava a impressão de estar associado à pessoa errada).

Como reforço extra, tanto o preview no formulário quanto o modal de visualização da venda (`vendas/page.tsx`) e o componente `PrescriptionSummary` só renderizam o receituário se `prescription.clientId` bater exatamente com o cliente da venda — se por algum motivo os dados estiverem desalinhados, o sistema simplesmente não exibe nada em vez de mostrar a receita errada.

A FK `sales.prescriptionId` passou a ter `ON DELETE SET NULL`: excluir um receituário antigo desfaz o vínculo da venda em vez de travar a exclusão ou apagar a venda.

## Autenticação e cadastro de usuários

- Login/logout usam `supabase.auth.signInWithPassword` / `supabase.auth.signOut` (Supabase Auth). Nenhuma senha é armazenada em texto em nenhuma tabela do banco — a tabela `profiles` guarda só nome, e-mail, papel e status.
- **Cadastro de funcionário = convite por e-mail.** O admin informa nome, e-mail e papel; o sistema chama `supabaseAdmin.auth.admin.inviteUserByEmail` e o próprio funcionário define a senha ao abrir o link (tela `/definir-senha`). O admin nunca sabe/define a senha de outra pessoa — essa é a prática recomendada por SaaS e CRMs modernos (Slack, Notion, Linear, etc.), em vez de gerar uma "senha temporária".
- Um usuário recém-convidado fica com `status = "convidado"` até definir a senha. Em `/definir-senha`, após `updateUser({ password })`, o front chama **`POST /api/activate-profile`** (Bearer JWT), que com `service_role` marca `status = "ativo"`. Isso é necessário porque o client **não** tem política de UPDATE em `profiles` (RLS), e `is_active_user()` exige `ativo` — sem a API o status ficava em “Convite pendente” e o login autenticava no Auth mas o app bloqueava o acesso. Usuários `"inativo"` não são reativados por essa rota.
- O login (`store.tsx`) rejeita sessão sem perfil, com status `convidado` ou `inativo`, com mensagens claras na tela.
- **"Esqueci minha senha"** na tela de login chama `supabase.auth.resetPasswordForEmail` diretamente do navegador (fluxo público, não passa pela API admin) e sempre mostra a mesma mensagem de sucesso, exista ou não o e-mail cadastrado — evita que a tela seja usada para descobrir quais e-mails têm conta no sistema.
- O admin também pode, a qualquer momento, reenviar o convite (usuários "convidado") ou disparar um link de redefinição de senha (usuários "ativo") pela tela de Usuários — sem nunca ver ou definir a senha em si.
- Convite/edição/exclusão vivem em `src/app/api/users/route.ts` (valida admin via Bearer token). Ativação do próprio perfil vive em `src/app/api/activate-profile/route.ts` (valida o JWT do usuário). Ambas usam `service_role` só no servidor.

## Exportação de relatórios

O dashboard permite exportar o período filtrado em **CSV** ou **Excel (XLSX)**, com abas de resumo, produtos mais vendidos e vendas por vendedor (usa a lib `xlsx` no `page.tsx` do dashboard).

## Comprovante de venda (impressão e PDF)

Na visualização de uma venda, os botões **Imprimir** e **Exportar PDF** geram o mesmo conteúdo (cliente, data da venda, data prevista de entrega e o receituário completo, se houver) a partir da mesma função em `src/lib/salePrint.ts` — evita que os dois formatos fiquem dessincronizados.

- **Imprimir** reaproveita o mecanismo já usado para o boleto: renderiza um HTML numa área oculta e chama `window.print()`, com uma folha de estilo `@media print` (em `globals.css`) formatada para A4. O usuário pode imprimir de verdade ou usar "Salvar como PDF" do próprio navegador.
- **Exportar PDF** gera o arquivo diretamente com `jsPDF` (texto vetorial, sem depender do diálogo de impressão do navegador), útil para anexar em WhatsApp/e-mail ou arquivar.

O receituário (quando a venda tem um vinculado) aparece em formato de grid — uma caixa por campo (SPH, CYL, AXIS, ADD) para OD e OS — tanto na tela (componente `src/components/PrescriptionSummary.tsx`, reaproveitado no formulário de venda e no modal de visualização) quanto no HTML impresso e no PDF gerado, mantendo o mesmo layout nos três lugares.

## Marca — Ópsis CRM

O produto (motor do sistema, reutilizável em outras óticas no futuro) se chama **Ópsis CRM**. A loja continua aparecendo como "Home Ótica" em destaque (logo/nome principal), com "by Ópsis CRM" como subtítulo — na sidebar, na tela de login e na tela de definir senha. Todo rodapé do sistema (área logada, comprovante de venda impresso/PDF, boleto) traz a assinatura "Ópsis CRM" ou "Documento gerado pelo Ópsis CRM". O título da aba do navegador também usa "Home Ótica · Ópsis CRM".

## Cliente sem e-mail

O campo e-mail do cliente é opcional — a ótica pode cadastrar um cliente só com nome e telefone. Todo o resto do sistema (vendas, receituário, dashboard) funciona normalmente nesse caso; os lugares que exibem ou buscam por e-mail tratam a ausência dele (mostram "—" na listagem, por exemplo).

## Scripts disponíveis (dentro de `crm/`)

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — roda o build de produção
- `npm run lint` — ESLint

## Problemas conhecidos / cuidados

- **Nunca rode o projeto dentro de uma pasta sincronizada por nuvem** (OneDrive, Google Drive, Dropbox) — causa `ChunkLoadError` e travamentos no `npm run dev`.
- Se aparecer erro `Module not found` para algum pacote, confirme que o `npm install` foi rodado **dentro da pasta `crm`** (e não na raiz do projeto).
- Se o Next.js travar por causa de cache corrompido após mover a pasta do projeto, apague a pasta `crm/.next` e rode `npm run dev` novamente.

## Layout responsivo e sidebar

- **Mobile:** menu hambúrguer + drawer com overlay; listagens em cards; modais adaptados à tela.
- **Desktop:** sidebar **retrátil** (expandida com labels / recolhida só ícones), preferência salva em `localStorage` (`opsis-sidebar-collapsed`).
- Viewport meta em `crm/src/app/layout.tsx`.

## Convites e e-mail de acesso

Fluxo completo:

1. Admin em **Usuários** → Convidar → `inviteUserByEmail` → perfil com `status = convidado`.
2. Usuário abre o link do e-mail → `/definir-senha` → define senha.
3. Front chama `/api/activate-profile` → perfil vira `status = ativo`.
4. Login com e-mail + senha → acesso conforme o papel.

- API de administração: `crm/src/app/api/users/route.ts`.
- API de ativação: `crm/src/app/api/activate-profile/route.ts`.
- **Reenvio / redefinição:** confirma o e-mail no Auth (`email_confirm: true`) e dispara `resetPasswordForEmail` para `/definir-senha` — necessário porque convidados costumam ficar sem e-mail confirmado e o Supabase não envia recovery nesse estado.
- Migration pontual (já aplicada em produção): `crm/supabase/migration-activate-convidado.sql` (`profiles_select_own`).
- E-mail padrão do Supabase (plano free) é limitado; para produção estável usa-se **SMTP próprio (Resend)** — ver checkpoint abaixo.

## Publicação (deploy) — GitHub + Netlify + Supabase

Stack: Next.js na **Netlify**, dados/auth no **Supabase**, código no GitHub.  
Repositório: `https://github.com/DevCodebi/opsis_crm`.

| URL | Uso |
|---|---|
| `https://opsis-crm.netlify.app` | Site Netlify (sempre HTTPS) |
| `https://opsiscrm.com.br` | Domínio próprio (Hostinger DNS → Netlify); HTTPS Let’s Encrypt **ativo** |
| `glittering-cat-55cd79.netlify.app` | **Obsoleto** (404) — não usar |

Build Netlify: Base directory `crm`, Runtime Next.js, `npm run build` (`crm/netlify.toml`). Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://opsiscrm.com.br`. Todo push/merge na `main` **redeploya automaticamente**.

### ✅ Checkpoint histórico — 06/07/2026 (primeira publicação)

Supabase + schema, GitHub, Netlify, variáveis de ambiente, primeiro deploy ok, correção de tipo em produtos. Detalhes do setup inicial e cuidados com `git` na pasta certa permanecem válidos (rodar git de dentro de `App Home Ótica`, não de `C:\Dev`).

### ✅ Checkpoint — 07–08/08/2026 (evolução do produto e domínio)

**Código publicado na `main` (PRs mergeados):**

1. **PR #1 — Layout responsivo + sidebar retrátil** (mobile drawer, cards, modais, collapse no desktop).
2. **PR #2 — Dashboard do vendedor + hierarquia de acessos** (`lib/access.ts`, `RequireRole`, dashboard só com total de vendas do vendedor).
3. **PR #3 — Correção reenvio de convite** (erro “already been registered”).
4. **PR #4 — Melhora envio de e-mail** (confirma e-mail antes do recovery; mensagem de rate limit).
5. **PR #6 — Ativar convidado ao definir senha** (`/api/activate-profile` + policy `profiles_select_own`; login com mensagens para `convidado`/`inativo`).

**Infra / domínio:**

6. Projeto Netlify renomeado para **`opsis-crm`** (`opsis-crm.netlify.app`).
7. Domínio **`opsiscrm.com.br`** (DNS na **Hostinger**; nameservers `*.dns-parking.com`).
8. DNS do site na Hostinger → Netlify:
   - **A** `@` → `75.2.60.5`
   - **CNAME** `www` → `opsis-crm.netlify.app`
9. Netlify: domínio primário `opsiscrm.com.br`, www redireciona; certificado Let’s Encrypt **ativo**.
10. Conta **Resend** + registros DNS (DKIM / MX-TXT `send` / DMARC) na Hostinger.
11. Migration `crm/supabase/migration-activate-convidado.sql` aplicada no Supabase de produção.

### 🟡 Em andamento (retomar daqui — 08/08/2026)

1. **Resend:** confirmar domínio `opsiscrm.com.br` **Verified** (se ainda não estiver).
2. **Supabase Auth → URL Configuration:**
   - Site URL: `https://opsiscrm.com.br`
   - Redirect URLs: `https://opsiscrm.com.br/**`, `/definir-senha`, `/login` (pode manter também as do `opsis-crm.netlify.app`)
3. **Supabase Auth → SMTP (Resend)** — se ainda não configurado:
   - Host `smtp.resend.com`, port `465`, user `resend`, password = API Key Resend
   - Sender: `noreply@opsiscrm.com.br` / nome `Ópsis CRM`
4. **Netlify env:** `NEXT_PUBLIC_SITE_URL=https://opsiscrm.com.br` (já definido → só confirmar após mudanças).
5. **Teste final de e-mail:** novo convite → e-mail chega → `/definir-senha` → status **Ativo** → login (admin / gerente / vendedor).

### ⏭️ Depois disso (próxima fase de produto)

- Ajustar rate limits de e-mail no Supabase após SMTP.
- PWA (manifest + service worker) — ver `ESTRATEGIA-SAAS.md`.
- Multi-tenant (`storeId`) só após uso estável na loja.
- Testes automatizados de RLS / papéis.

### Observações operacionais

- DNS do domínio edita-se na **Hostinger** (Registros DNS), não no Registro.br.
- Não apagar os registros A/CNAME da Netlify ao adicionar os do Resend.
- O e-mail embutido do Supabase free é limitado; produção de verdade = Resend SMTP.
- Admin convida usuários só pela tela **Usuários**; senha sempre definida pelo próprio convidado.
- Deploy: merge/push na `main` → Netlify publica sozinho (não precisa Trigger manual, salvo mudança só de env).
- Se um usuário antigo ficar preso em “Convite pendente” após já ter senha: admin edita status para **Ativo**, ou SQL `update public.profiles set status = 'ativo' where email = '...'`.
