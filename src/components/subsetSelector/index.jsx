"use client";

import React from "react";
import { Select, Option } from "@material-tailwind/react";
import { getAvailableSubsets } from "@/libs/subsetMapping";

export default function SubsetSelector({ selectedSubset, onSubsetChange, className = "" }) {
  const availableSubsets = getAvailableSubsets();

  const handleChange = (value) => {
    onSubsetChange(value);
  };

  return (
    <div className={`w-full ${className}`}>
      <Select
        label="Select Subset"
        value={selectedSubset || "All videos"}
        onChange={handleChange}
        className="!bg-white"
        animate={{
          mount: { y: 0 },
          unmount: { y: 25 },
        }}
      >
        {availableSubsets.map((subset) => (
          <Option key={subset} value={subset}>
            {subset}
          </Option>
        ))}
      </Select>
    </div>
  );
}
