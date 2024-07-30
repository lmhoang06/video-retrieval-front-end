import React, { createContext, useContext, useState } from "react";

const GalleryContext = createContext(null);

export function GalleryProvider({ children }) {
  const [imagesPerRow, setImagesPerRow] = useState(8);
  const [imagesPerPage, setImagesPerPage] = useState(80);

  const value = {
    imagesPerRow,
    setImagesPerRow,
    imagesPerPage,
    setImagesPerPage,
  };

  return (
    <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>
  );
}

export const useGallery = () => useContext(GalleryContext);
