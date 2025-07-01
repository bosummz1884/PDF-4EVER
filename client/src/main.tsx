// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Main styles, Tailwind, etc.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create ONE QueryClient instance
const queryClient = new QueryClient();

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found!");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
