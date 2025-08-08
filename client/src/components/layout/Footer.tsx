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
    <footer
      className="bg-card dark:bg-card border-t border-border"
      data-oid="-tcxljt"
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        data-oid="j9ptr16"
      >
        <div
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
          data-oid="xnuxpij"
        >
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2" data-oid="8nc-db3">
            <h3 className="text-2xl font-bold mb-4" data-oid="s9j.1xs">
              <span className="text-muted-foreground" data-oid="p8ld9bj">
                PDF
              </span>
              <span className="text-primary" data-oid="d7w4c-y">
                4EVER
              </span>
            </h3>
            <p
              className="text-muted-foreground mb-6 max-w-md"
              data-oid="-:jgc:u"
            >
              The most powerful online PDF editor. Edit, convert, and manage
              your PDFs with ease.
            </p>
            {/* Social Media Links */}
            <div className="flex space-x-4" data-oid="-9fn30u">
              {socialLinks.map((social) => (
                <Button
                  key={social.platform}
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSocial(social.platform)}
                  className="w-10 h-10 bg-muted dark:bg-muted rounded-lg hover:bg-primary transition-colors duration-200 text-muted-foreground hover:text-white"
                  data-oid="y0c2p-g"
                >
                  <social.icon className="h-5 w-5" data-oid="5wr087t" />
                  <span className="sr-only" data-oid="6k.30.4">
                    {social.label}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div data-oid=".viv-qo">
            <h4
              className="text-lg font-semibold text-foreground mb-4"
              data-oid="cwksknd"
            >
              Product
            </h4>
            <ul className="space-y-3" data-oid="dvp6rqh">
              <li data-oid="0v8cr6f">
                <button
                  onClick={() => scrollToSection("#features")}
                  className="hover:text-primary transition-colors duration-200 text-left text-muted-foreground"
                  data-oid="6c5l9.w"
                >
                  Features
                </button>
              </li>
              <li data-oid="iy.uv9j">
                <button
                  onClick={() => scrollToSection("#pricing")}
                  className="hover:text-primary transition-colors duration-200 text-left text-muted-foreground"
                  data-oid="um-o0bt"
                >
                  Pricing
                </button>
              </li>
              <li data-oid="6qr40_a">
                <a
                  href="#"
                  className="hover:text-primary transition-colors duration-200 text-muted-foreground"
                  data-oid="e2563j0"
                >
                  API
                </a>
              </li>
              <li data-oid="9qn-t-3">
                <a
                  href="#"
                  className="hover:text-primary transition-colors duration-200 text-muted-foreground"
                  data-oid="ow:e-b."
                >
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div data-oid="zyj.2d8">
            <h4
              className="text-lg font-semibold text-foreground mb-4"
              data-oid="q4u.qvm"
            >
              Support
            </h4>
            <ul className="space-y-3" data-oid="f2ce85y">
              <li data-oid="fmavnqh">
                <button
                  onClick={handleContact}
                  className="hover:text-primary transition-colors duration-200 text-left text-muted-foreground"
                  data-oid="a1omcim"
                >
                  Contact
                </button>
              </li>
              <li data-oid="utqwb1h">
                <button
                  onClick={handlePrivacy}
                  className="hover:text-primary transition-colors duration-200 text-left text-muted-foreground"
                  data-oid="cn65j.u"
                >
                  Privacy Policy
                </button>
              </li>
              <li data-oid="_6x8v34">
                <button
                  onClick={handleTerms}
                  className="hover:text-primary transition-colors duration-200 text-left text-muted-foreground"
                  data-oid="p41ay_g"
                >
                  Terms of Service
                </button>
              </li>
              <li data-oid="3:6zg1-">
                <a
                  href="#"
                  className="hover:text-primary transition-colors duration-200 text-muted-foreground"
                  data-oid="8ffkrif"
                >
                  Help Center
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center"
          data-oid="xync1xe"
        >
          <p className="text-muted-foreground text-sm" data-oid="57ww32k">
            © 2024{" "}
            <span className="text-muted-foreground" data-oid="p4yje18">
              PDF
            </span>
            <span className="text-primary" data-oid=".egqswc">
              4EVER
            </span>
            . All rights reserved.
          </p>
          <p
            className="text-muted-foreground text-sm mt-2 sm:mt-0 max-w-md text-right"
            data-oid="thc_k8-"
          >
            Thank you for choosing{" "}
            <span className="text-muted-foreground" data-oid="l08cmfo">
              PDF
            </span>
            <span className="text-primary" data-oid="fm.dq_7">
              4EVER
            </span>
            , we appreciate you utilizing our service. If you have any
            suggestions, or ideas on how we could make the experience better for
            you please email Admin@
            <span className="text-muted-foreground" data-oid="qh2x-b_">
              PDF
            </span>
            <span className="text-primary" data-oid="ad.4q1p">
              4EVER
            </span>
            .org with your comments and suggestions. Always remember to stay
            positive!
          </p>
        </div>
      </div>
    </footer>
  );
}
