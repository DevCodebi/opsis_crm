/** Utilitários de CEP (Brasil) — formatação e consulta ViaCEP / BrasilAPI. */

export type CepAddress = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  complemento?: string;
};

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formata para 00000-000 enquanto digita. */
export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCep(value: string): boolean {
  return onlyDigits(value).length === 8;
}

/** Monta o texto único `address` a partir dos campos separados. */
export function composeAddress(parts: {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}): string {
  const line1 = [parts.logradouro, parts.numero].filter(Boolean).join(", ");
  const withComp = [line1, parts.complemento].filter(Boolean).join(" — ");
  const cityUf = [parts.bairro, [parts.cidade, parts.uf].filter(Boolean).join("/")].filter(Boolean).join(" · ");
  const cep = parts.cep ? `CEP ${formatCep(parts.cep)}` : "";
  return [withComp, cityUf, cep].filter(Boolean).join(" · ");
}

type ViaCepResponse = {
  erro?: boolean | string;
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

type BrasilApiResponse = {
  cep?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  message?: string;
};

/**
 * Busca endereço pelo CEP.
 * Tenta ViaCEP e, se falhar, BrasilAPI.
 */
export async function fetchAddressByCep(
  cep: string,
  signal?: AbortSignal
): Promise<CepAddress> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) {
    throw new Error("CEP deve ter 8 dígitos.");
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
    if (res.ok) {
      const data = (await res.json()) as ViaCepResponse;
      if (!data.erro) {
        return {
          cep: formatCep(data.cep ?? digits),
          logradouro: data.logradouro?.trim() ?? "",
          bairro: data.bairro?.trim() ?? "",
          cidade: data.localidade?.trim() ?? "",
          uf: (data.uf ?? "").trim().toUpperCase(),
          complemento: data.complemento?.trim() || undefined,
        };
      }
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    // cai no fallback
  }

  const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`, { signal });
  if (!res.ok) {
    if (res.status === 404) throw new Error("CEP não encontrado.");
    throw new Error("Não foi possível consultar o CEP. Tente novamente.");
  }
  const data = (await res.json()) as BrasilApiResponse;
  return {
    cep: formatCep(data.cep ?? digits),
    logradouro: data.street?.trim() ?? "",
    bairro: data.neighborhood?.trim() ?? "",
    cidade: data.city?.trim() ?? "",
    uf: (data.state ?? "").trim().toUpperCase(),
  };
}
