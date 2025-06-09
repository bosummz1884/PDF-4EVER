import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignupDialog } from "@/components/SignupDialog";
import { LoginDialog } from "@/components/LoginDialog";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Shield, Users, Zap, Download, Edit3, Lock } from "lucide-react";
import logoImage from "@assets/70x70logo.png";

export default function Landing() {
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { login } = useAuth();

  const handleAuthSuccess = (user: any, token: string) => {
    login(user, token);
  };

  const handleSwitchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={logoImage} 
              alt="PDF4EVER Logo" 
              className="h-10 w-10"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              PDF4EVER
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => setShowLogin(true)}>
              Sign In
            </Button>
            <Button onClick={() => setShowSignup(true)}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            Edit PDFs with Complete Privacy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Professional PDF editing tools that work entirely in your browser. 
            Your files never leave your device - guaranteed privacy protection.
          </p>
          <div className="flex justify-center">
            <Button size="lg" onClick={() => setShowSignup(true)} className="bg-blue-600 hover:bg-blue-700">
              Start Editing for Free
            </Button>
          </div>
        </div>
      </section>

      {/* Why PDF4EVER Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose PDF4EVER?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Complete Privacy</h3>
              <p className="text-gray-600 dark:text-gray-300">
                All processing happens locally. We never store your files on our servers.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Lock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Data Respect</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your personal information is never shared with third parties. We protect your privacy above all.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Edit3 className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Professional Tools</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Advanced editing, annotations, signatures, OCR, and form filling capabilities.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-300">
                No uploads, no waiting. Start editing immediately in your browser.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features List */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Text editing and formatting",
              "Digital signatures",
              "Form filling",
              "OCR text extraction",
              "Page merging and splitting",
              "Annotation tools",
              "Font matching",
              "Invoice generation",
              "Watermark removal"
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Guarantee */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Your Privacy is Sacred</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            We believe your documents should remain yours. That's why PDF4EVER processes 
            everything locally in your browser. No file uploads, no cloud storage, 
            no data collection. Just pure, secure PDF editing.
          </p>
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
            <div>✓ No file uploads</div>
            <div>✓ No cloud storage</div>
            <div>✓ No tracking</div>
            <div>✓ 100% local processing</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-orange-500 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Editing?</h2>
          <p className="text-xl opacity-90 mb-8">
            Join thousands of users who trust PDF4EVER for secure document editing.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => setShowSignup(true)}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src={logoImage} 
              alt="PDF4EVER Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">PDF4EVER</span>
          </div>
          <div className="flex justify-center space-x-6 mb-4 text-sm">
            <a href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="text-gray-300 hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
          <p className="text-gray-400">
            © 2024 PDF4EVER. Privacy-first PDF editing for everyone.
          </p>
        </div>
      </footer>

      {/* Auth Dialogs */}
      <SignupDialog
        open={showSignup}
        onOpenChange={setShowSignup}
        onSuccess={handleAuthSuccess}
      />
      
      <LoginDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        onSuccess={handleAuthSuccess}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </div>
  );
}