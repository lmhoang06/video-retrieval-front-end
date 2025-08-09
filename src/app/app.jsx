import React from "react";
import Gallery from "@/components/gallery";
import Sidebar from "@/components/sidebar";

export default function App() {
  return (
    <div className="flex flex-row">
      <Sidebar className="w-1/5 lg:w-1/5 md:w-1/4 h-screen" />
      <Gallery className="p-1 absolute bottom-0 right-0 h-screen w-4/5 lg:w-4/5 md:w-3/4" />
    </div>
  );
}
