import { Button } from "@/components/ui/button";
import { Rocket, Play } from "lucide-react";

export default function HeroSection() {
  const handleGetStarted = () => {
    console.log("Get Started clicked");
  };

  const handleTutorial = () => {
    console.log("Tutorial clicked");
  };

  return (
    <section id="home" className="relative bg-gradient-to-br from-background to-muted dark:from-background dark:to-card overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-8 text-center">
            Premium Online <span className="text-primary bg-transparent">PDF</span> Editing Capabilities
          </h1>
          <div className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            <ul className="space-y-2 mb-8">
              <li>• Inline Text Edit</li>
              <li>• Font Match</li>
              <li>• OCR Text Extractor</li>
              <li>• Invoice Generator</li>
              <li>• E-Sign</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-primary hover:bg-secondary text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Start Free Today
            </Button>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-20 h-20 bg-primary rounded-full animate-float"></div>
        <div className="absolute top-40 right-32 w-16 h-16 bg-accent rounded-full animate-float-delay"></div>
        <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-primary rounded-full animate-float-delay-2"></div>
      </div>
    </section>
  );
}
