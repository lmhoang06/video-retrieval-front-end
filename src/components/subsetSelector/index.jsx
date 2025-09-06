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
  onSubSelectionChange,
  showSubSelection 
}) {
  const [localValue, setLocalValue] = useState(selectedSubSelection || "");
  
  const subSelections = useMemo(() => {
    return getAvailableSubSelections(selectedSubset);
  }, [selectedSubset]);

  const options = useMemo(() => {
    return [
      { value: "", label: `All ${selectedSubset}` },
      { value: "None", label: "None" },
      ...subSelections.map(subSelection => ({
        value: subSelection,
        label: subSelection
      }))
    ];
  }, [selectedSubset, subSelections]);

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
    <Select
      key={`subselection-${selectedSubset}`}
      label="Select Sub-selection"
      value={localValue}
      onChange={handleChange}
      className="!bg-white"
      disabled={!showSubSelection}
      animate={{
        mount: { y: 0 },
        unmount: { y: 25 },
      }}
    >
      {options.map((option, index) => (
        <Option key={`${selectedSubset}-${index}-${option.value}`} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
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

      {/* Sub-selection (always render but disable when not needed) */}
      <SubSelectionSelect
        key={`subselection-${selectedSubset}`}
        selectedSubset={selectedSubset}
        selectedSubSelection={selectedSubSelection}
        onSubSelectionChange={handleSubSelectionChange}
        showSubSelection={showSubSelection}
      />
    </div>
  );
});

export default SubsetSelector;
