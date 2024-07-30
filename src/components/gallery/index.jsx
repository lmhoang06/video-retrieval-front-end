"use client";

import React from "react";
import { GalleryProvider } from "@/contexts/galleryContext";
import GallerySetting from "../gallerySetting";
import GalleryContent from "../galleryContent";

export default function Gallery({ className }) {
  /**
   * Mỗi phần tử trong danh sách imageList có dạng như sau:
   *  {
   *    video_name: string
   *    frame_idx: int
   *    similarity_score: double (in range [0; 1])
   *    src: string or null
   *  }
   */
  return (
    <GalleryProvider>
      <div className={className}>
        <div className="h-full flex flex-col">
          <GallerySetting className="p-2 pb-0" />
          <GalleryContent />
        </div>
      </div>
    </GalleryProvider>
  );
}
