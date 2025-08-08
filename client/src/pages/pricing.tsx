import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = () => {
    setIsLoading(true);
    // This would typically redirect to a Stripe Checkout session
    console.log("Redirecting to checkout...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="absolute top-0 left-0 p-4">
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </header>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            PDF4EVER <span className="text-primary">Lifetime Access</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pay once, own forever. Get lifetime access to the most advanced PDF
            editor with all future updates included.
          </p>
        </div>
        <div className="max-w-lg mx-auto">
          <Card className="border-2 border-primary shadow-xl">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Lifetime Access</CardTitle>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-4xl font-bold">$50</span>
                <div className="text-left">
                  <div className="text-sm text-muted-foreground line-through">
                    $197
                  </div>
                  <Badge variant="destructive">75% OFF</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {[
                  "Complete PDF Editor Suite",
                  "Text Editing & Formatting",
                  "Digital Signatures",
                  "Form Filling & OCR",
                  "Document Management",
                  "Unlimited PDF Processing",
                  "All Future Updates",
                  "Priority Support",
                  "Commercial License",
                  "No Monthly Fees Ever",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />

                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={handlePurchase}
                disabled={isLoading}
                className="w-full h-12 text-lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                {isLoading ? "Processing..." : "Get Lifetime Access"}
              </Button>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Secure payment powered by Stripe.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
