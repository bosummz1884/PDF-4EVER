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
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      data-oid="z-flmw3"
    >
      {/* Header */}
      <header
        className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50"
        data-oid="zsonbqy"
      >
        <div className="container mx-auto px-4 py-4" data-oid="-qbaft6">
          <div className="flex items-center justify-between" data-oid="s14wvc0">
            <div className="flex items-center gap-2" data-oid="e_juvc1">
              <div
                className="bg-blue-600 text-white p-2 rounded-lg"
                data-oid="2h7:6z4"
              >
                <FileText className="h-6 w-6" data-oid="r-imbd1" />
              </div>
              <span className="text-xl font-bold" data-oid="sp4n.25">
                PDF4EVER
              </span>
              <Badge variant="secondary" data-oid="c30fvx2">
                Free
              </Badge>
            </div>

            <nav
              className="hidden md:flex items-center gap-6"
              data-oid="lwz_rju"
            >
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                data-oid="35704.q"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                data-oid="v-jlqjj"
              >
                Pricing
              </a>
              <a
                href="#about"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                data-oid="mged-xe"
              >
                About
              </a>
              <AuthDialogs
                trigger={
                  <Button variant="outline" data-oid=":f1nqyk">
                    Sign In
                  </Button>
                }
                data-oid="iu47dp9"
              />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4" data-oid="jpk3c_r">
        <div className="container mx-auto text-center" data-oid="szatxwa">
          <div className="max-w-4xl mx-auto" data-oid="-k303pn">
            <h1
              className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
              data-oid="yfc.6wc"
            >
              The Ultimate
              <span
                className="text-blue-600 dark:text-blue-400"
                data-oid="f_q1ulb"
              >
                {" "}
                PDF Editor
              </span>
              <br data-oid="ua6r46s" />
              You'll Ever Need
            </h1>

            <p
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
              data-oid="ko0198:"
            >
              Edit, merge, split, annotate, and transform your PDFs with our
              powerful, privacy-first editor. No downloads required, works
              entirely in your browser.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              data-oid="luox9x0"
            >
              <Button
                size="lg"
                className="text-lg px-8 py-3"
                onClick={onGetStarted}
                data-oid="4tdlp4r"
              >
                <Upload className="h-5 w-5 mr-2" data-oid="bob2.8s" />
                Start Editing Now
              </Button>

              <AuthDialogs
                defaultTab="signup"
                trigger={
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-3"
                    data-oid="wynxx8o"
                  >
                    Create Free Account
                    <ArrowRight className="h-5 w-5 ml-2" data-oid="h5dtf3z" />
                  </Button>
                }
                data-oid="qiicdo."
              />
            </div>

            <div
              className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400"
              data-oid="-llais_"
            >
              <div className="flex items-center gap-2" data-oid="u-9nbo1">
                <Shield className="h-4 w-4" data-oid="wwjlnsp" />
                Privacy First
              </div>
              <div className="flex items-center gap-2" data-oid="j:bagq6">
                <Zap className="h-4 w-4" data-oid="6umfv86" />
                Lightning Fast
              </div>
              <div className="flex items-center gap-2" data-oid="4cvhxi7">
                <Globe className="h-4 w-4" data-oid="f-cszxg" />
                Works Offline
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 bg-white dark:bg-gray-800"
        data-oid=":e-pwdo"
      >
        <div className="container mx-auto" data-oid="vzjs37s">
          <div className="text-center mb-16" data-oid="mnt8inr">
            <h2
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
              data-oid="-ldye.l"
            >
              Everything You Need for PDF Editing
            </h2>
            <p
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
              data-oid="b05ot2h"
            >
              Comprehensive tools for all your PDF needs, from basic editing to
              advanced annotations
            </p>
          </div>

          <div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            data-oid="351cb2y"
          >
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
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow"
                data-oid="3ytff9p"
              >
                <CardHeader data-oid="mg-d1j_">
                  <feature.icon
                    className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4"
                    data-oid="o:7ffw6"
                  />

                  <CardTitle data-oid="w:qj9rk">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent data-oid="sr.pj1l">
                  <p
                    className="text-gray-600 dark:text-gray-300"
                    data-oid="tn7nuht"
                  >
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4" data-oid="lu58pfc">
        <div className="container mx-auto" data-oid="6caxatj">
          <div
            className="grid md:grid-cols-4 gap-8 text-center"
            data-oid="_6njluu"
          >
            {[
              { number: "1M+", label: "Documents Processed" },
              { number: "50K+", label: "Happy Users" },
              { number: "99.9%", label: "Uptime" },
              { number: "0", label: "Data Stored" },
            ].map((stat, index) => (
              <div key={index} data-oid="19s7che">
                <div
                  className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2"
                  data-oid="yks2tsb"
                >
                  {stat.number}
                </div>
                <div
                  className="text-gray-600 dark:text-gray-300"
                  data-oid="ix7awf4"
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-20 px-4 bg-gray-50 dark:bg-gray-900"
        data-oid="yb:jr80"
      >
        <div className="container mx-auto" data-oid="owm-0q3">
          <div className="text-center mb-16" data-oid="df3v6vw">
            <h2
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
              data-oid="toeowjd"
            >
              Simple, Transparent Pricing
            </h2>
            <p
              className="text-xl text-gray-600 dark:text-gray-300"
              data-oid="u4j9mn."
            >
              Choose the plan that works best for you
            </p>
          </div>

          <div
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            data-oid="yzdiz55"
          >
            {/* Free Plan */}
            <Card className="relative" data-oid="uzajugh">
              <CardHeader data-oid="hztu6rd">
                <CardTitle className="text-2xl" data-oid="1-bj2hr">
                  Free Forever
                </CardTitle>
                <div className="text-4xl font-bold" data-oid="mj5ef7b">
                  $0
                </div>
                <p
                  className="text-gray-600 dark:text-gray-300"
                  data-oid="eqhl3:h"
                >
                  Perfect for personal use
                </p>
              </CardHeader>
              <CardContent className="space-y-4" data-oid="2m3cx70">
                {[
                  "Upload files up to 10MB",
                  "Basic editing tools",
                  "Form filling",
                  "Text extraction",
                  "Browser-based processing",
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                    data-oid="e:4r4nc"
                  >
                    <Check
                      className="h-5 w-5 text-green-500"
                      data-oid="-y3sfe:"
                    />

                    <span data-oid="mu:odc0">{feature}</span>
                  </div>
                ))}
                <Button
                  className="w-full mt-6"
                  onClick={onGetStarted}
                  data-oid="0:3q84a"
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card
              className="relative border-blue-500 shadow-lg"
              data-oid="hlxirko"
            >
              <div
                className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                data-oid="t0qp5u_"
              >
                <Badge className="bg-blue-600" data-oid="8vs-cy4">
                  Most Popular
                </Badge>
              </div>
              <CardHeader data-oid="9ct_7q7">
                <CardTitle className="text-2xl" data-oid="a8bnzef">
                  Pro
                </CardTitle>
                <div className="text-4xl font-bold" data-oid="wg2.5pm">
                  $9
                  <span className="text-lg" data-oid="u73ysii">
                    /month
                  </span>
                </div>
                <p
                  className="text-gray-600 dark:text-gray-300"
                  data-oid="n15imkn"
                >
                  For power users and professionals
                </p>
              </CardHeader>
              <CardContent className="space-y-4" data-oid="i4_4s5w">
                {[
                  "Everything in Free",
                  "Upload files up to 100MB",
                  "Advanced annotation tools",
                  "Batch processing",
                  "OCR in 10+ languages",
                  "Priority support",
                  "Cloud sync (optional)",
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                    data-oid="d1ljp4."
                  >
                    <Check
                      className="h-5 w-5 text-green-500"
                      data-oid="6tpnj1x"
                    />

                    <span data-oid="qq6itaq">{feature}</span>
                  </div>
                ))}
                <AuthDialogs
                  defaultTab="signup"
                  trigger={
                    <Button className="w-full mt-6" data-oid="v-12vad">
                      Start Pro Trial
                    </Button>
                  }
                  data-oid="-3cz68v"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section
        className="py-16 px-4 bg-blue-50 dark:bg-blue-900/20"
        data-oid="h7dl-ai"
      >
        <div className="container mx-auto text-center" data-oid="du9y:lb">
          <div className="max-w-3xl mx-auto" data-oid="i6mv22x">
            <Shield
              className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-6"
              data-oid="mh_8jx-"
            />

            <h2
              className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
              data-oid="fgr:wwk"
            >
              Your Privacy is Our Priority
            </h2>
            <p
              className="text-lg text-gray-600 dark:text-gray-300 mb-6"
              data-oid="flqsex5"
            >
              Unlike other PDF editors, we process everything in your browser.
              Your documents never leave your device, ensuring complete privacy
              and security.
            </p>
            <div
              className="flex items-center justify-center gap-8 text-sm"
              data-oid="t6srz72"
            >
              <div className="flex items-center gap-2" data-oid="45nt4wg">
                <Lock className="h-4 w-4 text-green-500" data-oid="4oft.mh" />
                Client-side processing
              </div>
              <div className="flex items-center gap-2" data-oid="4v6zvft">
                <Eye className="h-4 w-4 text-green-500" data-oid="dd-63t2" />
                No data collection
              </div>
              <div className="flex items-center gap-2" data-oid="1pa7zsa">
                <Clock className="h-4 w-4 text-green-500" data-oid="8aih1_6" />
                Works offline
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        data-oid="dy5rli3"
      >
        <div className="container mx-auto text-center" data-oid="yg.wyw8">
          <h2 className="text-4xl font-bold mb-4" data-oid="e6tlj0.">
            Ready to Transform Your PDF Workflow?
          </h2>
          <p className="text-xl mb-8 opacity-90" data-oid=".brhsgi">
            Join thousands of users who trust PDF4EVER for their document needs
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            data-oid="z-y3oem"
          >
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-3"
              onClick={onGetStarted}
              data-oid="_1bsdqj"
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
                  data-oid=":4o4071"
                >
                  Create Free Account
                </Button>
              }
              data-oid="bg:78mn"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="about"
        className="bg-gray-900 text-white py-12 px-4"
        data-oid="tlumta5"
      >
        <div className="container mx-auto" data-oid="_r9orgx">
          <div className="grid md:grid-cols-4 gap-8" data-oid="njftl0t">
            <div data-oid="mu61wow">
              <div className="flex items-center gap-2 mb-4" data-oid="ej9.a.e">
                <div
                  className="bg-blue-600 text-white p-2 rounded-lg"
                  data-oid="9jz2zwi"
                >
                  <FileText className="h-6 w-6" data-oid="3t6e:65" />
                </div>
                <span className="text-xl font-bold" data-oid="rqlhuzx">
                  PDF4EVER
                </span>
              </div>
              <p className="text-gray-400 mb-4" data-oid="slzuvof">
                The most powerful PDF editor that respects your privacy.
              </p>
              <div className="flex gap-4" data-oid="qt7fphw">
                <Button size="sm" variant="ghost" data-oid="a63ktsl">
                  <Github className="h-4 w-4" data-oid="xsqf1-q" />
                </Button>
                <Button size="sm" variant="ghost" data-oid="v-zsvib">
                  <Twitter className="h-4 w-4" data-oid="8cfsge8" />
                </Button>
                <Button size="sm" variant="ghost" data-oid="6lkpbau">
                  <Mail className="h-4 w-4" data-oid="bsm6-o1" />
                </Button>
              </div>
            </div>

            <div data-oid="4r61lcd">
              <h4 className="font-semibold mb-4" data-oid="ww5rwom">
                Features
              </h4>
              <div className="space-y-2 text-gray-400" data-oid="priagks">
                <div data-oid="01g12c.">PDF Editor</div>
                <div data-oid="gfk6wxv">Form Filling</div>
                <div data-oid="136hvok">Text Recognition</div>
                <div data-oid="9wows9e">Merge & Split</div>
                <div data-oid="8we9wvp">Annotations</div>
              </div>
            </div>

            <div data-oid="rob_f5j">
              <h4 className="font-semibold mb-4" data-oid="t8w__ts">
                Resources
              </h4>
              <div className="space-y-2 text-gray-400" data-oid="xn57yw3">
                <div data-oid="gfzcl9y">Documentation</div>
                <div data-oid="_z2bx2r">API Reference</div>
                <div data-oid="ny9rmyk">Tutorials</div>
                <div data-oid="m8la_w1">Blog</div>
                <div data-oid="dp5h80i">Support</div>
              </div>
            </div>

            <div data-oid="a2ki9n7">
              <h4 className="font-semibold mb-4" data-oid="a_rar1x">
                Company
              </h4>
              <div className="space-y-2 text-gray-400" data-oid="7q-upz.">
                <div data-oid="zonwdi2">About Us</div>
                <div data-oid="68kejii">Privacy Policy</div>
                <div data-oid="8uikwi0">Terms of Service</div>
                <div data-oid="8g.hc36">Contact</div>
                <div data-oid="c_dhugm">Careers</div>
              </div>
            </div>
          </div>

          <div
            className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400"
            data-oid="lf4v__y"
          >
            <p data-oid="48b8s-l">
              © 2024 PDF4EVER. Made with{" "}
              <Heart
                className="h-4 w-4 inline text-red-500"
                data-oid="oyezxz5"
              />{" "}
              for document lovers worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
