import { useAuth } from "@/features/hooks/useAuth";
import Landing from "./landing";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import PDFEditorContainer from "@/features/pdf-editor/PDFEditorContainer";
import { useIsMobile } from "@/features/hooks/use-mobile";

export default function Home() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const isMobile = useIsMobile(); // <-- Only call hooks inside function components!
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

  return (
    <div className="min-h-screen bg-background">
      {/* PDF Editor at the top - always visible */}
      <div className="border-b bg-white dark:bg-gray-900">
        <div className="h-screen flex flex-col">
          {/* Header with optional auth */}
          <header className="border-b bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <img
                src="/70x70logo.png"
                alt="PDF4EVER Logo"
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">
                <span style={{ color: "#005aff" }}>PDF4</span>
                <span style={{ color: "#ff3900" }}>EVER</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                  <Button size="sm">Sign Up</Button>
                </div>
            </div>
          </header>

          {/* Full-height PDF Editor - always available */}
          <div className="flex-1 overflow-hidden">
            <PDFEditorContainer />
          </div>
        </div>
      </div>

      {/* Landing page content below the PDF editor */}
      <Landing />
    </div>
  );
}
