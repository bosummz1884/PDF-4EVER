import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Edit3, Zap } from "lucide-react";

export default function Landing() {
  return (
    <>
      {/* Why PDF4EVER Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose PDF4EVER?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />

              <h3 className="text-xl font-semibold mb-2">Complete Privacy</h3>
              <p className="text-muted-foreground">
                All processing happens locally. We never store your files on our
                servers.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Lock className="h-12 w-12 text-purple-600 mx-auto mb-4" />

              <h3 className="text-xl font-semibold mb-2">Data Respect</h3>
              <p className="text-muted-foreground">
                Your personal information is never shared. We protect your
                privacy above all.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Edit3 className="h-12 w-12 text-orange-500 mx-auto mb-4" />

              <h3 className="text-xl font-semibold mb-2">Professional Tools</h3>
              <p className="text-muted-foreground">
                Advanced editing, annotations, signatures, OCR, and form filling
                capabilities.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />

              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                No uploads, no waiting. Start editing immediately in your
                browser.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/90 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-primary-foreground">
            Ready to Own Your PDF Editor?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/80">
            Pay once, own forever. Get lifetime access with all future updates
            included.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="/pricing">View Lifetime Deal</a>
          </Button>
        </div>
      </section>
    </>
  );
}
