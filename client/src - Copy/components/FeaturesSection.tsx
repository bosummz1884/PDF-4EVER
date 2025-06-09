import { Button } from "@/components/ui/button";
import { Camera, Type, FileSignature, Layers, ScanText, Receipt } from "lucide-react";

export default function FeaturesSection() {
  const handleCameraToPDF = () => {
    alert("Camera to PDF feature coming soon!");
  };

  const handleFontMatching = () => {
    alert("Font matching and text editing feature coming soon!");
  };

  const handleSign = () => {
    alert("Digital signature feature in development!");
  };

  const handleMerge = () => {
    alert("PDF merge functionality coming soon!");
  };

  const handleOCR = () => {
    alert("OCR text extraction feature coming soon!");
  };

  const handleInvoiceGenerator = () => {
    alert("PDF invoice generator feature coming soon!");
  };

  const features = [
    {
      icon: Camera,
      title: "Camera to PDF",
      description: "Scan documents with your camera and instantly convert them to high-quality PDFs.",
      buttonText: "Try Camera Scan",
      buttonColor: "bg-primary hover:bg-secondary",
      iconBg: "bg-primary/10 dark:bg-primary/20",
      iconColor: "text-primary",
      handler: handleCameraToPDF,
    },
    {
      icon: Type,
      title: "Font Matching & Text Editing",
      description: "Seamlessly edit text within PDFs while automatically matching existing fonts and formatting.",
      buttonText: "Edit Text",
      buttonColor: "bg-primary hover:bg-secondary",
      iconBg: "bg-primary/10 dark:bg-primary/20",
      iconColor: "text-primary",
      handler: handleFontMatching,
    },
    {
      icon: FileSignature,
      title: "Sign Documents",
      description: "Create digital signatures and sign documents securely with legally binding e-signatures.",
      buttonText: "Add Signature",
      buttonColor: "bg-primary hover:bg-secondary",
      iconBg: "bg-primary/10 dark:bg-primary/20",
      iconColor: "text-primary",
      handler: handleSign,
    },
    {
      icon: Layers,
      title: "Merge & Reorder Pages",
      description: "Combine multiple PDFs and reorder pages with intuitive drag-and-drop functionality.",
      buttonText: "Merge PDFs",
      buttonColor: "bg-primary hover:bg-secondary",
      iconBg: "bg-primary/10 dark:bg-primary/20",
      iconColor: "text-primary",
      handler: handleMerge,
    },
    {
      icon: ScanText,
      title: "OCR Text Extraction",
      description: "Extract text from scanned documents and images with advanced optical character recognition technology.",
      buttonText: "Extract Text",
      buttonColor: "bg-primary hover:bg-secondary",
      iconBg: "bg-primary/10 dark:bg-primary/20",
      iconColor: "text-primary",
      handler: handleOCR,
    },
    {
      icon: Receipt,
      title: "PDF Invoice Generator",
      description: "Create professional invoices and business documents with customizable templates and branding options.",
      buttonText: "Generate Invoice",
      buttonColor: "bg-primary hover:bg-secondary",
      iconBg: "bg-primary/10 dark:bg-primary/20",
      iconColor: "text-primary",
      handler: handleInvoiceGenerator,
    },
  ];

  return (
    <section id="features" className="py-20 bg-background dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need for PDF Editing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional PDF tools at your fingertips. No software installation required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card dark:bg-card rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300 border border-border hover:border-primary/20 group"
            >
              <div className={`w-16 h-16 ${feature.iconBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {feature.description}
              </p>
              <Button
                onClick={feature.handler}
                className={`w-full ${feature.buttonColor} text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200`}
              >
                {feature.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
