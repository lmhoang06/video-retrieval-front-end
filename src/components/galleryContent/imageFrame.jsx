"use client";

import React from "react";
// import { Typography } from "@material-tailwind/react";
import { useGallery } from "@/contexts/galleryContext";

export default function ImageFrame({ imageData, onClick }) {
  const { video_name, frame_idx, similarity_score, src } = imageData;
  const { imagesPerRow } = useGallery();

  return (
    <div
      className="relative m-px box-border border-blue-600 hover:border-green-800"
      style={{
        borderWidth: imagesPerRow > 7 ? "2px" : "3px"
      }}
      onClick={onClick}
    >
      <img
        className="w-full object-cover object-center"
        src={src}
        alt={`${video_name}_${frame_idx}`}
      />
      {/* <div className="absolute bottom-0.5 right-0.5 z-10 flex flex-row gap-1">
        {[`${video_name}_${frame_idx}`, `${similarity_score}`].map(
          (str, idx) => (
            <Typography
              variant="small"
              color="white"
              className="bg-blue-800 bg-opacity-60 px-0.5 h-fit rounded-sm flex font-bold"
              key={idx}
            >
              {str}
            </Typography>
          )
        )}
      </div> */}
    </div>
  );
}
