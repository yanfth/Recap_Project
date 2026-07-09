import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type Role = "owner" | "kasir" | null;

interface AuthContextType {
  role: Role;
  login: (pin: string) => Promise<"owner" | "kasir" | "invalid">;
  logout: () => void;
  setPins: (ownerPin: string, kasirPin: string) => Promise<void>;
  ownerPin: string;
  kasirPin: string;
  isSetupDone: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [ownerPin, setOwnerPin] = useState(""); // ⬅️ kosong, bukan default lagi
  const [kasirPin, setKasirPin] = useState(""); // ⬅️ kosong, bukan default lagi
  const [isSetupDone, setIsSetupDone] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet(["ownerPin", "kasirPin", "setupDone"]).then(
      (pairs) => {
        const savedOwner = pairs[0][1];
        const savedKasir = pairs[1][1];
        const savedSetupDone = pairs[2][1];
        if (savedOwner) setOwnerPin(savedOwner);
        if (savedKasir) setKasirPin(savedKasir);
        setIsSetupDone(savedSetupDone === "true");
      },
    );
  }, []);

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

  const logout = () => setRole(null);

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
      ["setupDone", "true"],
    ]);
    setOwnerPin(newOwner);
    setKasirPin(newKasir);
    setIsSetupDone(true);
  };

  return (
    <AuthContext.Provider
      value={{ role, login, logout, setPins, ownerPin, kasirPin, isSetupDone }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
};
