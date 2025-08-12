"use client";

import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import { Typography, Button, IconButton } from "@material-tailwind/react";
import { useGallery } from "@/contexts/galleryContext";
import ImageDetail from "./imageDetail";
import ImageFrame from "./imageFrame";
import { IconArrowLeft, IconArrowRight } from "@/libs/icon";
import { useApp } from "@/contexts/appContext";
import NoImageFound from "./noImageFound";
import { groupByVideoName } from "@/libs/grouping";

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
  const { imagesPerRow, imagesPerPage, viewMode } = useGallery();
  const { images, loadImages } = useApp();
  const totalPages = useMemo(() => {
    if (viewMode === "grouped") return 1; // pagination hidden in grouped mode
    return Math.ceil(images.length / imagesPerPage);
  }, [images.length, imagesPerPage, viewMode]);

  useEffect(() => {
    if (images.length === 0) {
      if (currentPage !== 1) setCurrentPage(1);
    } else if (currentPage > totalPages && totalPages !== 0) {
      setCurrentPage(totalPages);
    }
  }, [images.length, currentPage, totalPages]);

  useEffect(() => {
    const loadCurrentImages = async () => {
      if (images.length === 0) {
        setCurrentImages([]);
        return;
      }
      if (viewMode === "grouped") {
        // In grouped mode, ensure all currently visible images have src populated.
        // For simplicity, load all; AppContext.loadImages will only update missing ones and is efficient.
        const imagesData = await loadImages(0, images.length);
        setCurrentImages(imagesData.filter((item) => !item?.loadError));
      } else {
        const startIndex = (currentPage - 1) * imagesPerPage;
        const imagesData = await loadImages(startIndex, startIndex + imagesPerPage);
        setCurrentImages(imagesData.filter((item) => !item?.loadError));
      }
    };
    loadCurrentImages();
  }, [currentPage, imagesPerPage, images, loadImages, viewMode]);

  const handleOpenDetail = useCallback(
    (imageData) => setSelectedImage(imageData),
    []
  );
  const handleCloseDetail = useCallback(() => setSelectedImage(null), []);

  // Derived groups for grouped mode (declare before any early returns to keep hooks order stable)
  const groups = useMemo(() => {
    if (viewMode !== "grouped") return [];
    return groupByVideoName(currentImages);
  }, [viewMode, currentImages]);

  if (images.length === 0) {
    return <NoImageFound />;
  }

  return (
    <div className="overflow-y-auto">
      {viewMode === "flat" && (
        <div className="flex justify-center mb-1">
          <Pagination totalPages={totalPages} active={currentPage} setActive={setCurrentPage} />
        </div>
      )}

      {viewMode === "flat" ? (
        <div
          className="grid gap-px p-0.5 max-h-full"
          style={{ gridTemplateColumns: `repeat(${imagesPerRow}, minmax(0, 1fr))` }}
        >
          {currentImages.map((imageData, index) => (
            <ImageFrame
              imageData={imageData}
              key={imageData.id || `${imageData.videoName}-${imageData.frameName}` || index}
              onClick={() => handleOpenDetail(imageData)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-0.5 divide-y-2 divide-blue-600 divide-double">
          {groups.map((g) => (
            <div key={g.key}>
              {/* Inline header */}
              <div className="text-sm font-semibold text-blue-700 mb-1">
                {g.label} <span className="text-blue-gray-400">({g.count})</span>
              </div>
              <div
                className="grid gap-px"
                style={{ gridTemplateColumns: `repeat(${imagesPerRow}, minmax(0, 1fr))` }}
              >
                {g.items.map((imageData, index) => (
                  <ImageFrame
                    imageData={imageData}
                    key={imageData.id || `${imageData.videoName}-${imageData.frameName}` || index}
                    onClick={() => handleOpenDetail(imageData)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <ImageDetail imageData={selectedImage} open={Boolean(selectedImage)} handleOpen={handleCloseDetail} />
      )}
    </div>
  );
};

export default memo(GalleryContent);
