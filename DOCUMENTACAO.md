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
└── crm/                  # aplicação Next.js propriamente dita
    ├── .env.local         # chaves do Supabase (não versionar)
    ├── supabase/
    │   └── schema.sql     # script com as tabelas e regras de segurança (RLS)
    └── src/
        ├── app/
        │   ├── login/page.tsx           # tela de login (+ "esqueci minha senha")
        │   ├── definir-senha/page.tsx   # 1º acesso (convite) e recuperação de senha
        │   ├── api/users/route.ts       # API server-side p/ convidar/editar/excluir funcionários
        │   └── (main)/                  # área logada
        │       ├── layout.tsx           # guarda de rota (redireciona pra /login se não autenticado)
        │       ├── page.tsx             # dashboard
        │       ├── clientes/page.tsx
        │       ├── produtos/page.tsx
        │       ├── receituario/page.tsx
        │       ├── vendas/page.tsx      # inclui impressão e exportação em PDF do comprovante
        │       └── usuarios/page.tsx
        ├── components/    # Sidebar, Header, Modal, PrescriptionSummary (grid do receituário)
        ├── lib/
        │   ├── store.tsx          # contexto React que fala com o Supabase (CRUD + auth)
        │   ├── supabaseClient.ts  # cliente Supabase do navegador (anon key)
        │   ├── supabaseAdmin.ts   # cliente Supabase server-only (service_role key)
        │   └── salePrint.ts       # HTML de impressão + geração de PDF do comprovante de venda
        └── types/index.ts # tipos TypeScript de todas as entidades
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
- `SUPABASE_SERVICE_ROLE_KEY`: secreta, usada **somente** em `src/app/api/users/route.ts` (código de servidor) para criar/editar/excluir logins de funcionários via Supabase Auth Admin API. Nunca deve ser exposta ao navegador nem prefixada com `NEXT_PUBLIC_`.

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
| `gerente` | Dashboard, Clientes, Produtos, Receituário, Vendas (todas) |
| `vendedor` | Dashboard (filtrado nas próprias vendas) e Vendas (só as que ele mesmo registrou) |

O controle de menu fica em `src/components/Sidebar.tsx`, o bloqueio de rota fica em cada página que precisa (ex: `usuarios/page.tsx` redireciona quem não é admin) — e, desde a última revisão, **o mesmo controle existe no banco via RLS** (ver seção abaixo), então não depende só da interface para valer.

## Segurança (Row Level Security)

Todas as tabelas (`profiles`, `clients`, `products`, `prescriptions`, `sales`) têm RLS habilitado com políticas por papel, seguindo o princípio do menor privilégio. Duas funções SQL auxiliares evitam repetir a mesma checagem em cada política:

- `is_active_user()`: verdadeiro se o usuário logado existe em `profiles` com `status = 'ativo'`. Bloqueia quem está com convite pendente (`convidado`) ou foi desativado (`inativo`) — mesmo que o token de sessão dele ainda não tenha expirado.
- `has_role(roles[])`: verdadeiro se o usuário está ativo **e** tem um dos papéis informados (ex: `has_role(array['admin','gerente'])`).

Ambas são `security definer` (rodam com privilégio elevado só para essa leitura pontual em `profiles`), o que evita recursão entre a política de `profiles` e a própria função que a consulta.

| Tabela | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| `profiles` | Qualquer usuário ativo (necessário pra listar nomes de vendedores/funcionários pela UI) | Nenhuma política para o navegador — tudo passa pela rota `/api/users` com `service_role`, que já valida que quem pede é admin |
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
- Um usuário recém-convidado fica com `status = "convidado"` até definir a senha pela primeira vez (quando o próprio front marca `status = "ativo"`). Usuários com status `"inativo"` têm o acesso bloqueado sem precisar excluir a conta.
- **"Esqueci minha senha"** na tela de login chama `supabase.auth.resetPasswordForEmail` diretamente do navegador (fluxo público, não passa pela API admin) e sempre mostra a mesma mensagem de sucesso, exista ou não o e-mail cadastrado — evita que a tela seja usada para descobrir quais e-mails têm conta no sistema.
- O admin também pode, a qualquer momento, reenviar o convite (usuários "convidado") ou disparar um link de redefinição de senha (usuários "ativo") pela tela de Usuários — sem nunca ver ou definir a senha em si.
- Toda a lógica de convite/edição/exclusão de usuário vive em `src/app/api/users/route.ts`, que roda **somente no servidor** (usa a `service_role key`, que ignora as regras de RLS). Por isso essa rota valida em toda chamada, via o header `Authorization: Bearer <token>` enviado pelo `store.tsx`, que quem está pedindo é um admin autenticado — sem essa checagem, a rota seria um ponto de acesso público a uma chave com poder total sobre o banco.

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

## Publicação (deploy) — GitHub + Netlify + Supabase

Stack escolhida para o orçamento da loja (custo R$ 0/mês de infraestrutura, sem domínio próprio por enquanto). Repositório: `https://github.com/DevCodebi/opsis_crm`. Site na Netlify: projeto **`glittering-cat-55cd79`** (nome gerado automaticamente pela Netlify — pode ser trocado em Project configuration → General → "Change project name").

### ✅ Já feito (checkpoint — 06/07/2026)

1. **Supabase em produção:** projeto já criado e com o `schema.sql` executado; existe usuário `admin` ativo.
2. **Código no GitHub:** repositório privado `opsis_crm` criado e o projeto enviado com sucesso.

   ```powershell
   cd "C:\Dev\App Home Ótica"
   git init
   git add .
   git commit -m "Versão inicial do Ópsis CRM"
   git branch -M main
   git remote add origin https://github.com/DevCodebi/opsis_crm.git
   git push -u origin main
   ```

   **Cuidado que já causou erro:** os comandos `git` (init, add, commit...) precisam ser executados **de dentro da pasta do projeto** (`C:\Dev\App Home Ótica`), nunca de `C:\Dev` — rodar `git init` na pasta errada (um nível acima) faz o Git tratar o projeto inteiro como uma única pasta não rastreada. Se acontecer de novo: apague a pasta oculta `.git` criada no lugar errado (`Remove-Item -Recurse -Force .git` dentro da pasta errada) e repita os comandos de dentro de `C:\Dev\App Home Ótica`. Como o nome da pasta tem espaço e acento, sempre use aspas no `cd`.

3. **Conta Netlify criada** e conectada ao GitHub, projeto `opsis_crm` importado.
4. **Configuração de build ajustada em Project configuration → Build settings:**
   - **Runtime:** Next.js (selecionado manualmente no dropdown "Runtime" — ativa o plugin oficial `@netlify/plugin-nextjs`, que já vem referenciado em `crm/netlify.toml`)
   - **Base directory:** `crm`
   - **Package directory:** deixado em branco (estava duplicado com o Base directory e fazia a Netlify procurar `crm/crm/`, causando builds que só copiavam arquivos crus sem rodar `npm run build`)
   - **Build command:** `npm run build`
   - **Publish directory:** gerenciado automaticamente pelo Next.js Runtime (fica travado/cinza na tela — é esperado, não precisa mexer)
5. **Variáveis de ambiente cadastradas em Project configuration → Environment variables** (uma variável por vez, usando "Add a variable" → Key = nome da variável, Value = o valor — não confundir os dois campos):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (marcada como "Contains secret values", por ser a chave mais sensível)
6. **Bug de tipo corrigido e publicado:** o primeiro build de verdade (já com Next.js Runtime certo) falhou no `produtos/page.tsx:98` — comparação `form.cost !== ""` inválida porque `form.cost` já é `number | undefined` no estado do formulário (o valor nunca é string, o `onChange` já converte com `Number(...)`). Corrigido para `form.cost != null` (mesmo ajuste em `minStock`). Corrigido, commitado e re-deployado.
7. **Deploy publicado com sucesso:** build de ~1 minuto, todas as etapas completas (Initializing, Building, Deploying, Cleanup, Post-processing), 1 função implantada (a API `/api/users`). Site no ar.

### ⏭️ Próximos passos (retomar daqui)

1. Abrir o site publicado ("Open production deploy" na Netlify) e confirmar que a tela de login carrega sem erro no console.
2. (Opcional) Renomear o projeto na Netlify para algo mais claro, ex. `opsis-crm` (Project configuration → General → Change project name) — isso muda a URL pública.
3. Adicionar a 4ª variável de ambiente, **`NEXT_PUBLIC_SITE_URL`**, com a URL final de produção (ex: `https://opsis-crm.netlify.app`), e rodar mais um "Trigger deploy" para aplicar.
4. No painel do Supabase → **Authentication → URL Configuration**: adicionar essa mesma URL em **"Site URL"** e em **"Redirect URLs"** — sem isso, os links de convite de usuário e redefinição de senha não funcionam em produção.
5. Convidar os usuários reais (admin + 2 vendedores) pela tela de Usuários, já em produção, e testar os três papéis uma vez seguindo o roteiro de testes descrito em `ESTRATEGIA-SAAS.md`.
6. Domínio próprio fica para quando fizer sentido — o endereço `*.netlify.app` já tem HTTPS automático. Se comprar um domínio depois, adicionar em Netlify (Domain management) e atualizar `NEXT_PUBLIC_SITE_URL` + Redirect URLs do Supabase.

A partir de agora, todo `git push` na branch `main` dispara um novo deploy automático na Netlify, sem downtime — a versão nova só entra no ar depois de compilar com sucesso.
