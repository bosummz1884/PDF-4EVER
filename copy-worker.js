/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

try {
  // Define the source and destination paths using Node's path resolver for reliability
  const sourceFile = require.resolve("pdfjs-dist/build/pdf.worker.js");
  const destDir = path.resolve(__dirname, "client", "public");
  const destFile = path.resolve(destDir, "pdf.worker.js");

  // Ensure the public directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy the file
  fs.copyFileSync(sourceFile, destFile);
  console.log("Successfully copied pdf.worker.js to client/public.");
} catch (error) {
  console.error("Error copying PDF worker file:", error);
  process.exit(1); // Fail the build if the copy fails
}
