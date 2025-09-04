"use client";

import React, { useState } from "react";
import InputQuery from "../queryInput";
import SubsetSelector from "../subsetSelector";
import { Card } from "@material-tailwind/react";
import Image from "next/image";

export default function Sidebar({ className }) {
  const [selectedSubset, setSelectedSubset] = useState("All videos");

  const handleSubsetChange = (subset) => {
    setSelectedSubset(subset);
  };

  return (
    <Card className={className + " gap-2"}>
      {/* Sidebar's header */}
      <div className="flex flex-row max-w-full w-full justify-center">
        <div className="relative">
          <Image
            src="/Logo.png"
            alt="Logo"
            fill
            sizes="100%"
            style={{ position: "", objectFit: "contain" }}
            quality={75}
          />
        </div>
      </div>

      {/* Subset Selection */}
      <div className="px-2">
        <SubsetSelector
          selectedSubset={selectedSubset}
          onSubsetChange={handleSubsetChange}
          className="mb-2"
        />
      </div>

      {/* Input query */}
      <InputQuery className="h-full" selectedSubset={selectedSubset} />
    </Card>
  );
}
