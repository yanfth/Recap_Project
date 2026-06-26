import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "owner" | "kasir" | null;

interface AuthContextType {
  role: Role;
  login: (pin: string) => Promise<"owner" | "kasir" | "invalid">;
  logout: () => void;
  setPins: (ownerPin: string, kasirPin: string) => Promise<void>;
  ownerPin: string;
  kasirPin: string;
}

// ─── Default PIN ──────────────────────────────────────────────────────────────
// Bisa diubah owner kapan saja lewat fitur pengaturan PIN

const DEFAULT_OWNER_PIN = "1234";
const DEFAULT_KASIR_PIN = "0000";

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [ownerPin, setOwnerPin] = useState(DEFAULT_OWNER_PIN);
  const [kasirPin, setKasirPin] = useState(DEFAULT_KASIR_PIN);

  // Load PIN tersimpan saat app pertama dibuka
  useEffect(() => {
    AsyncStorage.multiGet(["ownerPin", "kasirPin"]).then((pairs) => {
      const savedOwner = pairs[0][1];
      const savedKasir = pairs[1][1];
      if (savedOwner) setOwnerPin(savedOwner);
      if (savedKasir) setKasirPin(savedKasir);
    });
  }, []);

  // Login — cocokkan PIN, return role atau "invalid"
  const login = async (pin: string): Promise<"owner" | "kasir" | "invalid"> => {
    if (pin === ownerPin) {
      setRole("owner");
      return "owner";
    }
    if (pin === kasirPin) {
      setRole("kasir");
      return "kasir";
    }
    return "invalid";
  };

  // Logout — kembali ke login screen
  const logout = () => setRole(null);

  // Ubah PIN (hanya owner yang bisa akses fitur ini)
  const setPins = async (newOwner: string, newKasir: string) => {
    if (newOwner === newKasir) {
      throw new Error("PIN Owner dan Kasir tidak boleh sama!");
    }
    if (newOwner.length !== 4 || newKasir.length !== 4) {
      throw new Error("PIN harus 4 digit!");
    }
    await AsyncStorage.multiSet([
      ["ownerPin", newOwner],
      ["kasirPin", newKasir],
    ]);
    setOwnerPin(newOwner);
    setKasirPin(newKasir);
  };

  return (
    <AuthContext.Provider
      value={{ role, login, logout, setPins, ownerPin, kasirPin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
};
