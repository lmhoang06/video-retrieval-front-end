"use client";

import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import { Typography, Button, IconButton } from "@material-tailwind/react";
import { useGallery } from "@/contexts/galleryContext";
import ImageDetail from "./imageDetail";
import ImageFrame from "./imageFrame";
import { IconArrowLeft, IconArrowRight } from "@/libs/icon";
import { useApp } from "@/contexts/appContext";
import NoImageFound from "./noImageFound";

const Pagination = memo(({ totalPages, active, setActive }) => {
  const getItemProps = useCallback(
    (index) => ({
      variant: active === index ? "filled" : "text",
      color: active === index ? "blue" : "gray",
      onClick: () => setActive(index),
    }),
    [active, setActive]
  );

  const next = useCallback(() => {
    if (active < totalPages) setActive((prev) => prev + 1);
  }, [active, totalPages, setActive]);

  const prev = useCallback(() => {
    if (active > 1) setActive((prev) => prev - 1);
  }, [active, setActive]);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="text"
        color="blue"
        className="flex items-center gap-2"
        onClick={prev}
        disabled={active === 1}
      >
        <IconArrowLeft strokeWidth={2} className="h-4 w-4" /> Previous
      </Button>
      <div className="flex items-center gap-2">
        {[...Array(totalPages)].map((_, index) => (
          <IconButton key={index} {...getItemProps(index + 1)}>
            {index + 1}
          </IconButton>
        ))}
      </div>
      <Button
        variant="text"
        color="blue"
        className="flex items-center gap-2"
        onClick={next}
        disabled={active === totalPages}
      >
        Next
        <IconArrowRight strokeWidth={2} className="h-4 w-4" />
      </Button>
    </div>
  );
});

Pagination.displayName = "Pagination";

const GalleryContent = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImages, setCurrentImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { imagesPerRow, imagesPerPage } = useGallery();
  const { images, loadImages } = useApp();
  const totalPages = useMemo(
    () => Math.ceil(images.length / imagesPerPage),
    [images.length, imagesPerPage]
  );

  useEffect(() => {
    if (images.length === 0) {
      if (currentPage !== 1) setCurrentPage(1);
    } else if (currentPage > totalPages && totalPages !== 0) {
      setCurrentPage(totalPages);
    }
  }, [images.length, currentPage, totalPages]);

  useEffect(() => {
    const loadCurrentImages = async () => {
      if (images.length !== 0) {
        const startIndex = (currentPage - 1) * imagesPerPage;
        const imagesData = await loadImages(
          startIndex,
          startIndex + imagesPerPage
        );
        setCurrentImages(imagesData.filter((item) => !item?.loadError));
      } else {
        setCurrentImages([]);
      }
    };
    loadCurrentImages();
  }, [currentPage, imagesPerPage, images, loadImages]);

  const handleOpenDetail = useCallback(
    (imageData) => setSelectedImage(imageData),
    []
  );
  const handleCloseDetail = useCallback(() => setSelectedImage(null), []);

  if (images.length === 0) {
    return <NoImageFound />;
  }

  return (
    <div className="overflow-y-auto">
      <div className="flex justify-center mb-1">
        <Pagination
          totalPages={totalPages}
          active={currentPage}
          setActive={setCurrentPage}
        />
      </div>
      <div
        className="grid gap-px p-0.5 max-h-full"
        style={{
          gridTemplateColumns: `repeat(${imagesPerRow}, minmax(0, 1fr))`,
        }}
      >
        {currentImages.map((imageData, index) => (
          <ImageFrame
            imageData={imageData}
            key={imageData.id || index}
            onClick={() => handleOpenDetail(imageData)}
          />
        ))}
      </div>
      {selectedImage && (
        <ImageDetail
          imageData={selectedImage}
          open={Boolean(selectedImage)}
          handleOpen={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default memo(GalleryContent);
