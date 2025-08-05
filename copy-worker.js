import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

try {
  // Get the directory name in an ES module context
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // Resolve paths using modern ESM-compatible methods
  const sourceFile = await import.meta.resolve(
    "pdfjs-dist/build/pdf.worker.js"
  );
  const destDir = path.resolve(__dirname, "client", "public");
  const destFile = path.resolve(destDir, "pdf.worker.js");

  // Ensure the public directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy the file from the resolved URL path
  fs.copyFileSync(fileURLToPath(sourceFile), destFile);
  console.log(
    "Successfully copied pdf.worker.js to client/public using ESM script."
  );
} catch (error) {
  console.error("Error copying PDF worker file with ESM script:", error);
  process.exit(1); // Fail the build if the copy fails
}
