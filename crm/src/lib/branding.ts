// Identidade visual em uso hoje: a loja (Home Ótica) e o produto (Ópsis CRM).
//
// Centralizado aqui de propósito: quando o CRM virar multi-tenant, este é o
// único lugar que precisa passar a resolver STORE_NAME/STORE_LOGO_SRC a partir
// da loja logada (ex: tabela `stores`, por `storeId`) em vez de constantes
// fixas — Sidebar, login e definir-senha já importam daqui, então nenhum
// desses componentes precisa mudar quando isso acontecer.
export const STORE_NAME = "Home Ótica";
export const STORE_LOGO_SRC = "/brand/home-otica-logo.png";

// Marca do produto (Ópsis CRM) — usada na tela de login/definir-senha (antes
// de a pessoa estar "dentro" de uma loja) e como assinatura discreta dentro
// do app já autenticado.
export const PRODUCT_NAME = "Ópsis CRM";
export const PRODUCT_LOGO_SRC = "/brand/opsis-crm-logo.svg";
export const PRODUCT_TAGLINE = "By Ópsis CRM";
