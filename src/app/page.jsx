"use client";

import React from "react";
import { AppProvider } from "@/contexts/appContext";
import App from "./app";
import { ToastContainer } from "react-toastify";

export default function Home() {
  return (
    <AppProvider>
      <App />
      <ToastContainer
        position="bottom-right"
        autoClose={4500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="light"
      />
    </AppProvider>
  );
}
