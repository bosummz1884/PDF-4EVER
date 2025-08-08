import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LogIn,
  UserPlus,
  User,
  LogOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In static mode, skip auth check
    if (
      typeof window !== "undefined" &&
      !window.location.hostname.includes("replit")
    ) {
      setIsLoading(false);
      return;
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setUser(data.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value} data-oid="d:4zizb">
      {children}
    </AuthContext.Provider>
  );
}

interface AuthDialogsProps {
  trigger?: ReactNode;
  defaultTab?: "login" | "signup";
}

export function AuthDialogs({
  trigger,
  defaultTab = "login",
}: AuthDialogsProps) {
  const { login, signup, isLoading, error } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
      setOpen(false);
      resetForms();
    } catch (error) {
      // Error handled by context
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== confirmPassword) {
      return;
    }

    try {
      await signup(signupEmail, signupPassword, signupName);
      setOpen(false);
      resetForms();
    } catch (error) {
      // Error handled by context
    }
  };

  const resetForms = () => {
    setLoginEmail("");
    setLoginPassword("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupName("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const defaultTrigger = (
    <Button variant="outline" data-oid="g.fqn-k">
      <LogIn className="h-4 w-4 mr-2" data-oid="tns:sh:" />
      Sign In
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen} data-oid="5db5nme">
      <DialogTrigger asChild data-oid=":06:eh2">
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-oid="a3lc36d">
        <DialogHeader data-oid="q5lrqyv">
          <DialogTitle data-oid="ooq10_x">Welcome to PDF4EVER</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "login" | "signup")}
          data-oid="fw7vzfg"
        >
          <TabsList className="grid w-full grid-cols-2" data-oid="spumd94">
            <TabsTrigger value="login" data-oid="_a7zm10">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" data-oid="__jeo5g">
              Sign Up
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" data-oid="ql:f-vh">
              <AlertDescription data-oid="wokyb9y">{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="login" data-oid="cwufg5v">
            <form
              onSubmit={handleLogin}
              className="space-y-4"
              data-oid="6lpnn2o"
            >
              <div className="space-y-2" data-oid="2fzym9s">
                <Label htmlFor="login-email" data-oid="fjxq10d">
                  Email
                </Label>
                <div className="relative" data-oid="r:2v56z">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                    data-oid="gkantpb"
                  />

                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                    data-oid="_e6l9:m"
                  />
                </div>
              </div>

              <div className="space-y-2" data-oid="4pvl1o5">
                <Label htmlFor="login-password" data-oid="ihie-y3">
                  Password
                </Label>
                <div className="relative" data-oid="4r::nu9">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                    data-oid="ztxtb60"
                  />

                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    required
                    data-oid="wn28k6r"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    data-oid="r_wzhov"
                  >
                    {showPassword ? (
                      <EyeOff
                        className="h-4 w-4 text-gray-400"
                        data-oid="me.mb89"
                      />
                    ) : (
                      <Eye
                        className="h-4 w-4 text-gray-400"
                        data-oid="f9ip4pd"
                      />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-oid=".e5.o56"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" data-oid="i02m2qc">
            <form
              onSubmit={handleSignup}
              className="space-y-4"
              data-oid=".tv1-oq"
            >
              <div className="space-y-2" data-oid="6ga44j9">
                <Label htmlFor="signup-name" data-oid="n7gz9sq">
                  Name (Optional)
                </Label>
                <div className="relative" data-oid="buiwz0z">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                    data-oid="pvtym7k"
                  />

                  <Input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Enter your name"
                    className="pl-10"
                    data-oid=":k61.n-"
                  />
                </div>
              </div>

              <div className="space-y-2" data-oid="eosaqdh">
                <Label htmlFor="signup-email" data-oid="s7ko2km">
                  Email
                </Label>
                <div className="relative" data-oid="2je.mrq">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                    data-oid="nbe7y6x"
                  />

                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                    data-oid="968j9h5"
                  />
                </div>
              </div>

              <div className="space-y-2" data-oid="m.okfh5">
                <Label htmlFor="signup-password" data-oid="ki:.gb:">
                  Password
                </Label>
                <div className="relative" data-oid="pg2i.dw">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                    data-oid="nfq2w0n"
                  />

                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a password"
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                    data-oid="bh7v:0v"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    data-oid="4_nu4t0"
                  >
                    {showPassword ? (
                      <EyeOff
                        className="h-4 w-4 text-gray-400"
                        data-oid="_1hrora"
                      />
                    ) : (
                      <Eye
                        className="h-4 w-4 text-gray-400"
                        data-oid="viol476"
                      />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2" data-oid="5psiugi">
                <Label htmlFor="confirm-password" data-oid="j8omqd.">
                  Confirm Password
                </Label>
                <div className="relative" data-oid="jttzb33">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                    data-oid="vjtqi5k"
                  />

                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-10"
                    required
                    data-oid="cutdxn6"
                  />
                </div>
                {confirmPassword && signupPassword !== confirmPassword && (
                  <p className="text-sm text-red-500" data-oid="lijqq_e">
                    Passwords do not match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || signupPassword !== confirmPassword}
                data-oid="8rzi_y:"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} data-oid="hk:6s7z">
      <DialogTrigger asChild data-oid="tob9pu-">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          data-oid="7dzsxgz"
        >
          <User className="h-4 w-4" data-oid="x-pust1" />
          <span className="hidden sm:inline" data-oid="6_j8_81">
            {user.name || user.email.split("@")[0]}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-oid="y5nu655">
        <DialogHeader data-oid="hld8bg2">
          <DialogTitle data-oid="v:x3fm5">Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4" data-oid="9c_oorb">
          <div className="text-center space-y-2" data-oid=":h2tsz7">
            <div
              className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto"
              data-oid="prpjq:9"
            >
              <User className="h-8 w-8 text-gray-500" data-oid="4qpwvim" />
            </div>
            <div data-oid="qt54hvh">
              <p className="font-medium" data-oid="u2wn:bf">
                {user.name || "User"}
              </p>
              <p className="text-sm text-gray-500" data-oid="4seaqkd">
                {user.email}
              </p>
            </div>
          </div>

          <div className="border-t pt-4" data-oid="6b_.d-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
              data-oid="_1nj3it"
            >
              <LogOut className="h-4 w-4 mr-2" data-oid="h2o6yfs" />
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
