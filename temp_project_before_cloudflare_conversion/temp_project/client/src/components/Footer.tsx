import { Button } from "@/components/ui/button";
import { Twitter, Facebook, Linkedin, Github } from "lucide-react";

export default function Footer() {
  const handleSocial = (platform: string) => {
    console.log(`Social link clicked: ${platform}`);
  };

  const handleContact = () => {
    console.log("Contact clicked");
  };

  const handlePrivacy = () => {
    console.log("Privacy Policy clicked");
  };

  const handleTerms = () => {
    console.log("Terms of Service clicked");
  };

  const socialLinks = [
    { icon: Twitter, platform: "twitter", label: "Twitter" },
    { icon: Facebook, platform: "facebook", label: "Facebook" },
    { icon: Linkedin, platform: "linkedin", label: "LinkedIn" },
    { icon: Github, platform: "github", label: "GitHub" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-card dark:bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-muted-foreground">PDF</span><span className="text-primary">4EVER</span>
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              The most powerful online PDF editor. Edit, convert, and manage your PDFs with ease.
            </p>
            {/* Social Media Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <Button
                  key={social.platform}
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSocial(social.platform)}
                  className="w-10 h-10 bg-muted dark:bg-muted rounded-lg hover:bg-primary transition-colors duration-200 text-muted-foreground hover:text-white"
                >
                  <social.icon className="h-5 w-5" />
                  <span className="sr-only">{social.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection("#features")}
                  className="hover:text-primary transition-colors duration-200 text-left text-muted-foreground"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("#pricing")}
                  className="hover:text-primary transition-colors duration-200 text-left text-muted-foreground"
                >
                  Pricing
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors duration-200 text-muted-foreground">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors duration-200 text-muted-foreground">
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={handleContact}
                  className="hover:text-primary transition-colors duration-200 text-left text-muted-foreground"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  onClick={handlePrivacy}
                  className="hover:text-primary transition-colors duration-200 text-left text-muted-foreground"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={handleTerms}
                  className="hover:text-primary transition-colors duration-200 text-left text-muted-foreground"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors duration-200 text-muted-foreground">
                  Help Center
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © 2024 <span className="text-muted-foreground">PDF</span><span className="text-primary">4EVER</span>. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm mt-2 sm:mt-0 max-w-md text-right">
            Thank you for choosing <span className="text-muted-foreground">PDF</span><span className="text-primary">4EVER</span>, we appreciate you utilizing our service. If you have any suggestions, or ideas on how we could make the experience better for you please email Admin@<span className="text-muted-foreground">PDF</span><span className="text-primary">4EVER</span>.org with your comments and suggestions. Always remember to stay positive!
          </p>
        </div>
      </div>
    </footer>
  );
}
