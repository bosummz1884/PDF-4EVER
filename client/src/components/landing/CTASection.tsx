import { Button } from "@/components/ui/button";

export default function CTASection() {
  const handleStartFree = () => {
    console.log("Start Free Today clicked");
  };

  const handleTutorial = () => {
    console.log("Tutorial clicked");
  };

  return (
    <section
      className="py-20 bg-gradient-to-r from-primary to-accent"
      data-oid="7m8fxif"
    >
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        data-oid="twe5woa"
      >
        <h2
          className="text-3xl sm:text-4xl font-bold text-white mb-6"
          data-oid="f2f5b27"
        >
          Ready to Transform Your PDF Workflow?
        </h2>
        <p
          className="text-xl text-orange-100 mb-8 leading-relaxed"
          data-oid="e3wi0fp"
        >
          Join thousands of users who trust{" "}
          <span className="text-orange-200" data-oid="pmcrv03">
            PDF
          </span>
          <span className="text-white" data-oid=":ozm0-a">
            4EVER
          </span>{" "}
          for their document needs.
        </p>
        <div className="flex justify-center" data-oid="256axf4">
          <Button
            variant="outline"
            onClick={handleTutorial}
            size="lg"
            className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 bg-transparent"
            data-oid="g6pn2mh"
          >
            Tutorial
          </Button>
        </div>
      </div>
    </section>
  );
}
