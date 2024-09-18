"use client";

import React, { memo } from "react";
import { useGallery } from "@/contexts/galleryContext";
import Image from "next/image";

function ImageFrame({ imageData, onClick }) {
  const { videoName, frameIdx, similarityScore, src } = imageData;
  const { imagesPerRow } = useGallery();

  return (
    <div
      className="relative m-px box-border border-blue-600 hover:border-green-800"
      style={{
        borderWidth: imagesPerRow > 7 ? "2px" : "3px"
      }}
      onClick={onClick}
    >
      <Image 
        src={src}
        alt={`${videoName}_${frameIdx}`}
        width="0"
        height="0"
        className="w-full object-cover object-center"
      />
    </div>
  );
}

export default memo(ImageFrame);
