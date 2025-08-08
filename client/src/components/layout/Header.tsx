import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Link } from "wouter";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogin = () => {
    console.log("Login clicked");
  };

  const handleSignUp = () => {
    console.log("Sign up clicked");
  };

  const navItems = [
    { name: "Home", href: "#home" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "#about" },
  ];

  const handleNavClick = (href: string) => {
    if (href.startsWith("/")) {
      // Navigate to route
      window.location.href = href;
    } else {
      // Scroll to section
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`bg-background dark:bg-background border-b border-border sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? "shadow-lg" : "shadow-sm"}`}
      data-oid="2vn0ec4"
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        data-oid="t_:3-i."
      >
        <div
          className="flex justify-between items-center h-16"
          data-oid="p5mbcvd"
        >
          {/* Logo */}
          <div className="flex items-center" data-oid="6xe7q9p">
            <div className="flex-shrink-0" data-oid=".qbcxbq">
              <h1 className="text-2xl font-bold" data-oid="3c6jrld">
                <span className="text-muted-foreground" data-oid="r9.7-hg">
                  PDF
                </span>
                <span className="text-primary" data-oid="7df6fnq">
                  4EVER
                </span>
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block" data-oid="pkipq8k">
            <div
              className="ml-10 flex items-baseline space-x-8"
              data-oid="9a8ie5d"
            >
              {navItems.map((item, index) =>
                item.href.startsWith("/") ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      index === 0
                        ? "text-foreground hover:text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                    data-oid="pk4dz2v"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      index === 0
                        ? "text-foreground hover:text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                    data-oid="2.6-l5g"
                  >
                    {item.name}
                  </button>
                ),
              )}
            </div>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:block" data-oid=".vl8qoe">
            <div
              className="ml-4 flex items-center md:ml-6 space-x-3"
              data-oid="6vy73v2"
            >
              <ThemeToggle data-oid="l9hrm85" />
              <Button
                variant="ghost"
                onClick={handleLogin}
                className="text-muted-foreground hover:text-primary hover:bg-transparent px-4 py-2 text-sm font-medium border-0"
                data-oid=".dug0rb"
              >
                Login
              </Button>
              <Button
                onClick={handleSignUp}
                className="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-lg text-sm font-medium border-0"
                data-oid="92i6fa6"
              >
                Sign Up
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div
            className="md:hidden flex items-center space-x-2"
            data-oid="rpewxld"
          >
            <ThemeToggle data-oid="4_97kn4" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted-foreground hover:text-primary"
              data-oid="c8rp.xh"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" data-oid="lyv7i1c" />
              ) : (
                <Menu className="h-6 w-6" data-oid="t37suo4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-border bg-background"
          data-oid="wqy-ft-"
        >
          <div className="px-2 pt-2 pb-3 space-y-1" data-oid="04ao5n:">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="text-muted-foreground block px-3 py-2 text-base font-medium w-full text-left hover:text-primary"
                data-oid="gd4-p.z"
              >
                {item.name}
              </button>
            ))}
            <div
              className="pt-4 pb-3 border-t border-border"
              data-oid="gytc:jo"
            >
              <div
                className="flex items-center px-3 space-x-3"
                data-oid="clvhryb"
              >
                <Button
                  variant="ghost"
                  onClick={handleLogin}
                  className="text-muted-foreground px-4 py-2 text-sm font-medium"
                  data-oid="bsc1a2r"
                >
                  Login
                </Button>
                <Button
                  onClick={handleSignUp}
                  className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium"
                  data-oid="9atqeb1"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
