import { Shield, CheckCircle, XCircle } from "lucide-react";

export default function OwnershipSection() {
  return (
    <section className="py-20 bg-muted/30 dark:bg-card/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Why <span className="text-muted-foreground">PDF</span><span className="text-primary">4EVER</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Because when you buy something, it should be yours forever. No hidden fees, 
            no surprise charges, no forgotten subscriptions draining your account.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  True Ownership
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  In today's world, you're not really buying software—you're renting it from corporations 
                  that want your money every month. We believe that once you purchase something, 
                  it should belong to you permanently.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Industry-Grade Quality
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  You shouldn't have to choose between quality and fair pricing. 
                  <span className="text-muted-foreground">PDF</span><span className="text-primary">4EVER</span> delivers professional-grade tools that rival or exceed 
                  industry standards—without the ongoing subscription trap.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No More Subscription Surprises
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Never again worry about forgotten trial memberships overdrafting your account 
                  or taking your last $10 when you need it for gas. One purchase, lifetime access. 
                  Trust me, i've been there.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card dark:bg-background border border-border rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              The <span className="text-muted-foreground">PDF</span><span className="text-primary">4EVER</span> Promise
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Pay once, use forever</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">No monthly or yearly fees</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">No surprise charges</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Full access to all features</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Lifetime updates included</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Because your money should stay in your pocket, not fund endless subscription cycles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}