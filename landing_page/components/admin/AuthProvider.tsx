'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isAdminEmail } from '@/lib/adminConfig';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If auth is not initialized (build time or missing config), stop loading
    if (!auth) {
      setLoading(false);
      return;
    }

    // Store auth in a const to help TypeScript understand it's defined
    const authInstance = auth;

    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
      if (firebaseUser) {
        // Validate admin status
        if (isAdminEmail(firebaseUser.email)) {
          setUser(firebaseUser);
        } else {
          // Not an admin - sign out and redirect
          await signOut(authInstance);
          setUser(null);
          router.push('/admin_portal/login?error=unauthorized');
        }
      } else {
        setUser(null);
        // Redirect to login if on a protected route
        if (pathname?.startsWith('/admin_portal/dashboard')) {
          router.push('/admin_portal/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/admin_portal/login');
  };

  const isAdmin = user !== null && isAdminEmail(user.email);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
