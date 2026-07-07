// Cliente
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  birthDate?: string;
  sex?: "M" | "F" | "Outro";
  address?: string;
  // Endereço em campos separados
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  createdAt: string;
  updatedAt: string;
}

// Produto (armação, lente, acessório)
export type ProductType = "armacao" | "lente" | "acessorio";

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  sku?: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
  supplier?: string;
  // Específicos por tipo: armação
  frameType?: string;
  // Específicos por tipo: lente
  lensType?: string;
  treatmentType?: string;
  createdAt: string;
  updatedAt: string;
}

// Receituário - graus por olho (OD = direito, OS = esquerdo)
export interface EyePrescription {
  sph?: number;   // Esférico (dioptrias)
  cyl?: number;   // Cilíndrico (astigmatismo)
  axis?: number;  // Eixo (1-180°)
  add?: number;   // Adição (multifocal/perto)
}

export interface Prescription {
  id: string;
  clientId: string;
  doctorName: string;
  doctorCrm?: string;
  date: string;
  od: EyePrescription;
  os: EyePrescription;
  pd?: number;    // Distância pupilar (mm)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Item de venda
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Forma de pagamento
export type PaymentMethod =
  | "dinheiro"
  | "pix"
  | "cartao_debito"
  | "cartao_credito"
  | "parcelado"
  | "boleto"
  | "outro";

// Forma de pagamento ao quitar boleto/parcela (sem boleto/parcelado)
export type PaymentMethodQuitar = "dinheiro" | "pix" | "cartao_debito" | "cartao_credito";

// Parcela de boleto (até 6x)
export interface BoletoParcela {
  id: string;
  dueDate: string;       // ISO date
  amount: number;       // valor da parcela
  status: "pendente" | "pago" | "vencido";
  paidAt?: string;      // ISO datetime quando foi pago
  paymentMethodUsed?: PaymentMethodQuitar; // forma de pagamento ao dar baixa
}

// Venda
export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  sellerId?: string;
  sellerName?: string;
  paymentMethod?: PaymentMethod;
  boletoParcelas?: BoletoParcela[]; // preenchido quando paymentMethod === "boleto"
  prescriptionId?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: "pendente" | "pago" | "entregue" | "cancelado";
  paidAt?: string;
  deliveredAt?: string;
  expectedDeliveryDate?: string; // data prevista de entrega (ISO date)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Usuário do sistema (níveis de acesso)
export type UserRole = "admin" | "gerente" | "vendedor";

// "convidado": e-mail de convite enviado, ainda não definiu senha e não logou.
// "ativo"/"inativo": usuário já ativou a conta; inativo = acesso bloqueado.
export type UserStatus = "convidado" | "ativo" | "inativo";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
