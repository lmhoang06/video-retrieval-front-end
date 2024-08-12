"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { Typography, Button, IconButton } from "@material-tailwind/react";
import { useGallery } from "@/contexts/galleryContext";
import ImageDetail from "./imageDetail";
import ImageFrame from "./imageFrame";
import { IconArrowLeft, IconArrowRight } from "@/libs/icon";
import { useApp } from "@/contexts/appContext";

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
    if (active < totalPages) setActive(active + 1);
  }, [active, totalPages, setActive]);

  const prev = useCallback(() => {
    if (active > 1) setActive(active - 1);
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

const GalleryContent = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { imagesPerRow, imagesPerPage } = useGallery();
  const { images } = useApp();
  const [totalPages, setTotalPages] = useState(
    Math.ceil(images.length / imagesPerPage)
  );

  useEffect(() => {
    setTotalPages(Math.ceil(images.length / imagesPerPage));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [images.length, imagesPerPage]);

  const handleOpenDetail = useCallback(
    (imageData) => setSelectedImage(imageData),
    []
  );
  const handleCloseDetail = useCallback(() => setSelectedImage(null), []);

  if (images.length === 0) {
    setCurrentPage(1);
    return (
      <Typography
        variant="h2"
        color="red"
        className="flex h-full justify-center items-center bg-teal-300"
      >
        No image is found!
      </Typography>
    );
  }

  const startIndex = (currentPage - 1) * imagesPerPage;
  const currentImages = images.slice(startIndex, startIndex + imagesPerPage);

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
