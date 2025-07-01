import React, { createContext, useContext } from "react";

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isVerified: boolean;
  profileImageUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  token: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: React.ReactNode;
}

// Optionally, create your AuthProvider component here:
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // You would put real auth state logic here!
  // Here is a placeholder so your project compiles:
  const fakeAuth: AuthContextType = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
    token: null,
  };

  return (
    <AuthContext.Provider value={fakeAuth}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext); // FIXED: useContext, not AuthContext()
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
