import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { PDFEditorProvider } from '@/features/pdf-editor/PDFEditorContext';
import PDFEditorContainer from '@/features/pdf-editor/PDFEditorContainer';
import Landing from './landing';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      {/* Header */}
      <header className="w-full border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/70x70logo.png" alt="PDF4EVER Logo" className="h-8 w-8" />
            <span className="text-xl font-bold">
              <span className="text-blue-600">PDF4</span>
              <span className="text-orange-500">EVER</span>
            </span>
          </Link>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {/* Auth buttons would go here, managed by the AuthProvider */}
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button size="sm">Sign Up</Button>
          </div>
        </div>
      </header>
      
      {/* PDF Editor section */}
      <div className="w-full border-b shadow-inner-lg bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto">
           <div className="h-[calc(100vh-61px)] max-h-[800px]">
            <PDFEditorProvider>
                <PDFEditorContainer />
            </PDFEditorProvider>
           </div>
        </div>
      </div>

      {/* Landing page content below the editor */}
      <div className="w-full">
        <Landing />
      </div>

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 PDF4EVER. Privacy-first PDF editing for everyone.</p>
        </div>
      </footer>
    </div>
  );
}