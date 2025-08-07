"use client";

import { Slider } from "@material-tailwind/react";
import React from "react";
import { useGallery } from "@/contexts/galleryContext";
import ImagesPerPageManager from "./manageImagePerPage";

export default function GallerySetting({ className }) {
  const { imagesPerRow, setImagesPerRow } = useGallery();

  const handleOnChangeImgsPerRow = (event) =>
    setImagesPerRow(event.target.value / 20 + 5);

  return (
    <div className={className}>
      {/* Grid Layout Control */}
      <div className="flex flex-row w-full h-full gap-2 mb-1">
        {/* Control number of images per page */}
        <ImagesPerPageManager className="w-fit" />

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
