import { Word } from "tesseract.js";

declare module "tesseract.js" {
  interface Page {
    words: Word[];
  }
}
