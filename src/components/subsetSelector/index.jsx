"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Select, Option } from "@material-tailwind/react";
import { 
  getAvailableSubsets, 
  hasSubSelection, 
  getAvailableSubSelections 
} from "@/libs/subsetMapping";

// Separate component for sub-selection to prevent re-render issues
const SubSelectionSelect = memo(function SubSelectionSelect({ 
  selectedSubset, 
  selectedSubSelection, 
  onSubSelectionChange 
}) {
  const [localValue, setLocalValue] = useState(selectedSubSelection || "");
  
  const subSelections = useMemo(() => {
    return getAvailableSubSelections(selectedSubset);
  }, [selectedSubset]);

  // Sync local state with prop when it changes
  useEffect(() => {
    setLocalValue(selectedSubSelection || "");
  }, [selectedSubSelection]);

  const handleChange = useCallback((value) => {
    setLocalValue(value);
    if (onSubSelectionChange) {
      onSubSelectionChange(value);
    }
  }, [onSubSelectionChange]);
  
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Sub-selection
      </label>
      <select
        key={`subselection-${selectedSubset}`}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="">
          All {selectedSubset}
        </option>
        {subSelections.map((subSelection) => (
          <option key={subSelection} value={subSelection}>
            {subSelection}
          </option>
        ))}
      </select>
    </div>
  );
});

const SubsetSelector = memo(function SubsetSelector({ 
  selectedSubset, 
  selectedSubSelection, 
  onSubsetChange, 
  onSubSelectionChange, 
  className = "" 
}) {
  const availableSubsets = getAvailableSubsets();
  const [showSubSelection, setShowSubSelection] = useState(false);

  useEffect(() => {
    const hasSubSelections = hasSubSelection(selectedSubset);
    setShowSubSelection(hasSubSelections);
  }, [selectedSubset]);

  const handleSubsetChange = useCallback((value) => {
    onSubsetChange(value);
  }, [onSubsetChange]);

  const handleSubSelectionChange = useCallback((value) => {
    if (onSubSelectionChange) {
      onSubSelectionChange(value);
    }
  }, [onSubSelectionChange]);

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {/* Main Subset Selection */}
      <Select
        label="Select Subset"
        value={selectedSubset || "All videos"}
        onChange={handleSubsetChange}
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

      {/* Sub-selection (separate component to prevent re-render issues) */}
      {showSubSelection ? (
        <SubSelectionSelect
          key={`subselection-${selectedSubset}`}
          selectedSubset={selectedSubset}
          selectedSubSelection={selectedSubSelection}
          onSubSelectionChange={handleSubSelectionChange}
        />
      ) : (
        <div className="h-12"></div>
      )}
    </div>
  );
});

export default SubsetSelector;
