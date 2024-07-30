"use client";

import React from "react";
import { AppProvider } from "@/contexts/appContext";
import App from "./app";

export default function Home() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
