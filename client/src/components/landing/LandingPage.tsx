import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Edit3,
  Download,
  Merge,
  Split,
  Shield,
  Zap,
  Eye,
  Users,
  Star,
  Check,
  ArrowRight,
  Github,
  Twitter,
  Mail,
  Heart,
  Globe,
  Lock,
  Clock,
} from "lucide-react";
import { AuthDialogs } from "../auth/AuthSystem";

interface LandingPageProps {
  onGetStarted?: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold">PDF4EVER</span>
              <Badge variant="secondary">Free</Badge>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Pricing
              </a>
              <a
                href="#about"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                About
              </a>
              <AuthDialogs
                trigger={<Button variant="outline">Sign In</Button>}
              />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              The Ultimate
              <span className="text-blue-600 dark:text-blue-400">
                {" "}
                PDF Editor
              </span>
              <br />
              You'll Ever Need
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Edit, merge, split, annotate, and transform your PDFs with our
              powerful, privacy-first editor. No downloads required, works
              entirely in your browser.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="text-lg px-8 py-3"
                onClick={onGetStarted}
              >
                <Upload className="h-5 w-5 mr-2" />
                Start Editing Now
              </Button>

              <AuthDialogs
                defaultTab="signup"
                trigger={
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-3"
                  >
                    Create Free Account
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                }
              />
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy First
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Lightning Fast
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Works Offline
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for PDF Editing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive tools for all your PDF needs, from basic editing to
              advanced annotations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Edit3,
                title: "Rich Text Editing",
                description:
                  "Add, edit, and format text with full control over fonts, colors, and styling",
              },
              {
                icon: Eye,
                title: "Form Filling",
                description:
                  "Detect and fill PDF forms automatically with smart field recognition",
              },
              {
                icon: Merge,
                title: "Merge & Split",
                description:
                  "Combine multiple PDFs or split large documents into smaller files",
              },
              {
                icon: FileText,
                title: "OCR Text Recognition",
                description:
                  "Extract text from scanned documents with advanced OCR technology",
              },
              {
                icon: Shield,
                title: "Privacy Protected",
                description:
                  "All processing happens in your browser - your files never leave your device",
              },
              {
                icon: Download,
                title: "Multiple Export Options",
                description:
                  "Save as PDF, export text, or download individual pages",
              },
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />

                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "1M+", label: "Documents Processed" },
              { number: "50K+", label: "Happy Users" },
              { number: "99.9%", label: "Uptime" },
              { number: "0", label: "Data Stored" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Choose the plan that works best for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">Free Forever</CardTitle>
                <div className="text-4xl font-bold">$0</div>
                <p className="text-gray-600 dark:text-gray-300">
                  Perfect for personal use
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Upload files up to 10MB",
                  "Basic editing tools",
                  "Form filling",
                  "Text extraction",
                  "Browser-based processing",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />

                    <span>{feature}</span>
                  </div>
                ))}
                <Button className="w-full mt-6" onClick={onGetStarted}>
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-blue-500 shadow-lg">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="text-4xl font-bold">
                  $9
                  <span className="text-lg">/month</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  For power users and professionals
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Everything in Free",
                  "Upload files up to 100MB",
                  "Advanced annotation tools",
                  "Batch processing",
                  "OCR in 10+ languages",
                  "Priority support",
                  "Cloud sync (optional)",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />

                    <span>{feature}</span>
                  </div>
                ))}
                <AuthDialogs
                  defaultTab="signup"
                  trigger={
                    <Button className="w-full mt-6">Start Pro Trial</Button>
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-16 px-4 bg-blue-50 dark:bg-blue-900/20">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <Shield className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-6" />

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Your Privacy is Our Priority
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Unlike other PDF editors, we process everything in your browser.
              Your documents never leave your device, ensuring complete privacy
              and security.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-500" />
                Client-side processing
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-500" />
                No data collection
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                Works offline
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your PDF Workflow?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who trust PDF4EVER for their document needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-3"
              onClick={onGetStarted}
            >
              Start Editing Now
            </Button>
            <AuthDialogs
              defaultTab="signup"
              trigger={
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600"
                >
                  Create Free Account
                </Button>
              }
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold">PDF4EVER</span>
              </div>
              <p className="text-gray-400 mb-4">
                The most powerful PDF editor that respects your privacy.
              </p>
              <div className="flex gap-4">
                <Button size="sm" variant="ghost">
                  <Github className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <div className="space-y-2 text-gray-400">
                <div>PDF Editor</div>
                <div>Form Filling</div>
                <div>Text Recognition</div>
                <div>Merge & Split</div>
                <div>Annotations</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-2 text-gray-400">
                <div>Documentation</div>
                <div>API Reference</div>
                <div>Tutorials</div>
                <div>Blog</div>
                <div>Support</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-gray-400">
                <div>About Us</div>
                <div>Privacy Policy</div>
                <div>Terms of Service</div>
                <div>Contact</div>
                <div>Careers</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>
              © 2024 PDF4EVER. Made with{" "}
              <Heart className="h-4 w-4 inline text-red-500" /> for document
              lovers worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
