"use client";

import { Slider } from "@material-tailwind/react";
import React from "react";
import { useGallery } from "@/contexts/galleryContext";
import ImagesPerPageManager from "./manageImagePerPage";
import { Button } from "@material-tailwind/react";

export default function GallerySetting({ className }) {
  const { imagesPerRow, setImagesPerRow, viewMode, setViewMode } = useGallery();

  const handleOnChangeImgsPerRow = (event) =>
    setImagesPerRow(event.target.value / 20 + 5);

  return (
    <div className={className}>
      {/* Grid Layout Control */}
      <div className="flex flex-row w-full h-full gap-2 mb-1 items-center">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 w-fit">
          <Button
            size="sm"
            variant={viewMode === "flat" ? "filled" : "outlined"}
            color="blue"
            onClick={() => setViewMode("flat")}
          >
            Flat
          </Button>
          <Button
            size="sm"
            variant={viewMode === "grouped" ? "filled" : "outlined"}
            color="blue"
            onClick={() => setViewMode("grouped")}
          >
            Grouped
          </Button>
        </div>

        {/* Control number of images per page (hidden in grouped mode) */}
        {viewMode === "flat" && <ImagesPerPageManager className="w-fit" />}

        {/* Control number of image per row in page */}
        <Slider
          color="blue"
          value={(imagesPerRow - 5) * 20}
          min={0}
          max={100}
          step={20}
          onChange={handleOnChangeImgsPerRow}
          className="self-center"
        />
      </div>
    </div>
  );
}
