import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";

// Create a context to track auth state globally since customFetch is opaque
interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [, setLocation] = useLocation();

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("auth_token", newToken);
    } else {
      localStorage.removeItem("auth_token");
    }
    setTokenState(newToken);
  };

  const logout = () => {
    setToken(null);
    setLocation("/login");
  };

  // Monkey patch fetch to inject the Authorization header for all API calls
  // This ensures the generated customFetch works without needing modification
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource, config] = args;
      
      let url = '';
      if (typeof resource === 'string') {
        url = resource;
      } else if (resource instanceof Request) {
        url = resource.url;
      }

      // Only intercept /api requests
      if (url.includes('/api/')) {
        const currentToken = localStorage.getItem("auth_token");
        if (currentToken) {
          const newConfig = { ...config } as RequestInit;
          newConfig.headers = {
            ...newConfig.headers,
            'Authorization': `Bearer ${currentToken}`
          };
          return originalFetch(resource, newConfig);
        }
      }
      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch; // Cleanup on unmount
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated: !!token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
