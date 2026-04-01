"use client";

import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getClientAuth(), (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(getClientAuth());
    router.push("/");
  };

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(getClientAuth(), new GoogleAuthProvider());
    const u = result.user;
    const ref = doc(getClientDb(), "users", u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        createdAt: serverTimestamp(),
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}
