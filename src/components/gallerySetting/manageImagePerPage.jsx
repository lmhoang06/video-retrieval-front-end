"use client";

import React, { useState, useCallback } from "react";
import { Input } from "@material-tailwind/react";
import { useGallery } from "@/contexts/galleryContext";

export default function ImagesPerPageManager({ className }) {
  const [imagesPerPageError, setImagesPerPageError] = useState(false);
  const { imagesPerPage, setImagesPerPage } = useGallery();

  const validateInput = useCallback((event) => {
    const min = parseInt(event.target.min);
    const max = parseInt(event.target.max);
    const value = event.target.value;

    return value != "" && min <= parseInt(value) && parseInt(value) <= max;
  }, []);

  const handleInputChange = (event) => {
    if (!validateInput(event)) {
      if (event.type == "blur") {
        event.target.value = imagesPerPage;
        setImagesPerPageError(false);
      } else {
        setImagesPerPageError(true);
      }
    } else {
      setImagesPerPageError(false);
      if (event.type == "blur") setImagesPerPage(parseInt(event.target.value));
    }
  };

  return (
    <div className={className}>
      <Input
        label="Images per page (min 10, max 150)"
        placeholder="Images per page"
        color="blue"
        type="number"
        min={10}
        max={150}
        defaultValue={imagesPerPage}
        onChange={handleInputChange}
        onBlur={handleInputChange}
        error={imagesPerPageError}
      />
    </div>
  );
}
