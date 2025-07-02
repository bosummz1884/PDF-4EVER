import React from "react"
import Landing from "./landing";
import { Button } from "@/components/ui/button";
import PDFEditorContainer from "@/features/pdf-editor/PDFEditorContainer";
import { useIsMobile } from "@/features/hooks/use-mobile";

export default function Home() {
  const isMobile = useIsMobile();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* PDF Editor at the top - always visible */}
      <div className="border-b bg-white dark:bg-gray-900 w-full">
        {/* Header */}
        <header className="border-b bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between">
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
        {isMobile && (
          <div className="bg-blue-100 text-blue-800 px-4 py-2 text-center">
            Welcome to the mobile version!
          </div>
        )}
      </div>

      {/* PDF Editor container fills available space */}
      <div className="flex-1 flex flex-col w-full overflow-auto">
        <PDFEditorContainer />
      </div>

      {/* Landing page content below the PDF editor */}
      <Landing />
    </div>
  );
}
