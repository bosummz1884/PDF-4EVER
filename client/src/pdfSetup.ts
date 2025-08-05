import * as pdfjsLib from "pdfjs-dist";
import worker from "./pdf-worker-loader"; // 👈 use your wrapper

pdfjsLib.GlobalWorkerOptions.workerPort = worker;
