#!/usr/bin/env node
// ============================================================================
// Testes automatizados de Row Level Security (RLS) — Ópsis CRM
// ============================================================================
//
// Dono deste arquivo: agente `rls-test-automation-agent` (não redesenha a
// matriz de permissões — só garante que ela está sendo testada de verdade).
// A matriz em si é decidida e mantida pelo agente `rls-security-tester`,
// documentada em `.claude/agents/rls-security-tester.md` e replicada abaixo
// só como referência de leitura rápida. Se um dia divergir do SQL real em
// `crm/supabase/schema.sql`, o script vai FALHAR os testes correspondentes —
// isso é o comportamento certo (aponta a divergência, não a esconde).
//
// Matriz de referência (confirmada linha a linha contra
// crm/supabase/schema.sql em 2026-09-13 — sem divergência encontrada):
//
// | Tabela        | SELECT                                            | INSERT                        | UPDATE                              | DELETE            |
// |---------------|----------------------------------------------------|--------------------------------|--------------------------------------|-------------------|
// | profiles      | qualquer ativo vê todos; qualquer um vê o próprio  | ninguém (só /api/users)        | ninguém (só /api/activate-profile)  | ninguém           |
// | clients       | qualquer ativo                                     | admin/gerente/vendedor         | admin/gerente/vendedor               | admin/gerente     |
// | products      | qualquer ativo                                     | admin/gerente                  | admin/gerente                        | admin/gerente     |
// | prescriptions | qualquer ativo                                     | admin/gerente/vendedor         | admin/gerente/vendedor               | admin/gerente     |
// | sales         | admin/gerente veem todas; vendedor só as próprias  | qualquer ativo                 | admin/gerente qualquer; vendedor só a própria | admin/gerente |
//
// ---------------------------------------------------------------------------
// NUNCA rode este script contra o banco de produção sem confirmação explícita
// do usuário. Ele faz ESCRITA REAL (insert/update/delete) para provar que as
// políticas de RLS funcionam. Dados de teste são limpos ao final (sucesso ou
// falha), mas a limpeza depende do próprio RLS estar correto — se estiver
// quebrado, pode não conseguir limpar tudo (o script avisa se isso acontecer).
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

// ============================================================================
// 1. Variáveis de ambiente — falha rápido e claro se faltar alguma.
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const REQUIRED_VARS = {
  "SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL)": SUPABASE_URL,
  "SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)": SUPABASE_ANON_KEY,
  TEST_ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL,
  TEST_ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD,
  TEST_GERENTE_EMAIL: process.env.TEST_GERENTE_EMAIL,
  TEST_GERENTE_PASSWORD: process.env.TEST_GERENTE_PASSWORD,
  TEST_VENDEDOR_EMAIL: process.env.TEST_VENDEDOR_EMAIL,
  TEST_VENDEDOR_PASSWORD: process.env.TEST_VENDEDOR_PASSWORD,
};

const missing = Object.entries(REQUIRED_VARS)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length > 0) {
  console.error("\n[test-rls] Faltam variáveis de ambiente obrigatórias:\n");
  for (const name of missing) console.error(`  - ${name}`);
  console.error(
    "\nDefina todas antes de rodar (nunca hardcode no script nem commite em .env)." +
      "\nOs usuários de teste (admin/gerente/vendedor) precisam existir de verdade" +
      "\nno Supabase Auth do projeto de TESTE/STAGING, com status 'ativo' em profiles" +
      "\ne o papel correspondente. Veja .claude/agents/rls-test-automation-agent.md.\n"
  );
  process.exit(1);
}

// Flag de segurança extra: exige confirmação explícita de que o alvo não é produção.
// Definido no CI via secret dedicado; localmente, quem rodar precisa setar na mão.
if (process.env.RLS_TEST_CONFIRM_NOT_PRODUCTION !== "true") {
  console.error(
    "\n[test-rls] Recusando executar: RLS_TEST_CONFIRM_NOT_PRODUCTION != 'true'.\n" +
      "Este script faz escrita real (insert/update/delete). Só rode contra um projeto\n" +
      "Supabase de TESTE/STAGING, nunca contra produção. Se você confirmou que o\n" +
      `SUPABASE_URL atual (${SUPABASE_URL}) é de teste/staging, rode de novo com\n` +
      "RLS_TEST_CONFIRM_NOT_PRODUCTION=true no ambiente.\n"
  );
  process.exit(1);
}

// ============================================================================
// 2. Setup de clientes autenticados por papel.
// ============================================================================

async function signInAs(role, email, password) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    console.error(
      `\n[test-rls] Falha ao logar como ${role} (${email}): ${error?.message || "sem sessão retornada"}\n` +
        "Confirme que o usuário existe no Supabase Auth do projeto de teste, tem senha\n" +
        "definida e status 'ativo' em profiles com o papel esperado.\n"
    );
    process.exit(1);
  }
  return { client, userId: data.user.id, email, role };
}

// ============================================================================
// 3. Registro de resultados e limpeza de dados de teste.
// ============================================================================

const results = [];
function record({ role, table, action, description, pass, expected, actual, errorMessage }) {
  results.push({ role, table, action, description, pass, expected, actual, errorMessage });
  const icon = pass ? "✅" : "❌";
  console.log(`${icon} [${role}] ${table}.${action} — ${description}`);
  if (!pass) {
    console.log(`   esperado: ${expected} | obtido: ${actual}`);
    if (errorMessage) console.log(`   erro do Supabase: ${errorMessage}`);
  }
}

// tabela -> lista de ids a apagar no cleanup, na ordem certa (respeita FKs).
const cleanupOrder = ["sales", "prescriptions", "clients", "products"];
const cleanupRegistry = { sales: [], prescriptions: [], clients: [], products: [] };
function trackForCleanup(table, id) {
  if (id) cleanupRegistry[table].push(id);
}

// ============================================================================
// 4. Helpers de teste — cuidado com a semântica real do Postgres/RLS:
//    - INSERT bloqueado por `with check` SEMPRE lança um erro explícito.
//    - SELECT/UPDATE/DELETE bloqueados por `using` NÃO lançam erro — a
//      operação só afeta/retorna 0 linhas, silenciosamente. Por isso os
//      helpers de update/delete checam `data.length`, não `error`.
// ============================================================================

async function testInsert({ role, client, table, payload, shouldSucceed, description }) {
  const { data, error } = await client.from(table).insert(payload).select();
  const succeeded = !error && data && data.length > 0;
  const pass = succeeded === shouldSucceed;
  record({
    role,
    table,
    action: "insert",
    description,
    pass,
    expected: shouldSucceed ? "sucesso" : "bloqueado pelo RLS",
    actual: succeeded ? "sucesso" : "bloqueado",
    errorMessage: error?.message,
  });
  if (succeeded) trackForCleanup(table, data[0].id);
  return succeeded ? data[0] : null;
}

async function testUpdate({ role, client, table, id, patch, shouldSucceed, description }) {
  const { data, error } = await client.from(table).update(patch).eq("id", id).select();
  if (error) {
    // Erro inesperado em update (RLS normalmente não lança erro, só zera linhas).
    record({
      role,
      table,
      action: "update",
      description,
      pass: false,
      expected: shouldSucceed ? "sucesso" : "0 linhas afetadas (bloqueado)",
      actual: "erro inesperado",
      errorMessage: error.message,
    });
    return;
  }
  const succeeded = data && data.length > 0;
  const pass = succeeded === shouldSucceed;
  record({
    role,
    table,
    action: "update",
    description,
    pass,
    expected: shouldSucceed ? "sucesso" : "0 linhas afetadas (bloqueado)",
    actual: succeeded ? "sucesso" : "0 linhas afetadas",
  });
}

async function testDelete({ role, client, table, id, shouldSucceed, description }) {
  const { data, error } = await client.from(table).delete().eq("id", id).select();
  if (error) {
    record({
      role,
      table,
      action: "delete",
      description,
      pass: false,
      expected: shouldSucceed ? "sucesso" : "0 linhas afetadas (bloqueado)",
      actual: "erro inesperado",
      errorMessage: error.message,
    });
    return;
  }
  const succeeded = data && data.length > 0;
  const pass = succeeded === shouldSucceed;
  record({
    role,
    table,
    action: "delete",
    description,
    pass,
    expected: shouldSucceed ? "sucesso" : "0 linhas afetadas (bloqueado)",
    actual: succeeded ? "sucesso" : "0 linhas afetadas",
  });
  // Se apagou de verdade, já não precisa ser limpo de novo no final.
  if (succeeded) {
    const idx = cleanupRegistry[table].indexOf(id);
    if (idx !== -1) cleanupRegistry[table].splice(idx, 1);
  }
}

async function testSelect({ role, client, table, description, assertFn }) {
  const { data, error } = await client.from(table).select("*");
  if (error) {
    record({
      role,
      table,
      action: "select",
      description,
      pass: false,
      expected: "sucesso",
      actual: "erro inesperado",
      errorMessage: error.message,
    });
    return null;
  }
  const { pass, expected, actual } = assertFn(data);
  record({ role, table, action: "select", description, pass, expected, actual });
  return data;
}

// ============================================================================
// 5. Suíte de testes principal.
// ============================================================================

async function main() {
  const admin = await signInAs("admin", process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD);
  const gerente = await signInAs("gerente", process.env.TEST_GERENTE_EMAIL, process.env.TEST_GERENTE_PASSWORD);
  const vendedor = await signInAs("vendedor", process.env.TEST_VENDEDOR_EMAIL, process.env.TEST_VENDEDOR_PASSWORD);

  // -------------------------------------------------------------------
  // PROFILES
  // -------------------------------------------------------------------
  await testSelect({
    role: "vendedor",
    client: vendedor.client,
    table: "profiles",
    description: "usuário ativo lê a lista de perfis (profiles_select_active)",
    assertFn: (data) => ({
      pass: Array.isArray(data) && data.length > 0,
      expected: "lista não vazia",
      actual: `${data?.length ?? 0} linhas`,
    }),
  });

  // INSERT em profiles não tem política para "authenticated" — deve falhar
  // para qualquer papel, inclusive admin (só passa por /api/users com
  // service_role). Erro pode vir do RLS (with check false) ou da FK para
  // auth.users (o id usado não existe lá) — qualquer um dos dois confirma
  // que o caminho do browser está fechado, e o erro real é logado acima.
  await testInsert({
    role: "admin",
    client: admin.client,
    table: "profiles",
    payload: { id: "00000000-0000-0000-0000-000000000000", name: "RLS test", email: "rls-test@example.com", role: "vendedor" },
    shouldSucceed: false,
    description: "nenhum papel cria linha em profiles pelo browser (sem política de insert)",
  });

  // UPDATE em profiles: sem política de update para "authenticated" —
  // testamos com um update no-op (valor igual ao atual) no próprio perfil
  // do usuário de teste, para não arriscar corromper dado real mesmo se a
  // política estivesse (incorretamente) mais permissiva do que deveria.
  const { data: ownProfile } = await admin.client.from("profiles").select("id,name").eq("id", admin.userId).single();
  if (ownProfile) {
    await testUpdate({
      role: "admin",
      client: admin.client,
      table: "profiles",
      id: admin.userId,
      patch: { name: ownProfile.name },
      shouldSucceed: false,
      description: "nem admin edita profiles pelo browser (sem política de update; edição real é via /api/users)",
    });
  }

  // DELETE em profiles: propositalmente NÃO testado com uma linha real.
  // Não existe uma linha "descartável" segura para testar exclusão sem
  // risco de apagar uma conta de teste de verdade caso a política estivesse
  // quebrada — e um id inexistente não provaria nada (retornaria 0 linhas
  // de qualquer forma, com ou sem RLS). A ausência de política de delete
  // para "authenticated" já está confirmada por leitura de
  // crm/supabase/schema.sql linhas 199-202 (comentário explícito de que
  // toda exclusão de usuário passa por /api/users com service_role).
  console.log("⚠️  [todos] profiles.delete — não testado por escrita real (ver comentário no script); confirmado por leitura do schema.sql");

  // -------------------------------------------------------------------
  // CLIENTS — select liberado; insert/update admin+gerente+vendedor; delete só admin/gerente
  // -------------------------------------------------------------------
  for (const actor of [admin, gerente, vendedor]) {
    await testSelect({
      role: actor.role,
      client: actor.client,
      table: "clients",
      description: "usuário ativo lê clients (clients_select_active)",
      assertFn: (data) => ({ pass: Array.isArray(data), expected: "array (mesmo que vazio)", actual: typeof data }),
    });
  }

  const clientByVendedor = await testInsert({
    role: "vendedor",
    client: vendedor.client,
    table: "clients",
    payload: { name: "RLS Test Cliente (vendedor)" },
    shouldSucceed: true,
    description: "vendedor cadastra cliente (clients_write_cadastro)",
  });

  if (clientByVendedor) {
    await testUpdate({
      role: "vendedor",
      client: vendedor.client,
      table: "clients",
      id: clientByVendedor.id,
      patch: { name: "RLS Test Cliente (vendedor, editado)" },
      shouldSucceed: true,
      description: "vendedor edita cliente que cadastrou (clients_update_cadastro)",
    });

    await testDelete({
      role: "vendedor",
      client: vendedor.client,
      table: "clients",
      id: clientByVendedor.id,
      shouldSucceed: false,
      description: "vendedor NÃO exclui cliente (só admin/gerente — clients_delete_admin_gerente)",
    });

    await testDelete({
      role: "gerente",
      client: gerente.client,
      table: "clients",
      id: clientByVendedor.id,
      shouldSucceed: true,
      description: "gerente exclui cliente (clients_delete_admin_gerente)",
    });
  }

  // Cliente auxiliar para os testes de prescriptions/sales (setup, criado pelo admin).
  const setupClient = await testInsert({
    role: "admin",
    client: admin.client,
    table: "clients",
    payload: { name: "RLS Test Cliente (setup para prescriptions/sales)" },
    shouldSucceed: true,
    description: "setup: admin cria cliente auxiliar para os testes seguintes",
  });

  // -------------------------------------------------------------------
  // PRODUCTS — select liberado; escrita só admin/gerente
  // -------------------------------------------------------------------
  for (const actor of [admin, vendedor]) {
    await testSelect({
      role: actor.role,
      client: actor.client,
      table: "products",
      description: "usuário ativo lê products (products_select_active)",
      assertFn: (data) => ({ pass: Array.isArray(data), expected: "array (mesmo que vazio)", actual: typeof data }),
    });
  }

  await testInsert({
    role: "vendedor",
    client: vendedor.client,
    table: "products",
    payload: { name: "RLS Test Produto (vendedor, não deveria existir)", type: "acessorio", price: 1, stock: 0 },
    shouldSucceed: false,
    description: "vendedor NÃO cadastra produto (só admin/gerente — products_write_admin_gerente)",
  });

  const productByGerente = await testInsert({
    role: "gerente",
    client: gerente.client,
    table: "products",
    payload: { name: "RLS Test Produto (gerente)", type: "acessorio", price: 10, stock: 5 },
    shouldSucceed: true,
    description: "gerente cadastra produto (products_write_admin_gerente)",
  });

  if (productByGerente) {
    await testUpdate({
      role: "vendedor",
      client: vendedor.client,
      table: "products",
      id: productByGerente.id,
      patch: { price: 999 },
      shouldSucceed: false,
      description: "vendedor NÃO edita produto (products_update_admin_gerente)",
    });

    await testDelete({
      role: "vendedor",
      client: vendedor.client,
      table: "products",
      id: productByGerente.id,
      shouldSucceed: false,
      description: "vendedor NÃO exclui produto (products_delete_admin_gerente)",
    });

    await testDelete({
      role: "admin",
      client: admin.client,
      table: "products",
      id: productByGerente.id,
      shouldSucceed: true,
      description: "admin exclui produto (products_delete_admin_gerente)",
    });
  }

  // -------------------------------------------------------------------
  // PRESCRIPTIONS — select liberado; insert/update admin+gerente+vendedor; delete só admin/gerente
  // -------------------------------------------------------------------
  if (setupClient) {
    await testSelect({
      role: "vendedor",
      client: vendedor.client,
      table: "prescriptions",
      description: "usuário ativo lê prescriptions (prescriptions_select_active)",
      assertFn: (data) => ({ pass: Array.isArray(data), expected: "array (mesmo que vazio)", actual: typeof data }),
    });

    const prescriptionByVendedor = await testInsert({
      role: "vendedor",
      client: vendedor.client,
      table: "prescriptions",
      payload: {
        clientId: setupClient.id,
        doctorName: "Dr. RLS Test",
        date: new Date().toISOString().slice(0, 10),
      },
      shouldSucceed: true,
      description: "vendedor cadastra receituário (prescriptions_write_cadastro)",
    });

    if (prescriptionByVendedor) {
      await testUpdate({
        role: "vendedor",
        client: vendedor.client,
        table: "prescriptions",
        id: prescriptionByVendedor.id,
        patch: { notes: "editado pelo teste de RLS" },
        shouldSucceed: true,
        description: "vendedor edita receituário que cadastrou (prescriptions_update_cadastro)",
      });

      await testDelete({
        role: "vendedor",
        client: vendedor.client,
        table: "prescriptions",
        id: prescriptionByVendedor.id,
        shouldSucceed: false,
        description: "vendedor NÃO exclui receituário (só admin/gerente — prescriptions_delete_admin_gerente)",
      });

      await testDelete({
        role: "gerente",
        client: gerente.client,
        table: "prescriptions",
        id: prescriptionByVendedor.id,
        shouldSucceed: true,
        description: "gerente exclui receituário (prescriptions_delete_admin_gerente)",
      });
    }
  }

  // -------------------------------------------------------------------
  // SALES — regra mais fina: vendedor só enxerga/edita as próprias.
  // -------------------------------------------------------------------
  if (setupClient) {
    const saleByVendedor = await testInsert({
      role: "vendedor",
      client: vendedor.client,
      table: "sales",
      payload: {
        clientId: setupClient.id,
        clientName: setupClient.name,
        sellerId: vendedor.userId,
        sellerName: "RLS Test Vendedor",
        items: [],
        subtotal: 0,
        total: 0,
      },
      shouldSucceed: true,
      description: "vendedor registra venda própria (sales_insert_active)",
    });

    const saleByAdmin = await testInsert({
      role: "admin",
      client: admin.client,
      table: "sales",
      payload: {
        clientId: setupClient.id,
        clientName: setupClient.name,
        sellerId: admin.userId,
        sellerName: "RLS Test Admin",
        items: [],
        subtotal: 0,
        total: 0,
      },
      shouldSucceed: true,
      description: "setup: admin registra venda de 'outro vendedor' para testar isolamento (sales_insert_active)",
    });

    if (saleByVendedor && saleByAdmin) {
      await testSelect({
        role: "vendedor",
        client: vendedor.client,
        table: "sales",
        description: "vendedor só vê as próprias vendas (sales_select_own_vendedor)",
        assertFn: (data) => {
          const ids = data.map((s) => s.id);
          const seeOwn = ids.includes(saleByVendedor.id);
          const seeOthers = ids.includes(saleByAdmin.id);
          return {
            pass: seeOwn && !seeOthers,
            expected: "vê a própria, não vê a do admin",
            actual: `vê a própria: ${seeOwn}; vê a do admin: ${seeOthers}`,
          };
        },
      });

      await testSelect({
        role: "gerente",
        client: gerente.client,
        table: "sales",
        description: "gerente vê todas as vendas (sales_select_admin_gerente)",
        assertFn: (data) => {
          const ids = data.map((s) => s.id);
          const seeBoth = ids.includes(saleByVendedor.id) && ids.includes(saleByAdmin.id);
          return { pass: seeBoth, expected: "vê as duas vendas de teste", actual: `vê as duas: ${seeBoth}` };
        },
      });

      await testUpdate({
        role: "vendedor",
        client: vendedor.client,
        table: "sales",
        id: saleByVendedor.id,
        patch: { status: "pago" },
        shouldSucceed: true,
        description: "vendedor edita a própria venda (sales_update_own_vendedor)",
      });

      await testUpdate({
        role: "vendedor",
        client: vendedor.client,
        table: "sales",
        id: saleByAdmin.id,
        patch: { status: "pago" },
        shouldSucceed: false,
        description: "vendedor NÃO edita venda de outro vendedor/admin (sales_update_own_vendedor)",
      });

      await testUpdate({
        role: "admin",
        client: admin.client,
        table: "sales",
        id: saleByVendedor.id,
        patch: { status: "entregue" },
        shouldSucceed: true,
        description: "admin edita qualquer venda (sales_update_admin_gerente)",
      });

      await testDelete({
        role: "vendedor",
        client: vendedor.client,
        table: "sales",
        id: saleByVendedor.id,
        shouldSucceed: false,
        description: "vendedor NÃO exclui venda, nem a própria (só admin/gerente — sales_delete_admin_gerente)",
      });

      await testDelete({
        role: "gerente",
        client: gerente.client,
        table: "sales",
        id: saleByVendedor.id,
        shouldSucceed: true,
        description: "gerente exclui venda (sales_delete_admin_gerente)",
      });

      await testDelete({
        role: "admin",
        client: admin.client,
        table: "sales",
        id: saleByAdmin.id,
        shouldSucceed: true,
        description: "admin exclui venda (sales_delete_admin_gerente)",
      });
    }
  }

  return { admin };
}

// ============================================================================
// 6. Limpeza final — roda sempre (sucesso ou falha), usando o cliente admin
//    (que tem delete em clients/products/prescriptions/sales pela própria
//    matriz testada). Falha de limpeza é reportada, mas não mascarada.
// ============================================================================

async function cleanup(adminClient) {
  const leftovers = [];
  for (const table of cleanupOrder) {
    const ids = cleanupRegistry[table];
    if (ids.length === 0) continue;
    const { error, data } = await adminClient.from(table).delete().in("id", ids).select();
    const deletedIds = new Set((data || []).map((r) => r.id));
    const notDeleted = ids.filter((id) => !deletedIds.has(id));
    if (error) {
      console.error(`[test-rls] Erro ao limpar ${table} (ids ${ids.join(", ")}): ${error.message}`);
      leftovers.push({ table, ids });
    } else if (notDeleted.length > 0) {
      leftovers.push({ table, ids: notDeleted });
    }
  }
  if (leftovers.length > 0) {
    console.error("\n[test-rls] ATENÇÃO: dados de teste não foram limpos completamente:");
    for (const { table, ids } of leftovers) {
      console.error(`  - ${table}: ${ids.join(", ")}`);
    }
    console.error("Verifique manualmente no Supabase do ambiente de teste/staging.\n");
    return false;
  }
  return true;
}

// ============================================================================
// 7. Execução + resumo final.
// ============================================================================

let adminClientForCleanup = null;
let exitCode = 0;

try {
  const { admin } = await main();
  adminClientForCleanup = admin.client;
} catch (err) {
  console.error("\n[test-rls] Erro inesperado durante a execução dos testes:");
  console.error(err);
  exitCode = 1;
}

if (adminClientForCleanup) {
  const cleanedOk = await cleanup(adminClientForCleanup);
  if (!cleanedOk) exitCode = 1;
} else {
  console.error("[test-rls] Não foi possível autenticar como admin — pulei a limpeza (nada foi criado com sucesso, ou o login falhou antes).");
}

// ---------------------------------------------------------------------
// Resumo tipo tabela ✅/❌ por papel × ação (mesmo formato que
// ESTRATEGIA-SAAS.md §1 sugere, agora automatizado).
// ---------------------------------------------------------------------
console.log("\n=== Resumo dos testes de RLS ===\n");
const byTable = {};
for (const r of results) {
  byTable[r.table] = byTable[r.table] || [];
  byTable[r.table].push(r);
}
for (const [table, rows] of Object.entries(byTable)) {
  console.log(`\n${table}:`);
  for (const r of rows) {
    console.log(`  ${r.pass ? "✅" : "❌"} ${r.role.padEnd(9)} ${r.action.padEnd(7)} ${r.description}`);
  }
}

const totalFail = results.filter((r) => !r.pass).length;
console.log(`\nTotal: ${results.length} casos, ${results.length - totalFail} ok, ${totalFail} falharam.\n`);

if (totalFail > 0) exitCode = 1;

process.exit(exitCode);
