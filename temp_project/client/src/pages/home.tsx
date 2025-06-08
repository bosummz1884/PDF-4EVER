import { useAuth } from "@/hooks/useAuth";
import Landing from "./landing";
import { AdvancedPDFEditor } from "@/components/AdvancedPDFEditor";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import logoImage from "@assets/70x70logo.png";

function AuthenticatedHome() {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      <header className="border-b bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <img 
            src={logoImage} 
            alt="PDF4EVER Logo" 
            className="h-8 w-8"
          />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            PDF4EVER
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{user?.firstName} {user?.lastName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Full-height PDF Editor */}
      <div className="flex-1 overflow-hidden">
        <AdvancedPDFEditor className="h-full" />
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedHome />;
}
