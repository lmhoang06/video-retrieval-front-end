"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const GalleryContext = createContext(null);

export function GalleryProvider({ children }) {
  const [imagesPerRow, setImagesPerRow] = useState(8);
  const [imagesPerPage, setImagesPerPage] = useState(80);
  // flat: original paginated grid, grouped: by videoName (sections), slider shared
  const [viewMode, setViewMode] = useState("flat");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize viewMode from URL or localStorage on mount
  useEffect(() => {
    try {
      const urlView = searchParams?.get("view");
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("gallery:viewMode") : null;
      const initial = (urlView === "flat" || urlView === "grouped")
        ? urlView
        : (stored === "flat" || stored === "grouped") ? stored : "flat";
      if (initial !== viewMode) setViewMode(initial);
    } catch (_) {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist changes to URL and localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("gallery:viewMode", viewMode);
      }
      if (router && pathname) {
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set("view", viewMode);
        router.replace(`${pathname}?${params.toString()}`);
      }
    } catch (_) {
      // noop
    }
  }, [viewMode, router, pathname, searchParams]);

  const value = {
    imagesPerRow,
    setImagesPerRow,
    imagesPerPage,
    setImagesPerPage,
    viewMode,
    setViewMode,
  };

  return (
    <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>
  );
}

export const useGallery = () => useContext(GalleryContext);
