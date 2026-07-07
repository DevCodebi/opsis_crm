"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Client, Prescription, Product, Sale, User } from "@/types";
import { supabase } from "./supabaseClient";

function nowIso() {
  return new Date().toISOString();
}

type Store = {
  clients: Client[];
  products: Product[];
  prescriptions: Prescription[];
  sales: Sale[];
  users: User[];
  currentUser: User | null;
  initialized: boolean;
  refreshAll: () => Promise<void>;

  addClient: (c: Omit<Client, "id" | "createdAt" | "updatedAt">) => Promise<Client | null>;
  updateClient: (id: string, c: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addProduct: (p: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<Product | null>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addPrescription: (p: Omit<Prescription, "id" | "createdAt" | "updatedAt">) => Promise<Prescription | null>;
  updatePrescription: (id: string, p: Partial<Prescription>) => Promise<void>;
  deletePrescription: (id: string) => Promise<void>;

  addSale: (s: Omit<Sale, "id" | "createdAt" | "updatedAt">) => Promise<Sale | null>;
  updateSale: (id: string, s: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  addUser: (u: Omit<User, "id" | "createdAt" | "updatedAt" | "status">) => Promise<User | null>;
  updateUser: (id: string, u: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resendInvite: (id: string, email: string) => Promise<boolean>;
  sendPasswordReset: (id: string, email: string) => Promise<boolean>;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  // ---------- Fetchers ----------
  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("createdAt", { ascending: false });
    if (!error && data) setClients(data as Client[]);
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("createdAt", { ascending: false });
    if (!error && data) setProducts(data as Product[]);
  }, []);

  const fetchPrescriptions = useCallback(async () => {
    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .order("createdAt", { ascending: false });
    if (!error && data) setPrescriptions(data as Prescription[]);
  }, []);

  const fetchSales = useCallback(async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("createdAt", { ascending: false });
    if (!error && data) setSales(data as Sale[]);
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("createdAt", { ascending: false });
    if (!error && data) {
      setUsers(data as User[]);
    }
  }, []);

  const loadCurrentUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (!error && data) {
      setCurrentUser(data as User);
    } else {
      setCurrentUser(null);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchClients(),
      fetchProducts(),
      fetchPrescriptions(),
      fetchSales(),
      fetchUsers(),
    ]);
  }, [fetchClients, fetchProducts, fetchPrescriptions, fetchSales, fetchUsers]);

  // ---------- Bootstrap: sessão atual + dados + listener de auth ----------
  useEffect(() => {
    let active = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await loadCurrentUserProfile(session.user.id);
      }
      await refreshAll();
      if (active) setInitialized(true);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadCurrentUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Clients ----------
  const addClient = useCallback(async (c: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
    const { data, error } = await supabase.from("clients").insert([c]).select().single();
    if (error || !data) {
      alert("Erro ao salvar cliente: " + (error?.message ?? "desconhecido"));
      return null;
    }
    setClients((prev) => [data as Client, ...prev]);
    return data as Client;
  }, []);

  const updateClient = useCallback(async (id: string, c: Partial<Client>) => {
    const payload = { ...c, updatedAt: nowIso() };
    const { data, error } = await supabase.from("clients").update(payload).eq("id", id).select().single();
    if (error) {
      alert("Erro ao atualizar cliente: " + error.message);
      return;
    }
    setClients((prev) => prev.map((x) => (x.id === id ? (data as Client) : x)));
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      alert("Erro ao excluir cliente: " + error.message);
      return;
    }
    setClients((prev) => prev.filter((x) => x.id !== id));
  }, []);

  // ---------- Products ----------
  const addProduct = useCallback(async (p: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const { data, error } = await supabase.from("products").insert([p]).select().single();
    if (error || !data) {
      alert("Erro ao salvar produto: " + (error?.message ?? "desconhecido"));
      return null;
    }
    setProducts((prev) => [data as Product, ...prev]);
    return data as Product;
  }, []);

  const updateProduct = useCallback(async (id: string, p: Partial<Product>) => {
    const payload = { ...p, updatedAt: nowIso() };
    const { data, error } = await supabase.from("products").update(payload).eq("id", id).select().single();
    if (error) {
      alert("Erro ao atualizar produto: " + error.message);
      return;
    }
    setProducts((prev) => prev.map((x) => (x.id === id ? (data as Product) : x)));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Erro ao excluir produto: " + error.message);
      return;
    }
    setProducts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  // ---------- Prescriptions ----------
  const addPrescription = useCallback(async (p: Omit<Prescription, "id" | "createdAt" | "updatedAt">) => {
    const { data, error } = await supabase.from("prescriptions").insert([p]).select().single();
    if (error || !data) {
      alert("Erro ao salvar receituário: " + (error?.message ?? "desconhecido"));
      return null;
    }
    setPrescriptions((prev) => [data as Prescription, ...prev]);
    return data as Prescription;
  }, []);

  const updatePrescription = useCallback(async (id: string, p: Partial<Prescription>) => {
    const payload = { ...p, updatedAt: nowIso() };
    const { data, error } = await supabase.from("prescriptions").update(payload).eq("id", id).select().single();
    if (error) {
      alert("Erro ao atualizar receituário: " + error.message);
      return;
    }
    setPrescriptions((prev) => prev.map((x) => (x.id === id ? (data as Prescription) : x)));
  }, []);

  const deletePrescription = useCallback(async (id: string) => {
    const { error } = await supabase.from("prescriptions").delete().eq("id", id);
    if (error) {
      alert("Erro ao excluir receituário: " + error.message);
      return;
    }
    setPrescriptions((prev) => prev.filter((x) => x.id !== id));
  }, []);

  // ---------- Sales ----------
  const addSale = useCallback(async (s: Omit<Sale, "id" | "createdAt" | "updatedAt">) => {
    const { data, error } = await supabase.from("sales").insert([s]).select().single();
    if (error || !data) {
      alert("Erro ao salvar venda: " + (error?.message ?? "desconhecido"));
      return null;
    }
    setSales((prev) => [data as Sale, ...prev]);
    return data as Sale;
  }, []);

  const updateSale = useCallback(async (id: string, s: Partial<Sale>) => {
    const payload = { ...s, updatedAt: nowIso() };
    const { data, error } = await supabase.from("sales").update(payload).eq("id", id).select().single();
    if (error) {
      alert("Erro ao atualizar venda: " + error.message);
      return;
    }
    setSales((prev) => prev.map((x) => (x.id === id ? (data as Sale) : x)));
  }, []);

  const deleteSale = useCallback(async (id: string) => {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) {
      alert("Erro ao excluir venda: " + error.message);
      return;
    }
    setSales((prev) => prev.filter((x) => x.id !== id));
  }, []);

  // ---------- Users (via API server-side com service_role) ----------
  // Todas as chamadas à API de usuários precisam provar que quem está
  // pedindo é um admin autenticado — anexamos o access_token da sessão
  // atual no header Authorization (a API valida isso e o papel do usuário).
  const authFetch = useCallback(async (input: string, init: RequestInit) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
    return fetch(input, { ...init, headers });
  }, []);

  const addUser = useCallback(
    async (u: Omit<User, "id" | "createdAt" | "updatedAt" | "status">) => {
      const res = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify(u),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert("Erro ao convidar usuário: " + (json.error ?? res.statusText));
        return null;
      }
      const created: User = json.profile;
      setUsers((prev) => [created, ...prev]);
      return created;
    },
    [authFetch]
  );

  const updateUser = useCallback(
    async (id: string, u: Partial<User>) => {
      const res = await authFetch("/api/users", {
        method: "PATCH",
        body: JSON.stringify({ id, ...u }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert("Erro ao atualizar usuário: " + (json.error ?? res.statusText));
        return;
      }
      const updated: User = json.profile;
      setUsers((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setCurrentUser((prevCurrent) => (prevCurrent?.id === id ? updated : prevCurrent));
    },
    [authFetch]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      const res = await authFetch("/api/users", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert("Erro ao excluir usuário: " + (json.error ?? res.statusText));
        return;
      }
      setUsers((prev) => prev.filter((x) => x.id !== id));
    },
    [authFetch]
  );

  const resendInvite = useCallback(
    async (id: string, email: string) => {
      const res = await authFetch("/api/users", {
        method: "PUT",
        body: JSON.stringify({ id, email, action: "resend_invite" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert("Erro ao reenviar convite: " + (json.error ?? res.statusText));
        return false;
      }
      return true;
    },
    [authFetch]
  );

  const sendPasswordReset = useCallback(
    async (id: string, email: string) => {
      const res = await authFetch("/api/users", {
        method: "PUT",
        body: JSON.stringify({ id, email, action: "send_reset" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert("Erro ao enviar link de redefinição: " + (json.error ?? res.statusText));
        return false;
      }
      return true;
    },
    [authFetch]
  );

  // ---------- Auth ----------
  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return false;
      await loadCurrentUserProfile(data.user.id);
      await refreshAll();
      return true;
    },
    [loadCurrentUserProfile, refreshAll]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  // Recuperação de senha auto-atendida (tela de login "Esqueci minha
  // senha"). Chama o Supabase Auth direto do navegador — não passa pela
  // API admin, pois quem pede ainda não está autenticado.
  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/definir-senha`,
    });
    return !error;
  }, []);

  const value = useMemo<Store>(
    () => ({
      clients,
      products,
      prescriptions,
      sales,
      users,
      currentUser,
      initialized,
      refreshAll,
      addClient,
      updateClient,
      deleteClient,
      addProduct,
      updateProduct,
      deleteProduct,
      addPrescription,
      updatePrescription,
      deletePrescription,
      addSale,
      updateSale,
      deleteSale,
      addUser,
      updateUser,
      deleteUser,
      resendInvite,
      sendPasswordReset,
      login,
      logout,
      requestPasswordReset,
    }),
    [
      clients,
      products,
      prescriptions,
      sales,
      users,
      currentUser,
      initialized,
      refreshAll,
      addClient,
      updateClient,
      deleteClient,
      addProduct,
      updateProduct,
      deleteProduct,
      addPrescription,
      updatePrescription,
      deletePrescription,
      addSale,
      updateSale,
      deleteSale,
      addUser,
      updateUser,
      deleteUser,
      resendInvite,
      sendPasswordReset,
      login,
      logout,
      requestPasswordReset,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
